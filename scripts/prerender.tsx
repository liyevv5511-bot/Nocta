import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { prerenderPaths } from '../src/app/routes';

import { renderRouteToHtml } from './renderRoute';

/**
 * Build-time prerendering.
 *
 * An SPA serves the same empty shell for every URL. That costs a crawler its
 * first render pass, costs the visitor a round trip before anything appears,
 * and costs every non-JS consumer — link unfurlers, previews, readers — the
 * page entirely. This script renders each static route to real HTML at build
 * time and writes it next to the assets.
 *
 * Rendering itself lives in `renderRoute.tsx`, which the hydration test also
 * calls — so what the test proves is what the build ships.
 *
 * The output is hydrated, not replaced: `main.tsx` calls `hydrateRoot` when
 * the document was prerendered for the path being visited, so the HTML a
 * crawler reads is the same DOM the visitor ends up interacting with.
 */

const DIST = join(process.cwd(), 'dist');
const SHELL = join(DIST, 'index.html');

/**
 * Records *which* path a document was prerendered for.
 *
 * Not a boolean. Every host's SPA fallback serves `index.html` for paths it
 * has no file for, so a visitor landing on `/saved` receives the prerendered
 * *landing page* and the client router then renders Saved into it. A boolean
 * flag would tell the client to hydrate that, and hydrating one page's markup
 * with another page's tree fails outright. The client compares this to the
 * real location and only hydrates when they agree.
 */
const PRERENDERED_ATTRIBUTE = 'data-prerendered';

/**
 * Marks a hoisted metadata tag.
 *
 * These tags sit in `<head>`, outside the React root, so React never diffs
 * them — it simply renders its own copies on hydration and the document ends
 * up with two of everything, including two canonical links. `main.tsx`
 * removes anything carrying this attribute immediately before hydrating: the
 * prerendered copies exist for consumers that do not run JavaScript, and are
 * handed back to React for everyone else.
 */
const META_MARKER = 'data-prerender-meta';

/**
 * Copies the metadata React rendered inline into `<head>`.
 *
 * **Copies, not moves.** React 19 hoists `<title>`, `<meta>` and `<link>` to
 * the head in the browser, but a server render emits them where the component
 * sat — inside `#root`. Removing them from the body was the obvious first
 * implementation and it silently broke hydration: React expects to find the
 * nodes it rendered, does not, and throws the whole prerendered tree away.
 *
 * So both copies exist in the file. The head copy carries `data-prerender-meta`
 * and is what a crawler or link unfurler reads; `main.tsx` deletes it a moment
 * before hydrating, handing ownership back to React and leaving exactly one of
 * each tag in a live document.
 *
 * Each tag family gets its own explicit pattern rather than one clever
 * alternation. The clever version matched the `>` of an opening `<title>` and
 * left the text and closing tag stranded in the body — an "it looks fine"
 * failure that only shows up when you read the output.
 */
const METADATA_PATTERNS: readonly RegExp[] = [
  /<title>[\s\S]*?<\/title>/g,
  /<script type="application\/ld\+json">[\s\S]*?<\/script>/g,
  /<meta\b[^>]*?\/?>/g,
  /<link\b[^>]*?\/?>/g,
];

/**
 * Tags Vite injected into the shell; they are not component metadata.
 *
 * `rel="preload"` is deliberately *not* in this list. React emits one for the
 * hero image of a priority `<Photo>`, and a preload is only worth having in
 * `<head>` — left in the body it starts no earlier than the image itself.
 */
function isBuildAsset(tag: string): boolean {
  return (
    tag.includes('rel="stylesheet"') ||
    tag.includes('rel="modulepreload"') ||
    tag.includes('rel="icon"')
  );
}

/** Inserts the marker attribute into a tag's opening bracket. */
function markTag(tag: string): string {
  return tag.replace(/^<([a-zA-Z]+)/, `<$1 ${META_MARKER}`);
}

function hoistMetadata(shell: string, body: string): { head: string; body: string } {
  const hoisted: string[] = [];

  for (const pattern of METADATA_PATTERNS) {
    for (const match of body.match(pattern) ?? []) {
      if (isBuildAsset(match)) continue;
      hoisted.push(markTag(match));
    }
  }

  // A route's own <title> replaces the shell's placeholder rather than being
  // appended — two titles is exactly the duplicate-tag problem this pipeline
  // is meant to fix.
  const routeTitle = hoisted.find((tag) => tag.startsWith('<title'));
  let head = shell;

  if (routeTitle !== undefined) {
    head = head.replace(/<title>[\s\S]*?<\/title>/, routeTitle);
  }

  const rest = hoisted.filter((tag) => tag !== routeTitle);
  if (rest.length > 0) {
    head = head.replace('</head>', `  ${rest.join('\n    ')}\n  </head>`);
  }

  // The body is returned untouched — see the note above.
  return { head, body };
}

async function main(): Promise<void> {
  const shell = await readFile(SHELL, 'utf8');

  // `/` is written back over `dist/index.html`, so a second run would read a
  // prerendered page as its shell and nest the app inside itself. Vite
  // regenerates a clean shell on every build; refuse rather than corrupt.
  if (shell.includes(`${PRERENDERED_ATTRIBUTE}=`)) {
    throw new Error(
      'dist/index.html is already prerendered. Run `vite build` first — prerendering is not idempotent by design.',
    );
  }

  const paths = prerenderPaths();

  for (const path of paths) {
    const rendered = await renderRouteToHtml(path);
    const { head, body } = hoistMetadata(shell, rendered);

    const html = head
      .replace('<html lang="en"', `<html lang="en" ${PRERENDERED_ATTRIBUTE}="${path}"`)
      .replace('<div id="root"></div>', `<div id="root">${body}</div>`);

    const file = path === '/' ? join(DIST, 'index.html') : join(DIST, path, 'index.html');
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, html, 'utf8');
  }

  console.log(`[prerender] wrote ${String(paths.length)} routes: ${paths.join(', ')}`);
}

main().catch((error: unknown) => {
  console.error('[prerender] failed', error);
  process.exitCode = 1;
});
