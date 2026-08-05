import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { GlassPanel, Toggle } from '@/features/ui';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import { fadeUp, inViewport, stagger } from '@/lib/motion';

interface Tier {
  id: string;
  name: string;
  monthly: number;
  blurb: string;
  features: readonly string[];
  cta: string;
  featured?: boolean;
}

const TIERS: readonly Tier[] = [
  {
    id: 'free',
    name: 'Free',
    monthly: 0,
    blurb: 'Everything in this demo, permanently.',
    features: [
      'Unlimited plans across all 8 cities',
      'Streamed generation with live reasoning',
      'Drag-to-reorder with automatic re-timing',
      'Up to 30 trips saved in your browser',
    ],
    cta: 'Start planning',
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 8,
    blurb: 'For people who take four trips a year, not one.',
    features: [
      'Everything in Free',
      'Multi-city routes with transfer planning',
      'Offline export to PDF and calendar',
      'Live opening hours and closure warnings',
      'Plans synced across your devices',
    ],
    cta: 'Choose Pro',
    featured: true,
  },
  {
    id: 'team',
    name: 'Team',
    monthly: 24,
    blurb: 'Shared planning for groups that argue over dinner.',
    features: [
      'Everything in Pro',
      'Shared trips with per-person voting',
      'Comment threads on any activity',
      'Split-cost view across the group',
      'Priority generation queue',
    ],
    cta: 'Choose Team',
  },
];

/** Two months free — stated as a number rather than implied by a badge. */
const ANNUAL_MULTIPLIER = 10;

export function Pricing(): React.ReactElement {
  const [annual, setAnnual] = useState(true);

  return (
    <section aria-labelledby="pricing-heading" className="section-y">
      <div className="container-content">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow">Pricing</p>
            <h2 id="pricing-heading" className="mt-4 max-w-xl text-display-2 text-primary">
              Free does the whole job.
            </h2>
            <p className="mt-5 max-w-prose text-body-lg text-secondary">
              This is a portfolio project, so nothing here charges anyone anything. The tiers show
              what a real plan structure would look like — and Free is not a crippled trial.
            </p>
          </div>

          <Toggle
            checked={annual}
            onChange={setAnnual}
            label="Annual billing"
            description="Two months free"
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
                  tone={tier.featured === true ? 'strong' : 'default'}
                  className={cn(
                    'flex h-full flex-col p-7',
                    tier.featured === true && 'shadow-glow',
                  )}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-h3 text-primary">{tier.name}</h3>
                    {tier.featured === true ? (
                      <span className="rounded-pill bg-accent-muted px-2.5 py-1 text-mono-xs tracking-[0.09em] text-accent uppercase">
                        Most useful
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2 text-sm text-secondary">{tier.blurb}</p>

                  <p className="mt-6 flex items-baseline gap-1.5">
                    <span className="tabular text-display-2 text-primary">
                      {tier.monthly === 0 ? 'Free' : formatCurrency(Math.round(price))}
                    </span>
                    {tier.monthly === 0 ? null : (
                      <span className="text-sm text-tertiary">/ month</span>
                    )}
                  </p>

                  <ul className="mt-7 flex-1 space-y-3">
                    {tier.features.map((feature) => (
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
                      tier.featured === true
                        ? 'bg-accent text-accent-contrast hover:bg-accent-hover'
                        : 'border border-default text-primary hover:bg-surface-hover',
                    )}
                  >
                    {tier.cta}
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
