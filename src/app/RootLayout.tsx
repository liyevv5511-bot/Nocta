import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { MagneticCursor } from '@/features/shell/MagneticCursor';
import { SiteFooter } from '@/features/shell/SiteFooter';
import { SiteHeader } from '@/features/shell/SiteHeader';
import { useLenis } from '@/lib/useLenis';
import { routeTransition } from '@/lib/motion';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';

import { AppErrorBoundary } from './error-boundary';

/**
 * The application shell.
 *
 * Responsibilities, in order of how easy they are to get wrong:
 *
 *  1. **Scroll restoration.** React Router does not reset scroll on
 *     navigation, and Lenis has its own scroll position, so both are reset
 *     here explicitly on pathname change.
 *  2. **Focus management.** After a route change, focus is moved to the main
 *     landmark. Without this, a keyboard or screen-reader user stays parked
 *     on a link that no longer exists and has to tab from the top again.
 *  3. **Route transitions.** `mode="wait"` so the outgoing page finishes
 *     leaving before the next arrives — crossfading two full pages produces a
 *     scroll-height jump mid-animation.
 */
export function RootLayout(): React.ReactElement {
  const location = useLocation();
  const reducedMotion = usePrefersReducedMotion();
  useLenis();

  const isFirstRender = useRef(true);

  useEffect(() => {
    // The first render is a page *load*, not a navigation. Moving focus here
    // would land the user inside <main> before they have reached the skip
    // link — which defeats the skip link entirely.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    window.__lenis?.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-svh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[var(--z-modal)] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-accent-contrast"
      >
        Skip to content
      </a>

      <SiteHeader />

      <main id="main" tabIndex={-1} data-focus-unstyled className="flex-1">
        <AppErrorBoundary resetKey={location.pathname}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              variants={routeTransition}
              initial={reducedMotion ? false : 'hidden'}
              animate="visible"
              exit={reducedMotion ? undefined : 'exit'}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </AppErrorBoundary>
      </main>

      <SiteFooter />
      <MagneticCursor />
    </div>
  );
}
