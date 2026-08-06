import { PassThrough } from 'node:stream';

import { renderToPipeableStream } from 'react-dom/server';
import { createMemoryRouter } from 'react-router-dom';

import { RootLayout } from '../src/app/RootLayout';
import { RouteErrorBoundary } from '../src/app/error-boundary';
import { AppProviders } from '../src/app/providers';
import { buildRouteObjects } from '../src/app/router';
import { matchRoute } from '../src/app/routes';
import { DEFAULT_LANGUAGE, initI18n } from '../src/i18n';

/**
 * Renders one route to HTML, exactly as the build does.
 *
 * Extracted so `scripts/prerender.tsx` and the hydration test call the same
 * function rather than two lookalikes. The test's first version used
 * `renderToString`, which cannot wait for Suspense — it passed on the pages
 * that had none and told us nothing about the landing page, which is the only
 * page where hydration actually broke.
 *
 * `renderToPipeableStream` with `onAllReady` is what makes this work: every
 * route sits behind `React.lazy`, and so do the landing page's below-the-fold
 * sections. A renderer that cannot await a promise captures Suspense
 * fallbacks — a prerender full of skeletons, which is worse than none because
 * it looks like it succeeded.
 *
 * The tree built here must be *shaped* exactly like the browser's, not merely
 * produce the same visible output. `router.tsx` wraps each route element in a
 * Suspense boundary; resolving the components eagerly and rendering them bare
 * omits the boundary — and with it the `<!--$-->` markers React writes to
 * locate that boundary during hydration. The result is a mismatch on the one
 * page that has nested boundaries, reported as an error code with no useful
 * detail. Hence the wrapper below, which never actually suspends.
 *
 * For the same reason this mounts `AppProviders`, not a bare `RouterProvider`.
 * The client hydrates MotionConfig → [RouterProvider, ToastViewport]; a server
 * tree missing the toast layer differs at the root, and React throws away
 * everything beneath a root-level mismatch.
 */

const RENDER_TIMEOUT_MS = 20_000;

/**
 * Renders a route to in-order HTML.
 *
 * There is deliberately no Suspense-driven code splitting on any prerendered
 * page, which is what lets this stay a single straightforward render.
 *
 * The alternative was discovered the hard way: when a boundary actually
 * suspends, `renderToPipeableStream` emits the shell with fallbacks, appends
 * each boundary's content in a trailing `<div hidden>`, and relies on inline
 * scripts to move them into place. `onAllReady` guarantees the blocks exist —
 * it does not restore document order. The file then contains everything and
 * renders as a page of loading skeletons for anyone without JavaScript, which
 * is the exact audience prerendering exists to serve.
 *
 * The fix was architectural rather than a post-processing trick: heavy
 * dependencies are deferred with a dynamic `import()` inside an effect, which
 * never runs during a server render, instead of with `React.lazy`, which
 * suspends during one. See `lib/useGsapScroll.ts` and `landing/LiveDemo.tsx`.
 */
export async function renderRouteToHtml(path: string): Promise<string> {
  const html = await renderOnce(path);

  if (html.includes('<div hidden id="S:')) {
    if (process.env.NOCTA_DEBUG_PRERENDER === '1') {
      const first = /<div hidden id="S:\d+">([\s\S]{0,200})/.exec(html);
      console.error('[prerender] deferred content begins:', first?.[1]?.replace(/\s+/g, ' '));
    }
    throw new Error(
      `Prerendering ${path} produced out-of-order streaming markup. A component on this route ` +
        'suspends during server rendering — defer it with a dynamic import inside an effect ' +
        'rather than with React.lazy.',
    );
  }

  return html;
}

async function renderOnce(path: string): Promise<string> {
  // The prerendered HTML is English — `main.tsx` skips hydration and renders
  // fresh for anyone whose language differs, rather than hydrating one
  // language's DOM with another's tree.
  await initI18n(DEFAULT_LANGUAGE);

  const route = matchRoute(path);
  if (!route) throw new Error(`No route matches ${path}`);

  // Exactly what `main.tsx` builds on a prerendered document: the active route
  // resolved and mounted without a Suspense boundary, every other route still
  // lazy. Shared with the browser through `buildRouteObjects` so the two trees
  // cannot drift.
  const preloaded = { path: route.path, Component: (await route.importer()).default };

  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <RootLayout />,
        errorElement: <RouteErrorBoundary />,
        children: buildRouteObjects(preloaded),
      },
    ],
    { initialEntries: [path] },
  );

  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const sink = new PassThrough();

    sink.on('data', (chunk: Buffer) => chunks.push(chunk));
    sink.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    sink.on('error', reject);

    const { pipe, abort } = renderToPipeableStream(<AppProviders router={router} />, {
      onAllReady() {
        pipe(sink);
      },
      onError(error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    });

    // A route that never settles must fail the build rather than hang it.
    const timer = setTimeout(() => {
      abort();
      reject(new Error(`Prerender timed out for ${path}`));
    }, RENDER_TIMEOUT_MS);
    timer.unref();

    sink.on('end', () => {
      clearTimeout(timer);
    });
  });
}
