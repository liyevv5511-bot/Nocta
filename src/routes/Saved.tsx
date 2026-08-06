import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Seo } from '@/app/Seo';
import { tripTotals } from '@/features/itinerary/itinerary.reducer';
import { useTripStorage } from '@/features/trips/useTripStorage';
import { Button, GlassPanel, toast } from '@/features/ui';
import { useLocale } from '@/i18n/useLocale';
import { formatCurrency, formatRelative } from '@/lib/format';
import { fadeUp, stagger } from '@/lib/motion';

export function Saved(): React.ReactElement {
  const { t } = useTranslation();
  const locale = useLocale();
  const { trips, remove, available } = useTripStorage();

  return (
    <>
      <Seo
        title="Saved trips"
        description="Every itinerary you have saved, stored locally in this browser."
        path="/saved"
        noIndex
      />

      <div className="container-content py-14 lg:py-20">
        <header className="max-w-2xl">
          <p className="eyebrow">{t('saved.eyebrow')}</p>
          <h1 className="mt-4 text-display-2 text-primary">{t('saved.heading')}</h1>
          <p className="mt-4 text-body-lg text-secondary">{t('saved.body')}</p>
        </header>

        {!available ? (
          <GlassPanel radius="xl" className="mt-12 p-8">
            <p className="text-h3 text-primary">{t('saved.unavailableHeading')}</p>
            <p className="mt-3 max-w-prose text-body text-secondary">
              {t('saved.unavailableBody')}
            </p>
          </GlassPanel>
        ) : trips.length === 0 ? (
          <GlassPanel radius="xl" className="mt-12 p-10 text-center">
            <p className="text-h2 text-primary">{t('saved.emptyHeading')}</p>
            <p className="mx-auto mt-4 max-w-prose text-body-lg text-secondary">
              {t('saved.emptyBody')}
            </p>
            <Link
              to="/plan"
              className="mt-8 inline-flex h-12 items-center rounded-md bg-accent px-6 font-medium text-accent-contrast transition-colors hover:bg-accent-hover"
            >
              {t('nav.plan')}
            </Link>
          </GlassPanel>
        ) : (
          <motion.ul
            variants={stagger(0.05)}
            initial="hidden"
            animate="visible"
            className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {trips.map((trip) => {
              const totals = tripTotals(trip.itinerary);

              return (
                <motion.li key={trip.itinerary.id} variants={fadeUp}>
                  <GlassPanel radius="xl" className="flex h-full flex-col p-6">
                    <p className="eyebrow">{trip.itinerary.meta.destination}</p>
                    <h2 className="mt-2 text-h3 text-primary">{trip.name}</h2>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-secondary">
                      {trip.itinerary.summary}
                    </p>

                    <dl className="mt-5 flex gap-5 border-t border-subtle pt-4 text-sm">
                      <div>
                        <dt className="text-xs text-tertiary">{t('saved.activities')}</dt>
                        <dd className="tabular font-semibold text-primary">{totals.blocks}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-tertiary">{t('saved.cost')}</dt>
                        <dd className="tabular font-semibold text-primary">
                          {formatCurrency(totals.cost, trip.itinerary.meta.currency, locale)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-tertiary">{t('saved.savedAt')}</dt>
                        <dd className="font-semibold text-primary">
                          {formatRelative(trip.savedAt, locale)}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-5 flex gap-2">
                      <Link
                        to={`/trip/${trip.itinerary.id}`}
                        className="flex h-10 flex-1 items-center justify-center rounded-sm bg-accent text-sm font-medium text-accent-contrast transition-colors hover:bg-accent-hover"
                      >
                        {t('saved.open')}
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          remove(trip.itinerary.id);
                          toast.info(t('saved.removed'), trip.name);
                        }}
                      >
                        {t('saved.delete')}
                      </Button>
                    </div>
                  </GlassPanel>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </div>
    </>
  );
}
