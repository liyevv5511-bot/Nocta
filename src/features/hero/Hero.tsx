import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { CITIES } from '@/data/cities';
import { fadeUp, stagger } from '@/lib/motion';
import { scrollTo } from '@/lib/useLenis';

import { HeroGlobe } from './HeroGlobe';
import { SplitHeadline } from './SplitHeadline';
import { useHeroParallax } from './useHeroParallax';

export function Hero(): React.ReactElement {
  const { t } = useTranslation();
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
        <HeroGlobe className="size-full" />
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
          {t('hero.badge', { count: CITIES.length })}
        </motion.p>

        <SplitHeadline
          text={t('hero.headline')}
          emphasise={t('hero.emphasis', { returnObjects: true })}
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
            {t('hero.body')}
          </motion.p>

          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              to="/plan"
              data-magnetic
              className="inline-flex h-14 items-center rounded-lg bg-accent px-7 text-body-lg font-medium text-accent-contrast shadow-glow transition-colors hover:bg-accent-hover"
            >
              {t('hero.planTrip')}
            </Link>

            <button
              type="button"
              data-magnetic
              onClick={() => {
                scrollTo('#how-it-works');
              }}
              className="inline-flex h-14 items-center rounded-lg border border-default px-7 text-body-lg font-medium text-primary transition-colors hover:bg-surface-hover"
            >
              {t('hero.howItWorks')}
            </button>
          </motion.div>

          <motion.p variants={fadeUp} className="mt-6 text-sm text-tertiary">
            {t('hero.noAccount')}
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
