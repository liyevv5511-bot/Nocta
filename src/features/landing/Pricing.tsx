import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { GlassPanel, Toggle } from '@/features/ui';
import { cn } from '@/lib/cn';
import { CITIES } from '@/data/cities';
import { useLocale } from '@/i18n/useLocale';
import { formatCurrency } from '@/lib/format';
import { fadeUp, inViewport, stagger } from '@/lib/motion';

/** Which tier is highlighted, and what each costs. Copy lives in the dictionary. */
interface Tier {
  id: 'free' | 'pro' | 'team';
  monthly: number;
  featured: boolean;
}

const TIERS: readonly Tier[] = [
  { id: 'free', monthly: 0, featured: false },
  { id: 'pro', monthly: 8, featured: true },
  { id: 'team', monthly: 24, featured: false },
];

/** Two months free — stated as a number rather than implied by a badge. */
const ANNUAL_MULTIPLIER = 10;

export function Pricing(): React.ReactElement {
  const { t } = useTranslation();
  const locale = useLocale();
  const [annual, setAnnual] = useState(true);

  return (
    <section aria-labelledby="pricing-heading" className="section-y">
      <div className="container-content">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow">{t('pricing.eyebrow')}</p>
            <h2 id="pricing-heading" className="mt-4 max-w-xl text-display-2 text-primary">
              {t('pricing.heading')}
            </h2>
            <p className="mt-5 max-w-prose text-body-lg text-secondary">{t('pricing.body')}</p>
          </div>

          <Toggle
            checked={annual}
            onChange={setAnnual}
            label={t('pricing.annual')}
            description={t('pricing.annualNote')}
          />
        </div>

        <motion.div
          variants={stagger(0.08)}
          initial="hidden"
          whileInView="visible"
          viewport={inViewport}
          className="mt-14 grid gap-5 lg:grid-cols-3"
        >
          {TIERS.map((tier) => {
            const price = annual ? (tier.monthly * ANNUAL_MULTIPLIER) / 12 : tier.monthly;

            return (
              <motion.div key={tier.id} variants={fadeUp}>
                <GlassPanel
                  radius="xl"
                  tone={tier.featured ? 'strong' : 'default'}
                  className={cn('flex h-full flex-col p-7', tier.featured && 'shadow-glow')}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-h3 text-primary">{t(`pricing.tiers.${tier.id}.name`)}</h3>
                    {tier.featured ? (
                      <span className="rounded-pill bg-accent-muted px-2.5 py-1 text-mono-xs tracking-[0.09em] text-accent uppercase">
                        {t('pricing.mostUseful')}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2 text-sm text-secondary">
                    {t(`pricing.tiers.${tier.id}.blurb`)}
                  </p>

                  <p className="mt-6 flex items-baseline gap-1.5">
                    <span className="tabular text-display-2 text-primary">
                      {tier.monthly === 0
                        ? t('common.free')
                        : formatCurrency(Math.round(price), 'EUR', locale)}
                    </span>
                    {tier.monthly === 0 ? null : (
                      <span className="text-sm text-tertiary">{t('pricing.perMonth')}</span>
                    )}
                  </p>

                  <ul className="mt-7 flex-1 space-y-3">
                    {t(`pricing.tiers.${tier.id}.features`, {
                      returnObjects: true,
                      cities: CITIES.length,
                    }).map((feature) => (
                      <li key={feature} className="flex gap-3 text-sm text-secondary">
                        <svg
                          viewBox="0 0 24 24"
                          className="mt-0.5 size-4 shrink-0 text-accent"
                          fill="none"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            d="M5 12.5l4.5 4.5L19 7"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/plan"
                    className={cn(
                      'mt-8 flex h-12 items-center justify-center rounded-md font-medium transition-colors',
                      tier.featured
                        ? 'bg-accent text-accent-contrast hover:bg-accent-hover'
                        : 'border border-default text-primary hover:bg-surface-hover',
                    )}
                  >
                    {t(`pricing.tiers.${tier.id}.cta`)}
                  </Link>
                </GlassPanel>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
