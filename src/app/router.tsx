import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';

import { RootLayout } from './RootLayout';
import { RouteErrorBoundary } from './error-boundary';
import { RouteFallback } from './RouteFallback';
import { ROUTES } from './routes';

/**
 * The browser router.
 *
 * Routes are code-split with `React.lazy`, so no route's chunk is in the entry
 * bundle. One exception is load-bearing: the route being visited *right now*
 * can be handed in already resolved, and is then mounted without a Suspense
 * boundary.
 *
 * That exception exists because of prerendering. React 19 emits every Suspense
 * boundary's content out-of-order — appended in a hidden block and moved into
 * place by an inline script — whether or not it actually suspended. A
 * prerendered file built that way needs JavaScript to assemble itself, which
 * is precisely the audience prerendering serves. `main.tsx` therefore awaits
 * the matching module before hydrating, and both sides render the same
 * boundary-free tree.
 *
 * Every *other* route keeps its boundary; they are only reached by navigation,
 * where a fallback is exactly what you want.
 */

export interface PreloadedRoute {
  path: string;
  Component: ComponentType;
}

function withSuspense(node: ReactNode): React.ReactElement {
  return <Suspense fallback={<RouteFallback />}>{node}</Suspense>;
}

export function buildRouteObjects(preloaded?: PreloadedRoute): RouteObject[] {
  return ROUTES.map((route) => {
    const isPreloaded = preloaded?.path === route.path;
    const Component = isPreloaded ? preloaded.Component : lazy(route.importer);
    const element = isPreloaded ? <Component /> : withSuspense(<Component />);

    return route.path === '' ? { index: true, element } : { path: route.path, element };
  });
}

export function createAppRouter(preloaded?: PreloadedRoute) {
  return createBrowserRouter([
    {
      path: '/',
      element: <RootLayout />,
      errorElement: <RouteErrorBoundary />,
      children: buildRouteObjects(preloaded),
    },
  ]);
}
