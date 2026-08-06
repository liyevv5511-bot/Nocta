import { useTranslation } from 'react-i18next';

import { Seo } from '@/app/Seo';
import { ogImageUrl } from '@/config/site';
import { CITIES } from '@/data/cities';
import { WorldMap } from '@/features/map';
import { RouteBuilder } from '@/features/route/RouteBuilder';
import { useRoute } from '@/features/route/useRoute';
import { formatList } from '@/lib/format';

/**
 * The multi-city route builder.
 *
 * Two halves of one thing: the map draws the great-circle arcs, the panel owns
 * the order and the arithmetic. Neither holds the route — both read it from
 * `?cities=`, which is what makes an assembled route a link you can send to
 * whoever you are travelling with.
 */
export function Route(): React.ReactElement {
  const { t } = useTranslation();
  const { cities, summary } = useRoute();
  const names = cities.map((city) => city.name);

  return (
    <>
      <Seo
        title={names.length > 1 ? `${formatList(names)} by route` : 'Build a multi-city route'}
        description={
          names.length > 1
            ? `${formatList(names)} in about ${String(summary.days)} days — great-circle distances, travel times and a rough cost for the whole trip.`
            : `Chain up to ${String(CITIES.length)} cities into one trip. Nocta measures the hops, suggests how long each city is worth, and totals the whole thing.`
        }
        path="/route"
        ogImage={ogImageUrl('route')}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'TouristTrip',
          name: names.length > 1 ? `${formatList(names)} by route` : 'Multi-city route',
          itinerary: {
            '@type': 'ItemList',
            numberOfItems: cities.length,
            itemListElement: cities.map((city, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              item: {
                '@type': 'City',
                name: city.name,
                address: { '@type': 'PostalAddress', addressCountry: city.countryCode },
              },
            })),
          },
        }}
      />

      <div className="container-content py-14 lg:py-20">
        <header className="max-w-2xl">
          <p className="eyebrow">{t('route.eyebrow')}</p>
          <h1 className="mt-4 text-display-2 text-primary">{t('route.heading')}</h1>
          <p className="mt-4 text-body-lg text-secondary">{t('route.body')}</p>
        </header>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_26rem] lg:items-start">
          <div className="lg:sticky lg:top-24">
            {/* The destination list is off here because the builder beside it
                already exposes every city as a focusable control, and the
                selected ones as an ordered list. */}
            <WorldMap route={cities} showDestinationList={false} />
          </div>

          <RouteBuilder />
        </div>
      </div>
    </>
  );
}
