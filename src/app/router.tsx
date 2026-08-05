import { lazy, Suspense } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';

import { RouteErrorBoundary } from './error-boundary';
import { RootLayout } from './RootLayout';
import { RouteFallback } from './RouteFallback';

/**
 * Routes.
 *
 * Every route is `lazy()`, including the landing page. That looks excessive
 * until you look at what the landing page pulls in — GSAP, the globe, the
 * scroll choreography — none of which belongs in the entry chunk that gates
 * first paint. The entry bundle is the shell, the header and the router; the
 * rest arrives per route.
 *
 * `Suspense` sits *inside* the layout so the header and skip-link render
 * immediately and stay put across navigations, which keeps CLS at zero during
 * a route change and gives keyboard users something to land on.
 */

const Landing = lazy(async () => ({ default: (await import('@/routes/Landing')).Landing }));
const Plan = lazy(async () => ({ default: (await import('@/routes/Plan')).Plan }));
const Trip = lazy(async () => ({ default: (await import('@/routes/Trip')).Trip }));
const SavedTrips = lazy(async () => ({ default: (await import('@/routes/Saved')).Saved }));
const Styleguide = lazy(async () => ({
  default: (await import('@/routes/Styleguide')).Styleguide,
}));
const NotFound = lazy(async () => ({ default: (await import('@/routes/NotFound')).NotFound }));

function withSuspense(node: React.ReactNode): React.ReactElement {
  return <Suspense fallback={<RouteFallback />}>{node}</Suspense>;
}

const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: withSuspense(<Landing />) },
      { path: 'plan', element: withSuspense(<Plan />) },
      { path: 'trip/:tripId', element: withSuspense(<Trip />) },
      { path: 'saved', element: withSuspense(<SavedTrips />) },
      { path: 'styleguide', element: withSuspense(<Styleguide />) },
      { path: '*', element: withSuspense(<NotFound />) },
    ],
  },
];

export const router = createBrowserRouter(routes);
