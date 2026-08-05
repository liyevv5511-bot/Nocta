import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import type { City } from '@/types/city';

export interface CityListProps {
  cities: readonly City[];
  selectedId: string | null;
  onSelect: (city: City) => void;
  onHover: (cityId: string | null) => void;
}

/**
 * The map's accessible twin.
 *
 * Canvas is a black box to assistive technology — there are no nodes to
 * expose, no roles, no focus order. Rather than bolt ARIA onto a `<canvas>`
 * and hope, the same dataset is rendered as a real listbox that is always
 * visible, always tabbable, and drives the same camera as clicking a marker.
 *
 * Hovering a row highlights the corresponding marker, so the two views stay
 * legibly connected instead of feeling like duplicate content.
 */
export function CityList({
  cities,
  selectedId,
  onSelect,
  onHover,
}: CityListProps): React.ReactElement {
  return (
    <div className="flex flex-col">
      <h3 className="eyebrow">Destinations</h3>

      <ul
        role="listbox"
        aria-label="Destinations"
        className="no-scrollbar mt-3 flex-1 space-y-1 overflow-y-auto lg:max-h-[30rem]"
      >
        {cities.map((city) => {
          const isSelected = city.id === selectedId;

          return (
            <li key={city.id}>
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onSelect(city);
                }}
                onMouseEnter={() => {
                  onHover(city.id);
                }}
                onMouseLeave={() => {
                  onHover(null);
                }}
                onFocus={() => {
                  onHover(city.id);
                }}
                onBlur={() => {
                  onHover(null);
                }}
                className={cn(
                  'w-full rounded-md border px-3.5 py-3 text-left',
                  'transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-expo)]',
                  isSelected
                    ? 'border-accent bg-accent-muted'
                    : 'border-transparent hover:border-subtle hover:bg-surface-hover',
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium text-primary">{city.name}</span>
                  <span className="tabular shrink-0 text-xs text-tertiary">
                    {formatCurrency(city.avgDailyCost, city.currency)}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-sm text-tertiary">{city.tagline}</p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
