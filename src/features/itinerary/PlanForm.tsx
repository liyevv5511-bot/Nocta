import { motion } from 'framer-motion';
import { useId, useMemo, useState } from 'react';

import { CITIES, searchCities } from '@/data/cities';
import { Button, Chip, GlassPanel, Slider } from '@/features/ui';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import { SPRING } from '@/lib/motion';
import { PACES, type Pace } from '@/types/itinerary';

import { MOOD_META, MOOD_ORDER } from './kinds';
import { usePlanStore } from './plan.store';

const PACE_COPY: Record<Pace, { label: string; detail: string }> = {
  relaxed: { label: 'Relaxed', detail: '4 stops a day' },
  balanced: { label: 'Balanced', detail: '5 stops a day' },
  intense: { label: 'Intense', detail: '6 stops a day' },
};

const MAX_DAYS = 7;

/**
 * The planning form.
 *
 * Validation is inline and non-blocking: the submit button explains why it is
 * disabled rather than letting the user click into a server-side rejection.
 * The destination field is a combobox over the real catalogue — offering free
 * text for a city the planner has no venues for would be a promise the
 * product cannot keep.
 */
export function PlanForm({ onSubmit }: { onSubmit: () => void }): React.ReactElement {
  const draft = usePlanStore((state) => state.draft);
  const setDraft = usePlanStore((state) => state.setDraft);
  const toggleMood = usePlanStore((state) => state.toggleMood);

  // The destination lives in the store, not in local state. A local mirror
  // would go stale the moment something else sets it — which is exactly what
  // every "Plan Lisbon" link on the site does via `?destination=`.
  const query = draft.destination;
  const [open, setOpen] = useState(false);
  const listId = useId();
  const inputId = useId();

  const suggestions = useMemo(() => searchCities(query), [query]);
  const matched = useMemo(
    () => CITIES.find((city) => city.name.toLowerCase() === query.trim().toLowerCase()),
    [query],
  );

  const canSubmit = matched !== undefined;

  return (
    <GlassPanel
      as="form"
      radius="2xl"
      className="p-6 sm:p-8"
      onSubmit={(event: React.SyntheticEvent) => {
        event.preventDefault();
        if (canSubmit) onSubmit();
      }}
    >
      {/* ---------------------------------------------------- Destination */}
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
          value={query}
          onChange={(event) => {
            setDraft({ destination: event.target.value });
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
                    setDraft({ destination: city.name });
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

        {query.trim().length > 0 && !matched && !open ? (
          <p className="mt-2 text-sm text-warning">
            No venue catalogue for “{query}”. Pick one of the {CITIES.length} cities above.
          </p>
        ) : null}
      </div>

      {/* ----------------------------------------------------------- Days */}
      <fieldset className="mt-8">
        <legend className="text-sm font-medium text-secondary">How many days?</legend>
        <div className="mt-3 grid grid-cols-7 gap-2">
          {Array.from({ length: MAX_DAYS }, (_, index) => index + 1).map((count) => (
            <button
              key={count}
              type="button"
              aria-pressed={draft.days === count}
              onClick={() => {
                setDraft({ days: count });
              }}
              className={cn(
                'tabular relative grid h-11 place-items-center rounded-md text-body font-medium',
                'transition-colors duration-[var(--duration-fast)]',
                draft.days === count
                  ? 'text-accent-contrast'
                  : 'border border-default text-secondary hover:text-primary',
              )}
            >
              {draft.days === count ? (
                <motion.span
                  layoutId="day-pill"
                  transition={SPRING}
                  className="absolute inset-0 rounded-md bg-accent"
                />
              ) : null}
              <span className="relative">{count}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* ---------------------------------------------------------- Moods */}
      <fieldset className="mt-8">
        <legend className="text-sm font-medium text-secondary">
          What kind of trip? <span className="text-tertiary">(pick up to four)</span>
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {MOOD_ORDER.map((mood) => (
            <Chip
              key={mood}
              selected={draft.moods.includes(mood)}
              onToggle={() => {
                toggleMood(mood);
              }}
              icon={<span aria-hidden="true">{MOOD_META[mood].icon}</span>}
            >
              {MOOD_META[mood].label}
            </Chip>
          ))}
        </div>
        <p className="mt-2.5 text-sm text-tertiary">
          {MOOD_META[draft.moods[0] ?? 'food'].description}
        </p>
      </fieldset>

      {/* --------------------------------------------------------- Budget */}
      <div className="mt-8">
        <Slider
          label="Daily budget, per person"
          min={40}
          max={400}
          step={10}
          value={draft.budgetPerDay}
          onChange={(budgetPerDay) => {
            setDraft({ budgetPerDay });
          }}
          displayValue={formatCurrency(draft.budgetPerDay, matched?.currency ?? 'EUR')}
          scale={['€40', '€220', '€400']}
        />
      </div>

      {/* ----------------------------------------------------------- Pace */}
      <fieldset className="mt-8">
        <legend className="text-sm font-medium text-secondary">Pace</legend>
        <div
          role="radiogroup"
          aria-label="Pace"
          className="mt-3 grid grid-cols-3 gap-2 rounded-lg border border-subtle bg-surface-sunken p-1"
        >
          {PACES.map((pace) => (
            <button
              key={pace}
              type="button"
              role="radio"
              aria-checked={draft.pace === pace}
              onClick={() => {
                setDraft({ pace });
              }}
              className={cn(
                'relative rounded-md px-3 py-2.5 text-center transition-colors',
                draft.pace === pace ? 'text-primary' : 'text-tertiary hover:text-secondary',
              )}
            >
              {draft.pace === pace ? (
                <motion.span
                  layoutId="pace-pill"
                  transition={SPRING}
                  className="absolute inset-0 rounded-md bg-surface shadow-sm"
                />
              ) : null}
              <span className="relative block text-sm font-medium">{PACE_COPY[pace].label}</span>
              <span className="relative mt-0.5 block text-xs text-tertiary">
                {PACE_COPY[pace].detail}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <Button type="submit" size="lg" fullWidth className="mt-8" disabled={!canSubmit}>
        {canSubmit ? `Build ${String(draft.days)} days in ${matched.name}` : 'Choose a destination'}
      </Button>
    </GlassPanel>
  );
}
