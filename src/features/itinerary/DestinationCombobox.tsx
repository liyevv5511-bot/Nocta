import { useId, useMemo, useState } from 'react';

import { CITIES, searchCities } from '@/data/cities';
import { formatCurrency } from '@/lib/format';
import type { City } from '@/types/city';

export interface DestinationComboboxProps {
  value: string;
  onChange: (destination: string) => void;
  /** The catalogue entry the current text resolves to, if any. */
  matched: City | undefined;
}

/**
 * Destination picker.
 *
 * A combobox over the real catalogue rather than a free-text field. Accepting
 * "Bologna" and then failing at generation time would be a promise the product
 * cannot keep; refusing it up front, by name, with the eight alternatives
 * listed, is the honest interaction.
 *
 * The value is owned by the caller (and ultimately by the plan store), because
 * `?destination=` deep links set it from outside. A local mirror goes stale the
 * first time that happens.
 */
export function DestinationCombobox({
  value,
  onChange,
  matched,
}: DestinationComboboxProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const inputId = useId();
  const listId = useId();

  const suggestions = useMemo(() => searchCities(value), [value]);
  const showMiss = value.trim().length > 0 && matched === undefined && !open;

  return (
    <div className="relative">
      <label htmlFor={inputId} className="text-sm font-medium text-secondary">
        Where are you going?
      </label>

      <input
        id={inputId}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder="Lisbon, Tokyo, Reykjavík…"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
        }}
        onBlur={() => {
          // Delayed so a click on an option lands before the list unmounts.
          window.setTimeout(() => {
            setOpen(false);
          }, 120);
        }}
        className="mt-2 h-14 w-full rounded-lg border border-default bg-surface-sunken px-4 text-body-lg text-primary placeholder:text-tertiary"
      />

      {open && suggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="glass absolute inset-x-0 top-full z-20 mt-2 max-h-72 overflow-y-auto rounded-lg py-1.5"
        >
          {suggestions.map((city) => (
            <li key={city.id}>
              <button
                type="button"
                role="option"
                aria-selected={matched?.id === city.id}
                onClick={() => {
                  onChange(city.name);
                  setOpen(false);
                }}
                className="flex w-full items-baseline justify-between gap-4 px-4 py-2.5 text-left transition-colors hover:bg-surface-hover"
              >
                <span className="font-medium text-primary">{city.name}</span>
                <span className="text-sm text-tertiary">
                  {city.country} · {formatCurrency(city.avgDailyCost, city.currency)}/day
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {showMiss ? (
        <p className="mt-2 text-sm text-warning">
          No venue catalogue for “{value}”. Pick one of the {CITIES.length} cities above.
        </p>
      ) : null}
    </div>
  );
}
