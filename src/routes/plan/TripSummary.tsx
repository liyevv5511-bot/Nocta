import { tripTotals } from '@/features/itinerary/itinerary.reducer';
import { Button, GlassPanel } from '@/features/ui';
import { formatCurrency, formatDuration } from '@/lib/format';
import type { Itinerary } from '@/types/itinerary';

export interface TripSummaryProps {
  itinerary: Itinerary;
  saved: boolean;
  storageAvailable: boolean;
  onSave: () => void;
}

/**
 * The header above a generated plan.
 *
 * Every figure here is derived from the blocks on each render rather than read
 * from a stored total — which is what keeps it honest after a reorder, a swap
 * or a removal. There is no cache to invalidate because there is no cache.
 */
export function TripSummary({
  itinerary,
  saved,
  storageAvailable,
  onSave,
}: TripSummaryProps): React.ReactElement {
  const totals = tripTotals(itinerary);
  const { currency } = itinerary.meta;
  const dayCount = itinerary.days.length;

  return (
    <GlassPanel radius="xl" className="p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <p className="eyebrow">{itinerary.meta.destination}</p>
          <h2 className="mt-2 text-h1 text-primary">
            {dayCount} {dayCount === 1 ? 'day' : 'days'} in {itinerary.meta.destination}
          </h2>
          <p className="mt-3 max-w-prose text-body text-secondary">{itinerary.summary}</p>
        </div>

        <Button onClick={onSave} disabled={saved || !storageAvailable} variant="secondary">
          {saved ? 'Saved' : storageAvailable ? 'Save trip' : 'Storage unavailable'}
        </Button>
      </div>

      <dl className="mt-7 grid grid-cols-2 gap-5 border-t border-subtle pt-6 sm:grid-cols-4">
        <Figure label="Activities" value={String(totals.blocks)} />
        <Figure label="Free of charge" value={String(totals.freeBlocks)} />
        <Figure label="Total cost" value={formatCurrency(totals.cost, currency)} />
        <Figure label="On foot" value={formatDuration(totals.walkMinutes)} />
      </dl>

      {itinerary.highlights.length === 0 ? null : (
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-subtle pt-5 text-sm text-tertiary">
          {itinerary.highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      )}
    </GlassPanel>
  );
}

/** Label-over-figure pair. Shared with the trip route. */
export function Figure({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div>
      <dt className="text-mono-xs tracking-[0.09em] text-tertiary uppercase">{label}</dt>
      <dd className="tabular mt-1 text-h3 text-primary">{value}</dd>
    </div>
  );
}
