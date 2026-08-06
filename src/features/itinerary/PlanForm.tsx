import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { CITIES } from '@/data/cities';
import { Button, Chip, GlassPanel, Slider } from '@/features/ui';
import { useLocale } from '@/i18n/useLocale';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import { SPRING } from '@/lib/motion';
import { PACES } from '@/types/itinerary';

import { DestinationCombobox } from './DestinationCombobox';
import { MOOD_META, MOOD_ORDER } from './kinds';
import { usePlanStore } from './plan.store';

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
  const { t } = useTranslation();
  const locale = useLocale();
  const draft = usePlanStore((state) => state.draft);
  const setDraft = usePlanStore((state) => state.setDraft);
  const toggleMood = usePlanStore((state) => state.toggleMood);

  // The destination lives in the store, not in local state. A local mirror
  // would go stale the moment something else sets it — which is exactly what
  // every "Plan Lisbon" link on the site does via `?destination=`.
  const matched = useMemo(
    () => CITIES.find((city) => city.name.toLowerCase() === draft.destination.trim().toLowerCase()),
    [draft.destination],
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
      <DestinationCombobox
        value={draft.destination}
        matched={matched}
        onChange={(destination) => {
          setDraft({ destination });
        }}
      />

      {/* ----------------------------------------------------------- Days */}
      <fieldset className="mt-8">
        <legend className="text-sm font-medium text-secondary">{t('plan.daysLabel')}</legend>
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
          {t('plan.moodsLabel')} <span className="text-tertiary">{t('plan.moodsHint')}</span>
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
              {t(MOOD_META[mood].labelKey)}
            </Chip>
          ))}
        </div>
        <p className="mt-2.5 text-sm text-tertiary">
          {t(MOOD_META[draft.moods[0] ?? 'food'].descriptionKey)}
        </p>
      </fieldset>

      {/* --------------------------------------------------------- Budget */}
      <div className="mt-8">
        <Slider
          label={t('plan.budgetLabel')}
          min={40}
          max={400}
          step={10}
          value={draft.budgetPerDay}
          onChange={(budgetPerDay) => {
            setDraft({ budgetPerDay });
          }}
          displayValue={formatCurrency(draft.budgetPerDay, matched?.currency ?? 'EUR', locale)}
          scale={['€40', '€220', '€400']}
        />
      </div>

      {/* ----------------------------------------------------------- Pace */}
      <fieldset className="mt-8">
        <legend className="text-sm font-medium text-secondary">{t('plan.paceLabel')}</legend>
        <div
          role="radiogroup"
          aria-label={t('plan.paceLabel')}
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
              <span className="relative block text-sm font-medium">{t(`pace.${pace}`)}</span>
              <span className="relative mt-0.5 block text-xs text-tertiary">
                {t(`pace.${pace}Detail`)}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <Button type="submit" size="lg" fullWidth className="mt-8" disabled={!canSubmit}>
        {canSubmit
          ? t('plan.submit', { count: draft.days, city: matched.name })
          : t('plan.submitDisabled')}
      </Button>
    </GlassPanel>
  );
}
