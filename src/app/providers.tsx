import { MotionConfig } from 'framer-motion';
import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';

import { watchSystemTheme } from '@/features/theme/theme.store';
import { ToastViewport } from '@/features/ui';
import { EASE, DURATION } from '@/lib/motion';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';

import { router } from './router';

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
 */
export function AppProviders(): React.ReactElement {
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
