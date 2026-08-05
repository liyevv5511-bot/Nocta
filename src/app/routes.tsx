import type { ComponentType } from 'react';

import { CITIES } from '@/data/cities';

/**
 * The route manifest.
 *
 * Routes are declared here as `{ path, importer }` rather than as ready-made
 * elements because two consumers need them in different shapes:
 *
 *   `router.tsx`      wraps each importer in `React.lazy` — the chunk must not
 *                     be in the entry bundle.
 *   `scripts/prerender` **awaits** each importer before rendering. A lazy
 *                     component suspends during server rendering, and a
 *                     prerender that captures the Suspense fallback has
 *                     produced a skeleton, not a page.
 *
 * Keeping one manifest is what stops those two from drifting — adding a route
 * to the router without adding it to the prerenderer would silently ship an
 * unindexable page.
 */

export interface RouteDefinition {
  /** Path relative to the root layout. `''` is the index route. */
  path: string;
  importer: () => Promise<{ default: ComponentType }>;
  /** `false` for routes that cannot be prerendered (dynamic or private). */
  prerender: boolean;
}

const named = async <TKey extends string>(
  loader: () => Promise<Record<TKey, ComponentType>>,
  key: TKey,
): Promise<{ default: ComponentType }> => ({ default: (await loader())[key] });

export const ROUTES: readonly RouteDefinition[] = [
  {
    path: '',
    importer: () => named(() => import('@/routes/Landing'), 'Landing'),
    prerender: true,
  },
  {
    path: 'plan',
    importer: () => named(() => import('@/routes/Plan'), 'Plan'),
    prerender: true,
  },
  {
    path: 'destination/:cityId',
    importer: () => named(() => import('@/routes/Destination'), 'Destination'),
    prerender: true,
  },
  {
    path: 'styleguide',
    importer: () => named(() => import('@/routes/Styleguide'), 'Styleguide'),
    prerender: true,
  },
  {
    // Reads from localStorage; there is nothing to prerender and it is noindex.
    path: 'saved',
    importer: () => named(() => import('@/routes/Saved'), 'Saved'),
    prerender: false,
  },
  {
    // Trips live in the visitor's browser. Prerendering would emit a page
    // that says "not found" for every crawler that fetched it.
    path: 'trip/:tripId',
    importer: () => named(() => import('@/routes/Trip'), 'Trip'),
    prerender: false,
  },
  {
    path: '*',
    importer: () => named(() => import('@/routes/NotFound'), 'NotFound'),
    prerender: false,
  },
];

/**
 * Concrete URLs to write to disk.
 *
 * `destination/:cityId` expands to one path per city — which is the entire
 * reason that route exists rather than a `?destination=` query string. A query
 * string cannot be a file, cannot carry its own Open Graph image, and is
 * routinely collapsed by crawlers.
 */
export function prerenderPaths(): string[] {
  const paths: string[] = [];

  for (const route of ROUTES) {
    if (!route.prerender) continue;

    if (route.path === 'destination/:cityId') {
      paths.push(...CITIES.map((city) => `/destination/${city.id}`));
      continue;
    }

    paths.push(route.path === '' ? '/' : `/${route.path}`);
  }

  return paths;
}

/**
 * The route definition that renders `pathname`.
 *
 * A deliberately small matcher — one dynamic segment, no optionals, no
 * splats beyond the catch-all — because it only has to answer one question at
 * startup: which module must be loaded before hydrating. React Router remains
 * the authority on routing itself.
 */
export function matchRoute(pathname: string): RouteDefinition | undefined {
  const segments = pathname
    .replace(/^\/|\/$/g, '')
    .split('/')
    .filter(Boolean);

  for (const route of ROUTES) {
    if (route.path === '*') continue;

    const pattern = route.path.split('/').filter(Boolean);
    if (pattern.length !== segments.length) continue;

    const matches = pattern.every(
      (part, index) => part.startsWith(':') || part === segments[index],
    );
    if (matches) return route;
  }

  return undefined;
}
