import type { Transition, Variants } from 'framer-motion';

/**
 * The motion vocabulary.
 *
 * Every animation in the product is composed from the easings, durations and
 * variants declared here. Inline `transition={{ duration: 0.3 }}` objects are
 * how a design system dies — one component eases differently, then two, then
 * the whole thing feels assembled rather than designed.
 *
 * Durations mirror the CSS tokens (200/400/700ms) so a CSS transition and a
 * Framer animation on adjacent elements resolve together.
 */

export const EASE = {
  /** House curve. Decisive departure, long soft settle. */
  outExpo: [0.16, 1, 0.3, 1],
  inOutSoft: [0.65, 0, 0.35, 1],
  /** Slight overshoot — for things that should feel physical (cards, chips). */
  springOut: [0.34, 1.56, 0.64, 1],
} as const;

export const DURATION = {
  fast: 0.2,
  base: 0.4,
  slow: 0.7,
} as const;

/** Spring used wherever an element is dragged, snapped, or picked up. */
export const SPRING: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 34,
  mass: 0.9,
};

/** Softer spring for large surfaces (panels, city cards flying in). */
export const SPRING_SOFT: Transition = {
  type: 'spring',
  stiffness: 220,
  damping: 30,
  mass: 1,
};

const ease = EASE.outExpo;

export const transition = {
  fast: { duration: DURATION.fast, ease },
  base: { duration: DURATION.base, ease },
  slow: { duration: DURATION.slow, ease },
} satisfies Record<string, Transition>;

/* -------------------------------------------------------------------------
 * Entrance variants
 * ---------------------------------------------------------------------- */

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transition.base },
  exit: { opacity: 0, transition: transition.fast },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: transition.base },
  exit: { opacity: 0, y: -12, transition: transition.fast },
};

export const fadeUpLarge: Variants = {
  hidden: { opacity: 0, y: 48 },
  visible: { opacity: 1, y: 0, transition: transition.slow },
  exit: { opacity: 0, y: -24, transition: transition.base },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: SPRING },
  exit: { opacity: 0, scale: 0.97, transition: transition.fast },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: SPRING_SOFT },
  exit: { opacity: 0, x: 24, transition: transition.fast },
};

/* -------------------------------------------------------------------------
 * Orchestration
 * ---------------------------------------------------------------------- */

/**
 * Parent variant that walks its children in. Children must declare
 * `hidden`/`visible` keys — typically by using one of the variants above.
 */
export function stagger(childDelay = 0.06, initialDelay = 0): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: childDelay,
        delayChildren: initialDelay,
      },
    },
    exit: {
      transition: { staggerChildren: childDelay / 2, staggerDirection: -1 },
    },
  };
}

/** Per-character headline reveal. Pairs with `useSplitText`. */
export const charReveal: Variants = {
  hidden: { opacity: 0, y: '0.6em', rotateX: -55 },
  visible: {
    opacity: 1,
    y: '0em',
    rotateX: 0,
    transition: { duration: DURATION.slow, ease },
  },
};

/* -------------------------------------------------------------------------
 * Route transitions
 * ---------------------------------------------------------------------- */

export const routeTransition: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease } },
  exit: { opacity: 0, y: -8, transition: { duration: DURATION.fast, ease } },
};

/* -------------------------------------------------------------------------
 * Interaction presets
 * ---------------------------------------------------------------------- */

export const hoverLift = {
  whileHover: { y: -4, transition: transition.fast },
  whileTap: { y: 0, scale: 0.985, transition: { duration: 0.1, ease } },
} as const;

export const pressable = {
  whileHover: { scale: 1.02, transition: transition.fast },
  whileTap: { scale: 0.97, transition: { duration: 0.1, ease } },
} as const;

/**
 * `viewport` config used by every scroll-triggered entrance, so elements all
 * commit at the same point on screen. `once` because re-animating on scroll-up
 * reads as a glitch, not as polish.
 */
export const inViewport = {
  once: true,
  amount: 0.25,
  margin: '0px 0px -10% 0px',
} as const;

/**
 * Collapses a variant set to its resting state. Used by `MotionProvider` when
 * `prefers-reduced-motion` is set: elements still mount, they just arrive.
 */
export const STATIC_VARIANTS: Variants = {
  hidden: { opacity: 1, y: 0, x: 0, scale: 1, rotateX: 0 },
  visible: { opacity: 1, y: 0, x: 0, scale: 1, rotateX: 0, transition: { duration: 0 } },
  exit: { opacity: 1, transition: { duration: 0 } },
};
