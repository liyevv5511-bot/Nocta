import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { GlassPanel } from '@/features/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/i18n/useLocale';
import { formatDuration } from '@/lib/format';
import { fadeUp, inViewport, stagger } from '@/lib/motion';

/** Span per item, by how much each has to say. Index-aligned with the copy. */
const SPANS = ['sm:col-span-2 sm:row-span-2', 'sm:col-span-2', '', '', 'sm:col-span-2'];

/**
 * Bento grid.
 *
 * Deliberately not a uniform card grid: the spans are assigned by how much
 * each feature has to say, so the layout carries a hierarchy instead of
 * flattening five unequal things into five equal boxes.
 */
export function BentoFeatures(): React.ReactElement {
  const { t } = useTranslation();
  const items = t('features.items', { returnObjects: true });

  return (
    <section aria-labelledby="features-heading" className="section-y">
      <div className="container-content">
        <p className="eyebrow">{t('features.eyebrow')}</p>
        <h2 id="features-heading" className="mt-4 max-w-2xl text-display-2 text-primary">
          {t('features.heading')}
        </h2>

        <motion.div
          variants={stagger(0.07)}
          initial="hidden"
          whileInView="visible"
          viewport={inViewport}
          className="mt-14 grid auto-rows-[minmax(11rem,auto)] gap-4 sm:grid-cols-4"
        >
          {items.map((feature, index) => (
            <motion.div key={feature.title} variants={fadeUp} className={cn(SPANS[index])}>
              <GlassPanel radius="xl" className="flex h-full flex-col justify-between p-6">
                <div>
                  <h3 className="text-h3 text-primary">{feature.title}</h3>
                  <p className="mt-3 text-body text-secondary">{feature.body}</p>
                </div>
                {index === 0 ? <WalkFigure /> : null}
              </GlassPanel>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/** A small, honest diagram — three stops and the legs between them. */
function WalkFigure(): React.ReactElement {
  const { t } = useTranslation();
  const locale = useLocale();

  // Venue names are the catalogue's own editorial content and stay as written;
  // the label around them is translated.
  const stops = [
    { label: 'Miradouro da Senhora do Monte', time: '09:00' },
    { label: 'Feira da Ladra', time: '10:05', walk: 9 },
    { label: 'Time Out Market', time: '12:30', walk: 21 },
  ];

  return (
    <ol className="mt-8 space-y-0" aria-label={t('features.exampleDay')}>
      {stops.map((stop, index) => (
        <li key={stop.label}>
          {stop.walk === undefined ? null : (
            <div className="ml-[3.25rem] flex items-center gap-2 py-1.5 text-mono-xs tracking-[0.09em] text-tertiary uppercase">
              <span className="h-4 w-px bg-[var(--border-default)]" />
              {t('features.onFoot', { duration: formatDuration(stop.walk, locale) })}
            </div>
          )}
          <div className="flex items-center gap-3">
            <time className="tabular w-12 shrink-0 text-sm font-semibold text-primary">
              {stop.time}
            </time>
            <span
              aria-hidden="true"
              className={cn(
                'size-2 shrink-0 rounded-pill',
                index === 0 ? 'bg-accent' : 'bg-[var(--border-strong)]',
              )}
            />
            <span className="min-w-0 truncate text-sm text-secondary">{stop.label}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
