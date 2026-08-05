import type { gsap as GsapNamespace } from 'gsap';
import { useEffect, useRef, type RefObject } from 'react';

import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/**
 * GSAP is loaded with a dynamic import inside an effect — not a static import,
 * and not `React.lazy`.
 *
 * Three things fall out of that, all of them wanted:
 *
 *  1. **45kB of gzipped animation runtime leaves the landing chunk.** It is
 *     fetched once the page is interactive, which is the earliest it could
 *     possibly matter, since it only drives scroll.
 *  2. **The page stays prerenderable.** `React.lazy` suspends during server
 *     rendering; an effect simply never runs. A component that suspends forces
 *     React into out-of-order streaming, and the prerendered file then needs
 *     JavaScript to assemble itself — which defeats the point.
 *  3. **Reduced motion costs nothing.** The import is inside the guard, so a
 *     visitor who has asked for less motion never downloads the library.
 */

type Gsap = typeof GsapNamespace;

/** The slice of ScrollTrigger this module drives. */
interface ScrollTriggerApi {
  update: () => void;
  refresh: () => void;
  scrollerProxy: (
    element: Element,
    config: { scrollTop: (value?: number) => number | undefined },
  ) => void;
}

let lenisBound = false;

async function loadGsap(): Promise<{ gsap: Gsap; ScrollTrigger: ScrollTriggerApi }> {
  // Named imports on both: GSAP ships CommonJS, and its default export is the
  // module namespace rather than the gsap object under Node's interop.
  const [{ gsap }, scrollTriggerModule] = await Promise.all([
    import('gsap'),
    import('gsap/ScrollTrigger'),
  ]);

  const { ScrollTrigger } = scrollTriggerModule;
  gsap.registerPlugin(ScrollTrigger);

  // The plugin's published types describe far more surface than this module
  // touches; narrowing to `ScrollTriggerApi` at the boundary keeps the rest of
  // the file honest about what it actually depends on.
  return { gsap, ScrollTrigger: ScrollTrigger };
}

/**
 * Binds ScrollTrigger to Lenis.
 *
 * Lenis interpolates scroll on its own timeline, so the native `scroll` event
 * ScrollTrigger listens to fires at the *raw* position, not the smoothed one.
 * Without this bridge every pinned section lags the content by the smoothing
 * duration — the single most common symptom of pairing the two libraries.
 */
function bindLenis(scrollTrigger: ScrollTriggerApi): void {
  if (lenisBound) return;
  const lenis = window.__lenis;
  if (!lenis) return;

  lenis.on('scroll', () => {
    scrollTrigger.update();
  });
  scrollTrigger.scrollerProxy(document.documentElement, {
    scrollTop(value?: number) {
      if (typeof value === 'number') lenis.scrollTo(value, { immediate: true });
      return lenis.scroll;
    },
  });
  lenisBound = true;
}

/**
 * Scoped GSAP context.
 *
 * `gsap.context()`, reverted on cleanup. This is the only correct pattern in
 * React 18+: without it, StrictMode's double-invoke leaves a duplicate set of
 * triggers behind, pinned sections stack, and the page ends up several
 * thousand pixels taller than it should be.
 *
 * `useEffect` rather than `useLayoutEffect`, now that the library arrives
 * asynchronously — there is nothing to measure synchronously before paint, and
 * `useLayoutEffect` warns during server rendering for no benefit.
 *
 * Under reduced motion nothing is loaded and nothing is registered. The
 * sections keep their natural document flow, which is what they are authored
 * to look like anyway.
 */
export function useGsapContext(
  scope: RefObject<HTMLElement | null>,
  // `gsap` is handed to the callback rather than imported by it: the library
  // only exists once the dynamic import has settled, so a call site that
  // imported it directly would pull it back into the initial chunk.
  build: (gsap: Gsap, context: gsap.Context) => void,
  dependencies: readonly unknown[] = [],
): void {
  const reducedMotion = usePrefersReducedMotion();
  const buildRef = useRef(build);
  buildRef.current = build;

  useEffect(() => {
    if (reducedMotion || !scope.current) return;

    let context: gsap.Context | null = null;
    // The effect may be torn down before the import settles — on a fast route
    // change, or under StrictMode's double-invoke.
    let cancelled = false;

    void loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (cancelled || !scope.current) return;

      bindLenis(ScrollTrigger);

      context = gsap.context((self) => {
        buildRef.current(gsap, self);
      }, scope);

      // Fonts and images settle after mount and change every measurement the
      // triggers were built from.
      void document.fonts.ready.then(() => {
        if (!cancelled) ScrollTrigger.refresh();
      });
    });

    return () => {
      cancelled = true;
      context?.revert();
    };
    // `build` is intentionally excluded — it is read through a ref so an
    // inline arrow at the call site does not tear down every trigger on
    // every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, reducedMotion, ...dependencies]);
}
