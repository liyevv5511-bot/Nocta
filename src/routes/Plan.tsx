import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Seo } from '@/app/Seo';
import { findCityByName } from '@/data/cities';
import { GenerationStatus } from '@/features/itinerary/GenerationStatus';
import { ItineraryTimeline } from '@/features/itinerary/ItineraryTimeline';
import { PlanForm } from '@/features/itinerary/PlanForm';
import { usePlanStore } from '@/features/itinerary/plan.store';
import { tripTotals } from '@/features/itinerary/itinerary.reducer';
import { useTripStorage } from '@/features/trips/useTripStorage';
import { Button, GlassPanel, toast } from '@/features/ui';
import { formatCurrency, formatDuration } from '@/lib/format';
import { fadeUp, transition } from '@/lib/motion';
import type { Itinerary } from '@/types/itinerary';

/**
 * The planner route.
 *
 * The layout is a two-column split that collapses to a stack: the form stays
 * available beside the result so changing the pace and regenerating is one
 * interaction rather than a round trip through a "back" button.
 *
 * `?destination=` is honoured on mount so every "Plan Lisbon" link across the
 * site lands here pre-filled.
 */
export function Plan(): React.ReactElement {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const setDraft = usePlanStore((state) => state.setDraft);
  const phase = usePlanStore((state) => state.phase);
  const statusMessage = usePlanStore((state) => state.statusMessage);
  const progress = usePlanStore((state) => state.progress);
  const itinerary = usePlanStore((state) => state.itinerary);
  const expectedDays = usePlanStore((state) => state.expectedDays);
  const error = usePlanStore((state) => state.error);
  const generate = usePlanStore((state) => state.generate);
  const cancel = usePlanStore((state) => state.cancel);

  const { save, isSaved, available } = useTripStorage();

  useEffect(() => {
    const destination = params.get('destination');
    if (destination !== null && findCityByName(destination)) {
      setDraft({ destination });
    }
  }, [params, setDraft]);

  const busy = phase === 'thinking' || phase === 'streaming';

  return (
    <>
      <Seo
        title="Plan a trip"
        description="Pick a city, how long you have, what you are in the mood for and what you want to spend. Nocta streams back an hour-by-hour itinerary you can rearrange."
        path="/plan"
      />

      <div className="container-content py-14 lg:py-20">
        <header className="max-w-2xl">
          <p className="eyebrow">Planner</p>
          <h1 className="mt-4 text-display-2 text-primary">Build the trip.</h1>
          <p className="mt-4 text-body-lg text-secondary">
            Five inputs. The planner streams its reasoning as it works, then hands you something you
            can take apart.
          </p>
        </header>

        <div className="mt-12 grid gap-10 lg:grid-cols-[24rem_1fr] lg:gap-14">
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <PlanForm
              onSubmit={() => {
                void generate();
              }}
            />
          </div>

          <div className="min-w-0">
            <AnimatePresence mode="wait">
              {busy ? (
                <motion.div
                  key="status"
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="mb-10"
                >
                  <GenerationStatus message={statusMessage} progress={progress} onCancel={cancel} />
                </motion.div>
              ) : null}
            </AnimatePresence>

            {phase === 'idle' && itinerary === null ? <EmptyState /> : null}

            {phase === 'error' && itinerary === null ? (
              <GlassPanel radius="xl" className="p-8 text-center">
                <p className="text-h3 text-primary">That did not work</p>
                <p className="mx-auto mt-3 max-w-prose text-body text-secondary">
                  {error?.userMessage ?? 'The planner failed unexpectedly.'}
                </p>
                {error?.retryable === true ? (
                  <Button
                    className="mt-6"
                    onClick={() => {
                      void generate();
                    }}
                  >
                    Try again
                  </Button>
                ) : null}
              </GlassPanel>
            ) : null}

            {itinerary === null ? null : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={transition.base}
              >
                <TripSummary
                  itinerary={itinerary}
                  saved={isSaved(itinerary.id)}
                  storageAvailable={available}
                  onSave={() => {
                    if (save(itinerary)) {
                      toast.success('Trip saved', 'Find it under Saved, or share the link.');
                      void navigate(`/trip/${itinerary.id}`);
                    }
                  }}
                />

                <div className="mt-12">
                  <ItineraryTimeline
                    itinerary={itinerary}
                    expectedDays={expectedDays}
                    streaming={busy}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function EmptyState(): React.ReactElement {
  return (
    <GlassPanel radius="xl" className="p-10 text-center">
      <p className="text-h2 text-primary">Nothing planned yet</p>
      <p className="mx-auto mt-4 max-w-prose text-body-lg text-secondary">
        Choose a destination on the left and the planner will build a schedule — hour by hour, with
        the walking time between every stop worked out.
      </p>
      <p className="mt-6 text-sm text-tertiary">
        Eight cities available. Nothing is charged, ever.
      </p>
    </GlassPanel>
  );
}

function TripSummary({
  itinerary,
  saved,
  storageAvailable,
  onSave,
}: {
  itinerary: Itinerary;
  saved: boolean;
  storageAvailable: boolean;
  onSave: () => void;
}): React.ReactElement {
  const totals = tripTotals(itinerary);
  const { currency } = itinerary.meta;

  return (
    <GlassPanel radius="xl" className="p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <p className="eyebrow">{itinerary.meta.destination}</p>
          <h2 className="mt-2 text-h1 text-primary">
            {itinerary.days.length} {itinerary.days.length === 1 ? 'day' : 'days'} in{' '}
            {itinerary.meta.destination}
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

function Figure({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div>
      <dt className="text-mono-xs tracking-[0.09em] text-tertiary uppercase">{label}</dt>
      <dd className="tabular mt-1 text-h3 text-primary">{value}</dd>
    </div>
  );
}
