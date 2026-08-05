import { motion } from 'framer-motion';
import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';

import { CITIES } from '@/data/cities';
import { fadeUp, stagger } from '@/lib/motion';
import { scrollTo } from '@/lib/useLenis';

import { SplitHeadline } from './SplitHeadline';
import { useHeroParallax } from './useHeroParallax';

/**
 * The globe is code-split away from the entry bundle. It is decorative, it is
 * canvas-heavy, and it is not needed for first paint — three good reasons for
 * it never to be in the chunk that gates LCP.
 */
const HeroGlobe = lazy(async () => ({
  default: (await import('./HeroGlobe')).HeroGlobe,
}));

export function Hero(): React.ReactElement {
  const parallax = useHeroParallax();

  return (
    <section
      ref={parallax.ref}
      className="relative isolate flex min-h-[92svh] items-center overflow-hidden"
    >
      {/* Layer 1 — ambient field, slowest. */}
      <motion.div
        aria-hidden="true"
        style={{ y: parallax.back }}
        className="aurora-field animate-drift absolute inset-0 -z-30 opacity-70"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-30 bg-[radial-gradient(80%_60%_at_50%_0%,transparent,var(--canvas))]"
      />

      {/* Layer 2 — the globe. */}
      <motion.div
        style={{ y: parallax.mid, scale: parallax.scale }}
        className="absolute inset-y-0 right-[-20%] -z-20 w-[85vmin] opacity-60 sm:right-[-8%] lg:right-[2%] lg:opacity-100"
      >
        <Suspense fallback={null}>
          <HeroGlobe className="size-full" />
        </Suspense>
      </motion.div>

      {/* Layer 3 — content, fastest, leaves first. */}
      <motion.div
        style={{ y: parallax.front, opacity: parallax.fade }}
        className="container-content relative z-10 py-24"
      >
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="eyebrow inline-flex items-center gap-2 rounded-pill border border-subtle px-3 py-1.5"
        >
          <span className="size-1.5 rounded-pill bg-accent" aria-hidden="true" />
          {CITIES.length} cities · 100+ venues · zero stock photos of a couple pointing
        </motion.p>

        <SplitHeadline
          text="Itineraries that read like a local wrote them."
          emphasise={['local', 'wrote']}
          delay={0.15}
          className="mt-7 max-w-4xl text-display-1 text-primary"
        />

        <motion.div
          variants={stagger(0.08, 0.9)}
          initial="hidden"
          animate="visible"
          className="mt-8 max-w-xl"
        >
          <motion.p variants={fadeUp} className="text-body-lg text-secondary">
            Pick a city, a mood and a budget. Nocta streams back an hour-by-hour plan with real
            venues, real opening quirks and real walking times between them — then lets you drag the
            whole thing into a shape you actually like.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              to="/plan"
              data-magnetic
              className="inline-flex h-14 items-center rounded-lg bg-accent px-7 text-body-lg font-medium text-accent-contrast shadow-glow transition-colors hover:bg-accent-hover"
            >
              Plan a trip
            </Link>

            <button
              type="button"
              data-magnetic
              onClick={() => {
                scrollTo('#how-it-works');
              }}
              className="inline-flex h-14 items-center rounded-lg border border-default px-7 text-body-lg font-medium text-primary transition-colors hover:bg-surface-hover"
            >
              How it works
            </button>
          </motion.div>

          <motion.p variants={fadeUp} className="mt-6 text-sm text-tertiary">
            No account. No booking funnel. Plans stay in your browser.
          </motion.p>
        </motion.div>
      </motion.div>

      <ScrollHint />
    </section>
  );
}

function ScrollHint(): React.ReactElement {
  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.8, duration: 0.7 }}
      className="absolute inset-x-0 bottom-8 flex justify-center"
    >
      <motion.span
        animate={{ y: [0, 7, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        className="flex h-9 w-6 items-start justify-center rounded-pill border border-default pt-2"
      >
        <span className="size-1 rounded-pill bg-tertiary" />
      </motion.span>
    </motion.div>
  );
}
