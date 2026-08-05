/**
 * The canonical origin, resolved once for every consumer.
 *
 * Hardcoding a domain is how a project ends up telling Google that the real
 * page lives somewhere it does not — and a wrong canonical is worse than none,
 * because it de-indexes the page that actually exists.
 *
 * Three consumers, one answer:
 *
 *   the browser bundle   `__SITE_URL__`, a literal Vite bakes in at build time
 *   the prerenderer      the same resolution, run under Node
 *   the build scripts    ditto — sitemap, robots, Open Graph
 *
 * The prerenderer is why the environment branch exists at all: it renders the
 * same components as the browser, but under `tsx` rather than through Vite, so
 * `__SITE_URL__` is undefined there. An earlier version resolved this only in
 * `vite.config.ts` and the prerendered pages silently kept the localhost
 * canonical in production.
 *
 * Resolution order, first match wins:
 *
 *   1. `__SITE_URL__`                    — injected into the client bundle.
 *   2. `NOCTA_SITE_URL`                  — explicit override, for a custom domain.
 *   3. `VERCEL_PROJECT_PRODUCTION_URL`   — the project's stable production
 *      hostname, provided by Vercel at build time. This is what makes the
 *      deployment self-describing: whatever URL the project ends up with, the
 *      canonical, the sitemap and the OG cards agree with it, with nothing to
 *      edit.
 *   4. `http://localhost:4173`           — the static preview, so a local
 *      build and its E2E run are coherent.
 */

declare const __SITE_URL__: string | undefined;

const LOCAL_ORIGIN = 'http://localhost:4173';

/** Adds a scheme if one is missing and strips any trailing slash. */
function normalise(value: string): string {
  const withScheme = /^https?:\/\//.test(value) ? value : `https://${value}`;
  return withScheme.replace(/\/+$/, '');
}

/**
 * Node-side resolution. Unreachable from the browser bundle, where
 * `__SITE_URL__` is always a literal and this branch is dead code.
 */
export function resolveSiteUrl(): string {
  if (typeof process === 'undefined') return LOCAL_ORIGIN;

  const explicit = process.env.NOCTA_SITE_URL;
  if (explicit !== undefined && explicit.length > 0) return normalise(explicit);

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel !== undefined && vercel.length > 0) return normalise(vercel);

  return LOCAL_ORIGIN;
}

export const SITE_URL: string = typeof __SITE_URL__ === 'string' ? __SITE_URL__ : resolveSiteUrl();

/** Absolute URL for a route path, e.g. `/destination/lisbon`. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

/** Absolute URL for a generated Open Graph card, e.g. `city-lisbon`. */
export function ogImageUrl(card: string): string {
  return `${SITE_URL}/og/${card}.png`;
}
