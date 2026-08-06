import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

import { Seo } from '@/app/Seo';
import { ogImageUrl } from '@/config/site';
import { CITIES, CITY_BY_ID } from '@/data/cities';
import { getCityVenues } from '@/data/venues';
import { Chip, GlassPanel, Photo } from '@/features/ui';
import { useLocale } from '@/i18n/useLocale';
import { formatCurrency, formatList } from '@/lib/format';
import type { City } from '@/types/city';

import { NotFound } from './NotFound';

/**
 * A destination page, one per city in the catalogue.
 *
 * This route exists for a specific reason: `?destination=Lisbon` is a query
 * string, and a query string cannot be prerendered to a file or given its own
 * Open Graph image. Eight real paths can — so these are the pages that get
 * indexed, that carry a per-city OG card, and that a shared link previews as
 * the city rather than as the generic product card.
 */
export function Destination(): React.ReactElement {
  const { t } = useTranslation();
  const locale = useLocale();
  const { cityId } = useParams<{ cityId: string }>();
  const city = cityId === undefined ? undefined : CITY_BY_ID.get(cityId);

  if (!city) return <NotFound />;

  const venues = getCityVenues(city.id);
  const venueCount = venues?.venues.length ?? 0;
  const dayTripCount = venues?.dayTrips.length ?? 0;

  return (
    <>
      <Seo
        title={`${city.name}, ${city.country}`}
        description={`${city.tagline} ${String(venueCount)} researched venues, real coordinates and walking times — build a plan in about eight seconds.`}
        path={`/destination/${city.id}`}
        ogImage={ogImageUrl(`city-${city.id}`)}
        jsonLd={buildJsonLd(city, venueCount)}
      />

      <article className="container-content py-14 lg:py-20">
        <nav aria-label={t('destination.breadcrumb')} className="mb-8">
          <Link to="/" className="text-sm text-tertiary transition-colors hover:text-primary">
            {t('destination.allDestinations')}
          </Link>
        </nav>

        <header className="grid gap-10 lg:grid-cols-[1fr_28rem] lg:items-end">
          <div>
            <p className="eyebrow">{city.country}</p>
            <h1 className="mt-4 text-display-2 text-primary">{city.name}</h1>
            <p className="mt-5 max-w-prose text-body-lg text-secondary">{city.tagline}</p>
            <p className="mt-4 max-w-prose text-body text-secondary">{city.blurb}</p>

            <div className="mt-7 flex flex-wrap gap-2">
              {city.moods.map((mood) => (
                <Chip key={mood} size="sm">
                  {mood}
                </Chip>
              ))}
            </div>

            <Link
              to={`/plan?destination=${encodeURIComponent(city.name)}`}
              data-magnetic
              className="mt-9 inline-flex h-14 items-center rounded-lg bg-accent px-7 text-body-lg font-medium text-accent-contrast transition-colors hover:bg-accent-hover"
            >
              {t('destination.planCity', { city: city.name })}
            </Link>
          </div>

          <Photo
            src={city.imageUrl}
            alt={`${city.name}, ${city.country}`}
            width={1200}
            height={675}
            seed={city.id}
            sizes="(max-width: 1024px) 100vw, 448px"
            priority
            className="w-full rounded-xl"
          />
        </header>

        <GlassPanel radius="xl" className="mt-14 p-6 sm:p-8">
          <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Figure
              label={t('destination.averageDay')}
              value={formatCurrency(city.avgDailyCost, city.currency, locale)}
              note={t('destination.averageDayNote')}
            />
            <Figure
              label={t('destination.typicalHigh')}
              value={`${String(Math.round(city.temperatureC))}°C`}
              note={city.weatherSummary}
            />
            <Figure
              label={t('destination.bestSeasons')}
              value={t(`seasons.${city.bestSeasons[0] ?? 'spring'}`)}
              note={formatList(
                city.bestSeasons.map((season) => t(`seasons.${season}`)),
                locale,
              )}
            />
            <Figure
              label={t('destination.inCatalogue')}
              value={String(venueCount)}
              note={t('destination.inCatalogueNote', { count: dayTripCount })}
            />
          </dl>
        </GlassPanel>

        <section aria-labelledby="highlights-heading" className="mt-16">
          <h2 id="highlights-heading" className="text-h1 text-primary">
            {t('destination.highlights')}
          </h2>

          <ul className="mt-8 grid gap-5 lg:grid-cols-3">
            {city.highlights.map((highlight) => (
              <li key={highlight.title}>
                <GlassPanel radius="lg" className="h-full p-6">
                  <h3 className="text-h3 text-primary">{highlight.title}</h3>
                  <p className="mt-2 text-body text-secondary">{highlight.detail}</p>
                </GlassPanel>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="others-heading" className="mt-20">
          <h2 id="others-heading" className="eyebrow">
            {t('destination.others')}
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {CITIES.filter((other) => other.id !== city.id).map((other) => (
              <li key={other.id}>
                <Link
                  to={`/destination/${other.id}`}
                  className="inline-flex h-9 items-center rounded-pill border border-default px-4 text-sm text-secondary transition-colors hover:border-strong hover:text-primary"
                >
                  {other.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </>
  );
}

function buildJsonLd(city: City, venueCount: number): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name: city.name,
    description: city.blurb,
    address: { '@type': 'PostalAddress', addressCountry: city.countryCode },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: city.coordinates.lat,
      longitude: city.coordinates.lng,
    },
    touristType: city.moods,
    includesAttraction: city.highlights.map((highlight) => ({
      '@type': 'TouristAttraction',
      name: highlight.title,
      description: highlight.detail,
    })),
    additionalProperty: {
      '@type': 'PropertyValue',
      name: 'Researched venues',
      value: venueCount,
    },
  };
}

/**
 * One figure in the description list.
 *
 * The note lives inside the `<dd>`, not beside it. A `<dl>` may only contain
 * `<dt>`/`<dd>` groups — optionally wrapped in a `<div>` — so a sibling `<p>`
 * makes the whole list invalid and strips its semantics for a screen reader.
 */
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
      <dd className="mt-1.5">
        <span className="tabular block text-h2 text-primary">{value}</span>
        <span className="mt-1 block text-sm text-tertiary">{note}</span>
      </dd>
    </div>
  );
}
