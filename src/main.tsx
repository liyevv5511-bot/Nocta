import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

import '@fontsource-variable/inter';
import './styles/globals.css';

import { AppProviders } from './app/providers';
import { createAppRouter, type PreloadedRoute } from './app/router';
import { matchRoute } from './app/routes';

const container = document.getElementById('root');

// A missing root is a build/deploy failure, not a runtime condition to recover
// from — fail loudly rather than rendering into a detached node.
if (!container) {
  throw new Error('Nocta: #root is missing from index.html');
}

/**
 * Was *this* document prerendered for *this* path?
 *
 * A host's SPA fallback hands out `index.html` for any path it has no file
 * for, so `/saved` arrives carrying the *landing page's* markup. Hydrating one
 * page's DOM with another page's tree fails outright, so the prerenderer
 * stamps the path it rendered and this compares it to the real location.
 */
function wasPrerenderedForThisPath(): boolean {
  const stamped = document.documentElement.dataset.prerendered;
  if (stamped === undefined) return false;

  const normalise = (path: string): string => path.replace(/\/+$/, '') || '/';
  return normalise(stamped) === normalise(window.location.pathname);
}

/**
 * Hands the document's metadata back to React.
 *
 * The prerenderer copies each route's `<title>`/`<meta>`/`<link>` into
 * `<head>` so consumers that never run JavaScript still get them. Those copies
 * live outside the React root, so React renders its own set on top — two
 * canonical links, two descriptions, and a stale title that would win over
 * React's on the next client navigation.
 *
 * Unconditional, not only on the hydration path: a fallback-served document
 * carries *another* route's metadata, which is the case where leaving it in
 * place is most wrong.
 */
function retirePrerenderedMetadata(): void {
  for (const tag of document.querySelectorAll('[data-prerender-meta]')) {
    tag.remove();
  }
}

/**
 * Mounts the app.
 *
 * On a prerendered document the matching route module is awaited *before*
 * hydrating, and handed to the router already resolved. That removes the
 * route's Suspense boundary from the client tree — which is what lets the
 * prerenderer omit it too, and why the HTML on disk is a plain in-order
 * document rather than React's streaming format with its hidden blocks and
 * repair scripts.
 *
 * Everything else — the dev server, a fallback-served path, a route with no
 * prerendered file — mounts fresh and keeps the boundary.
 */
async function mount(root: HTMLElement): Promise<void> {
  retirePrerenderedMetadata();

  if (!wasPrerenderedForThisPath() || !root.hasChildNodes()) {
    // Markup for a different route would otherwise sit in the DOM beneath the
    // new tree until React's first commit replaced it.
    root.replaceChildren();
    createRoot(root).render(
      <StrictMode>
        <AppProviders router={createAppRouter()} />
      </StrictMode>,
    );
    return;
  }

  const route = matchRoute(window.location.pathname);
  let preloaded: PreloadedRoute | undefined;

  if (route) {
    preloaded = { path: route.path, Component: (await route.importer()).default };
  }

  hydrateRoot(
    root,
    <StrictMode>
      <AppProviders router={createAppRouter(preloaded)} />
    </StrictMode>,
  );
}

void mount(container);
