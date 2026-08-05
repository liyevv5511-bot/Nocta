import { useScroll, useTransform, type MotionValue } from 'framer-motion';
import { useRef } from 'react';

import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';

export interface HeroParallax {
  ref: React.RefObject<HTMLElement | null>;
  /** Furthest layer — the ambient aurora field. Moves least. */
  back: MotionValue<number>;
  /** Mid layer — the globe. */
  mid: MotionValue<number>;
  /** Front layer — the headline and controls. Moves most, leaves first. */
  front: MotionValue<number>;
  /** Headline opacity, so text never scrolls out as an unreadable smear. */
  fade: MotionValue<number>;
  /** Slight scale on the globe, to sell depth without a 3D transform. */
  scale: MotionValue<number>;
}

/**
 * Three-layer scroll parallax for the hero.
 *
 * Driven by `useScroll` against the hero element, which reads from the same
 * scroll position Lenis is interpolating — so the parallax inherits the smooth
 * scrolling rather than fighting it with its own listener.
 *
 * Layer speeds are ordered back < mid < front. That ordering is the entire
 * illusion: reverse any two and the depth cue inverts, which the eye notices
 * immediately even when it cannot name what is wrong.
 *
 * Under reduced motion every layer is pinned to zero. The hero then behaves as
 * a static composition, which it is designed to survive as.
 */
export function useHeroParallax(): HeroParallax {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const distance = reducedMotion ? 0 : 1;

  return {
    ref,
    back: useTransform(scrollYProgress, [0, 1], [0, 60 * distance]),
    mid: useTransform(scrollYProgress, [0, 1], [0, 140 * distance]),
    front: useTransform(scrollYProgress, [0, 1], [0, 260 * distance]),
    fade: useTransform(scrollYProgress, [0, 0.55, 0.85], [1, 1, reducedMotion ? 1 : 0]),
    scale: useTransform(scrollYProgress, [0, 1], [1, reducedMotion ? 1 : 1.12]),
  };
}
