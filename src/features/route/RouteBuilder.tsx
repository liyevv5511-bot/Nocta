import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { CITIES } from '@/data/cities';
import { Button, Chip, GlassPanel } from '@/features/ui';
import { useLocale } from '@/i18n/useLocale';
import { formatCurrency, formatDuration, formatNumber } from '@/lib/format';
import { fadeUp, stagger } from '@/lib/motion';

import { MAX_ROUTE_CITIES } from './route.model';
import { RouteStops } from './RouteStops';
import { useRoute } from './useRoute';

/**
 * The multi-city route composer.
 *
 * Pairs with the map: this panel owns the order and the arithmetic, the map
 * draws the great-circle arcs between the same cities. Both read the route
 * from the URL, so there is no shared component state to keep in step — the
 * address bar is the single source of truth, which is also what makes a route
 * shareable.
 */
export function RouteBuilder(): React.ReactElement {
  const { t } = useTranslation();
  const locale = useLocale();
  const route = useRoute();
  const { summary } = route;

  return (
    <motion.div
      variants={stagger(0.06)}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6"
    >
      <motion.div variants={fadeUp}>
        <GlassPanel radius="xl" className="p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-h3 text-primary">{t('route.yourRoute')}</h2>
            <p className="tabular text-sm text-tertiary">
              {t('route.counter', { count: summary.stops.length, max: MAX_ROUTE_CITIES })}
            </p>
          </div>

          {summary.stops.length === 0 ? (
            <p className="mt-4 text-body text-secondary">{t('route.empty')}</p>
          ) : (
            <div className="mt-5">
              <RouteStops
                stops={summary.stops}
                legs={summary.legs}
                onRemove={route.remove}
                onMove={route.move}
              />
            </div>
          )}
        </GlassPanel>
      </motion.div>

      {/* ------------------------------------------------------------ Totals */}
      {summary.stops.length === 0 ? null : (
        <motion.div variants={fadeUp}>
          <GlassPanel radius="xl" className="p-6">
            <h2 className="eyebrow">{t('route.wholeTrip')}</h2>

            <dl className="mt-4 grid grid-cols-2 gap-5">
              <Figure
                label={t('route.length')}
                value={t('common.days', { count: summary.days })}
                note={t('route.lengthNote', {
                  nights: summary.nights,
                  legs: summary.legs.length,
                })}
              />
              <Figure
                label={t('route.ground')}
                value={`${formatNumber(summary.distanceKm, locale)} km`}
                note={
                  summary.legs.length === 0
                    ? t('route.singleCity')
                    : t('route.groundNote', {
                        duration: formatDuration(summary.travelMinutes, locale),
                      })
                }
              />
              <Figure
                label={t('route.cost')}
                value={formatCurrency(summary.estimatedCost, summary.currency, locale)}
                note={t('route.costNote')}
              />
              <Figure
                label={t('route.perDay')}
                value={formatCurrency(
                  Math.round(summary.estimatedCost / Math.max(1, summary.nights)),
                  summary.currency,
                  locale,
                )}
                note={t('route.perDayNote')}
              />
            </dl>

            <p className="mt-5 border-t border-subtle pt-4 text-sm text-tertiary">
              {t('route.method')}
            </p>
          </GlassPanel>
        </motion.div>
      )}

      {/* --------------------------------------------------------- City picker */}
      <motion.div variants={fadeUp}>
        <GlassPanel radius="xl" className="p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="eyebrow">{t('route.addCity')}</h2>
            <Button variant="ghost" size="sm" onClick={route.reset}>
              {t('route.reset')}
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {CITIES.map((city) => {
              const selected = route.contains(city.id);

              return (
                <Chip
                  key={city.id}
                  selected={selected}
                  disabled={!selected && route.isFull}
                  onToggle={(next) => {
                    if (next) route.add(city.id);
                    else route.remove(city.id);
                  }}
                >
                  {city.name}
                </Chip>
              );
            })}
          </div>

          {route.isFull ? <p className="mt-4 text-sm text-warning">{t('route.full')}</p> : null}
        </GlassPanel>
      </motion.div>
    </motion.div>
  );
}

function Figure({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}): React.ReactElement {
  return (
    <div>
      <dt className="text-mono-xs tracking-[0.09em] text-tertiary uppercase">{label}</dt>
      <dd className="mt-1">
        <span className="tabular block text-h3 text-primary">{value}</span>
        <span className="mt-0.5 block text-sm text-tertiary">{note}</span>
      </dd>
    </div>
  );
}
