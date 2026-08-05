/**
 * Static route paths.
 *
 * Kept out of `router.tsx` so that module exports components only — otherwise
 * React Fast Refresh cannot hot-swap the router without a full reload.
 * Consumed by the prerender script and the sitemap generator.
 */
export const STATIC_ROUTES = ['/', '/plan', '/saved', '/styleguide'] as const;

export type StaticRoute = (typeof STATIC_ROUTES)[number];
