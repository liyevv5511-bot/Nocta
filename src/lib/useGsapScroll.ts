import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLayoutEffect, useRef, type RefObject } from 'react';

import { usePrefersReducedMotion } from './usePrefersReducedMotion';

gsap.registerPlugin(ScrollTrigger);

let lenisBound = false;

/**
 * Binds ScrollTrigger to Lenis.
 *
 * Lenis interpolates scroll on its own timeline, so the native `scroll` event
 * ScrollTrigger listens to fires at the *raw* position, not the smoothed one.
 * Without this bridge every pinned section lags the content by the smoothing
 * duration — the single most common symptom of pairing the two libraries.
 */
function bindLenis(): void {
  if (lenisBound) return;
  const lenis = window.__lenis;
  if (!lenis) return;

  lenis.on('scroll', () => {
    ScrollTrigger.update();
  });
  ScrollTrigger.scrollerProxy(document.documentElement, {
    scrollTop(value) {
      if (typeof value === 'number') lenis.scrollTo(value, { immediate: true });
      return lenis.scroll;
    },
  });
  lenisBound = true;
}

/**
 * Scoped GSAP context.
 *
 * `gsap.context()` inside `useLayoutEffect`, reverted on cleanup. This is the
 * only correct pattern in React 18+: without it, StrictMode's double-invoke
 * leaves a duplicate set of triggers behind, pinned sections stack, and the
 * page ends up several thousand pixels taller than it should be.
 *
 * Under reduced motion nothing is registered at all — the sections keep their
 * natural document flow, which is what they are authored to look like anyway.
 */
export function useGsapContext(
  scope: RefObject<HTMLElement | null>,
  build: (context: gsap.Context) => void,
  dependencies: readonly unknown[] = [],
): void {
  const reducedMotion = usePrefersReducedMotion();
  const buildRef = useRef(build);
  buildRef.current = build;

  useLayoutEffect(() => {
    if (reducedMotion || !scope.current) return;

    bindLenis();
    const context = gsap.context((self) => {
      buildRef.current(self);
    }, scope);

    // Fonts and images settle after mount and change every measurement that
    // the triggers were built from.
    const refresh = (): void => {
      ScrollTrigger.refresh();
    };
    void document.fonts.ready.then(refresh);

    return () => {
      context.revert();
    };
    // `build` is intentionally excluded — it is read through a ref so an
    // inline arrow at the call site does not tear down every trigger on
    // every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, reducedMotion, ...dependencies]);
}

export { gsap, ScrollTrigger };
