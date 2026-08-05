import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import { Chip, GlassPanel, Photo } from '@/features/ui';
import { cn } from '@/lib/cn';
import { formatCurrency, formatList } from '@/lib/format';
import { SPRING_SOFT, transition } from '@/lib/motion';
import type { City } from '@/types/city';

export interface CityCardProps {
  city: City;
  onClose: () => void;
  className?: string;
}

/**
 * The detail card that arrives when a marker is selected.
 *
 * Springs in rather than fades: the card is conceptually being *thrown* from
 * the marker to the panel position, and a spring is the only easing that
 * reads that way. The exit is a plain fast fade — an object leaving does not
 * need to argue for itself.
 */
export function CityCard({ city, onClose, className }: CityCardProps): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97, transition: transition.fast }}
      transition={SPRING_SOFT}
      className={cn('z-[var(--z-map-overlay)]', className)}
    >
      <GlassPanel tone="strong" radius="lg" className="overflow-hidden">
        <div className="relative">
          <Photo
            src={city.imageUrl}
            alt={`${city.name}, ${city.country}`}
            width={1200}
            height={675}
            seed={city.id}
            sizes="320px"
            className="w-full"
          />

          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${city.name}`}
            className="absolute top-2 right-2 grid size-8 place-items-center rounded-pill bg-[oklch(0%_0_0/0.5)] text-[oklch(100%_0_0)] backdrop-blur-sm transition-opacity hover:opacity-80"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor">
              <path d="M6 6l12 12M18 6L6 18" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-h3 text-primary">{city.name}</h3>
            <p className="shrink-0 text-sm text-tertiary">{city.country}</p>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-secondary">{city.tagline}</p>

          <dl className="mt-4 grid grid-cols-3 gap-3 border-y border-subtle py-3">
            <Figure label="Per day" value={formatCurrency(city.avgDailyCost, city.currency)} />
            <Figure label="Now" value={`${String(Math.round(city.temperatureC))}°C`} />
            <Figure label="Best" value={capitalise(city.bestSeasons[0] ?? 'spring')} />
          </dl>

          <p className="mt-3 text-xs text-tertiary">{city.weatherSummary}</p>

          <ul className="mt-4 space-y-2">
            {city.highlights.map((highlight) => (
              <li key={highlight.title} className="flex gap-2.5 text-sm">
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-1.5 shrink-0 rounded-pill bg-accent"
                />
                <span className="min-w-0">
                  <span className="font-medium text-primary">{highlight.title}</span>{' '}
                  <span className="text-tertiary">{highlight.detail}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {city.moods.slice(0, 3).map((mood) => (
              <Chip key={mood} size="sm">
                {mood}
              </Chip>
            ))}
          </div>

          <p className="sr-only">Best seasons: {formatList(city.bestSeasons)}.</p>

          <Link
            to={`/destination/${city.id}`}
            className="mt-5 flex h-11 w-full items-center justify-center rounded-md bg-accent text-body font-medium text-accent-contrast transition-colors hover:bg-accent-hover"
          >
            About {city.name}
          </Link>
        </div>
      </GlassPanel>
    </motion.div>
  );
}

function Figure({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div>
      <dt className="text-mono-xs tracking-[0.09em] text-tertiary uppercase">{label}</dt>
      <dd className="tabular mt-0.5 font-semibold text-primary">{value}</dd>
    </div>
  );
}

function capitalise(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
