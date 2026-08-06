import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

import { Seo } from '@/app/Seo';
import { CITY_BY_ID } from '@/data/cities';
import { ItineraryTimeline } from '@/features/itinerary/ItineraryTimeline';
import { tripTotals } from '@/features/itinerary/itinerary.reducer';
import { usePlanStore } from '@/features/itinerary/plan.store';
import { useTripStorage } from '@/features/trips/useTripStorage';
import { WorldMap } from '@/features/map';
import { Button, GlassPanel } from '@/features/ui';
import { useLocale } from '@/i18n/useLocale';
import { formatCurrency, formatDate, formatDuration } from '@/lib/format';

/**
 * A saved trip, addressed by id.
 *
 * The route reads from local storage rather than the in-memory plan store, so
 * a shared or bookmarked `/trip/:id` link works after a reload on the same
 * device. It cannot work on a *different* device — the trips never leave the
 * browser — and the empty state says exactly that instead of implying a
 * server outage.
 */
export function Trip(): React.ReactElement {
  const { t } = useTranslation();
  const locale = useLocale();
  const { tripId } = useParams<{ tripId: string }>();
  const { trips, find } = useTripStorage();
  const loadItinerary = usePlanStore((state) => state.loadItinerary);
  const itinerary = usePlanStore((state) => state.itinerary);
  const loadedRef = useRef<string | null>(null);

  const saved = tripId === undefined ? undefined : find(tripId);

  useEffect(() => {
    if (saved && loadedRef.current !== saved.itinerary.id) {
      loadedRef.current = saved.itinerary.id;
      loadItinerary(saved.itinerary);
    }
  }, [saved, loadItinerary]);

  // `trips` is empty for one render while storage is read; distinguishing that
  // from "genuinely not found" avoids a flash of the 404 state.
  const stillReading = trips.length === 0 && saved === undefined;

  if (!saved && !stillReading) {
    return <TripNotFound />;
  }

  const active = saved?.itinerary ?? itinerary;
  if (!active) return <TripNotFound />;

  const totals = tripTotals(active);
  const city = CITY_BY_ID.get(active.meta.destination.toLowerCase().replace(/\s+/g, '-'));

  return (
    <>
      <Seo
        title={`${String(active.days.length)} days in ${active.meta.destination}`}
        description={active.summary}
        path={`/trip/${active.id}`}
        noIndex
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'TouristTrip',
          name: `${String(active.days.length)} days in ${active.meta.destination}`,
          description: active.summary,
          touristType: active.meta.moods,
          itinerary: {
            '@type': 'ItemList',
            numberOfItems: totals.blocks,
            itemListElement: active.days.flatMap((day) =>
              day.blocks.map((block, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: {
                  '@type': 'TouristAttraction',
                  name: block.title,
                  description: block.summary,
                  address: block.place.address,
                },
              })),
            ),
          },
        }}
      />

      <div className="container-content py-14 lg:py-20">
        <nav aria-label="Breadcrumb" className="mb-8">
          <Link to="/saved" className="text-sm text-tertiary hover:text-primary">
            {t('trip.allSaved')}
          </Link>
        </nav>

        <header className="max-w-3xl">
          <p className="eyebrow">
            {active.meta.destination}
            {saved === undefined
              ? ''
              : ` · ${t('trip.savedOn', { date: formatDate(saved.savedAt, locale) })}`}
          </p>
          <h1 className="mt-4 text-display-2 text-primary">{saved?.name ?? active.summary}</h1>
          <p className="mt-4 text-body-lg text-secondary">{active.summary}</p>
        </header>

        <GlassPanel radius="xl" className="mt-10 p-6">
          <dl className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            <Figure label={t('trip.days')} value={String(active.days.length)} />
            <Figure label={t('trip.activities')} value={String(totals.blocks)} />
            <Figure label="Total cost" value={formatCurrency(totals.cost, active.meta.currency)} />
            <Figure label={t('trip.onFoot')} value={formatDuration(totals.walkMinutes, locale)} />
          </dl>

          <div className="mt-6 flex flex-wrap gap-3 border-t border-subtle pt-5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                window.print();
              }}
            >
              {t('trip.print')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(window.location.href);
              }}
            >
              {t('trip.copyLink')}
            </Button>
          </div>
        </GlassPanel>

        {city ? (
          <div className="mt-12">
            <WorldMap route={[city]} />
          </div>
        ) : null}

        <div className="mt-16">
          <ItineraryTimeline
            itinerary={active}
            expectedDays={active.days.length}
            streaming={false}
          />
        </div>
      </div>
    </>
  );
}

function TripNotFound(): React.ReactElement {
  const { t } = useTranslation();

  return (
    <>
      <Seo
        title="Trip not found"
        description="That trip is not stored in this browser."
        path="/trip/unknown"
        noIndex
      />
      <div className="container-content grid min-h-[60svh] place-items-center py-20 text-center">
        <div className="max-w-lg">
          <p className="eyebrow">{t('trip.notFoundEyebrow')}</p>
          <h1 className="mt-3 text-h1 text-primary">{t('trip.notFoundHeading')}</h1>
          <p className="mt-4 text-body text-secondary">{t('trip.notFoundBody')}</p>
          <Link
            to="/plan"
            className="mt-8 inline-flex h-12 items-center rounded-md bg-accent px-6 font-medium text-accent-contrast"
          >
            {t('trip.openPlanner')}
          </Link>
        </div>
      </div>
    </>
  );
}

function Figure({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div>
      <dt className="text-mono-xs tracking-[0.09em] text-tertiary uppercase">{label}</dt>
      <dd className="tabular mt-1 text-h3 text-primary">{value}</dd>
    </div>
  );
}
