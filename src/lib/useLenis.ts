import Lenis from 'lenis';
import { useEffect, useRef } from 'react';

import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/**
 * Smooth scrolling, and the scroll value everything else reads from.
 *
 * Lenis replaces native scrolling with an interpolated one. Two consequences
 * this hook handles rather than ignores:
 *
 *   1. GSAP ScrollTrigger no longer sees native scroll events. Lenis must
 *      drive `ScrollTrigger.update()` on every frame, which is why the
 *      instance is published on `window.__lenis` for the scroll module to
 *      attach to rather than each component creating its own.
 *   2. Under `prefers-reduced-motion`, interpolated scrolling is exactly the
 *      thing the user asked not to have. Lenis is not instantiated at all —
 *      not merely configured to be fast.
 */

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

export function useLenis(): void {
  const reducedMotion = usePrefersReducedMotion();
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (reducedMotion) return;

    const lenis = new Lenis({
      // ~0.7s to settle. Long enough to read as momentum, short enough that a
      // deliberate scroll to a section does not feel like it is fighting you.
      duration: 0.9,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
      // Touch devices already have excellent native momentum; overriding it
      // is the single most common way smooth-scroll libraries ruin mobile.
      syncTouch: false,
      touchMultiplier: 1.6,
    });

    window.__lenis = lenis;

    const raf = (time: number): void => {
      lenis.raf(time);
      frameRef.current = requestAnimationFrame(raf);
    };
    frameRef.current = requestAnimationFrame(raf);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      lenis.destroy();
      delete window.__lenis;
    };
  }, [reducedMotion]);
}

/** Scrolls to an element or offset, honouring the reduced-motion setting. */
export function scrollTo(target: string | number, offset = 0): void {
  const lenis = window.__lenis;
  if (lenis) {
    lenis.scrollTo(target, { offset });
    return;
  }

  if (typeof target === 'number') {
    window.scrollTo({ top: target + offset, behavior: 'auto' });
    return;
  }

  document.querySelector(target)?.scrollIntoView({ block: 'start' });
}
