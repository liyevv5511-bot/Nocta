import { MotionConfig } from 'framer-motion';
import { useEffect } from 'react';
import { RouterProvider, type createBrowserRouter } from 'react-router-dom';

import { watchSystemTheme } from '@/features/theme/theme.store';
import { ToastViewport } from '@/features/ui';
import { EASE, DURATION } from '@/lib/motion';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';

/** Either a browser router (the app) or a memory router (the prerenderer). */
export type AppRouter = ReturnType<typeof createBrowserRouter>;

/**
 * Global providers.
 *
 * `MotionConfig` is doing real work here, not decoration:
 *
 *  - `reducedMotion="user"` makes Framer respect the OS setting *globally*.
 *    Transform and opacity animations are skipped at the library level, so a
 *    component that forgets to check the media query still behaves correctly.
 *    That is the difference between reduced motion as a policy and reduced
 *    motion as a convention.
 *  - the default transition means a component that omits one still lands on
 *    the house curve rather than Framer's default spring.
 *
 * The router is injected rather than imported. `router.tsx` calls
 * `createBrowserRouter` at module scope, which needs a `window`; the
 * prerenderer hands in a memory router instead. That the two share this
 * component is the point — the server must render the identical tree, down to
 * the toast layer, or hydration finds a different set of children at the root
 * and discards everything below it.
 */
export function AppProviders({ router }: { router: AppRouter }): React.ReactElement {
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => watchSystemTheme(), []);

  return (
    <MotionConfig
      reducedMotion="user"
      transition={
        reducedMotion ? { duration: 0 } : { duration: DURATION.base, ease: [...EASE.outExpo] }
      }
    >
      <RouterProvider router={router} />
      <ToastViewport />
    </MotionConfig>
  );
}
