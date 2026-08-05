import { motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { ActivityCard } from '@/features/itinerary/ActivityCard';
import { streamPlan } from '@/features/itinerary/plan.api';
import { WorldMap } from '@/features/map';
import { Button, DayColumnSkeleton, GlassPanel } from '@/features/ui';
import { fadeUp, inViewport } from '@/lib/motion';
import { isApiError } from '@/types/api';
import type { ItineraryDay, PlanRequest } from '@/types/itinerary';

const DEMO_REQUEST: PlanRequest = {
  destination: 'Lisbon',
  days: 1,
  moods: ['food', 'culture'],
  budgetPerDay: 120,
  pace: 'balanced',
};

/**
 * The live demo.
 *
 * This calls the real planner over the real stream — it is not a screenshot
 * and not a hardcoded fragment. Two consequences that make it honest: it
 * shows the actual loading choreography, and if the service is down the
 * landing page says so rather than displaying a plan that does not exist.
 *
 * Generation starts only once the section is in view, so the landing page
 * does not fire a request nobody scrolled to.
 */
export function LiveDemo(): React.ReactElement {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.2 });

  const [day, setDay] = useState<ItineraryDay | null>(null);
  const [status, setStatus] = useState('Waiting…');
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!inView) return;

    const controller = new AbortController();
    setFailed(null);
    setDay(null);

    streamPlan(
      DEMO_REQUEST,
      {
        onEvent: (event) => {
          if (event.type === 'status') setStatus(event.message);
          if (event.type === 'day') setDay(event.day);
          if (event.type === 'error') setFailed(event.message);
        },
      },
      controller.signal,
    ).catch((error: unknown) => {
      if (isApiError(error) && error.kind === 'aborted') return;
      setFailed(isApiError(error) ? error.userMessage : 'The planner is unreachable right now.');
    });

    return () => {
      controller.abort();
    };
  }, [inView, attempt]);

  return (
    <section ref={sectionRef} aria-labelledby="demo-heading" className="section-y">
      <div className="container-content">
        <p className="eyebrow">Live, on this page</p>
        <h2 id="demo-heading" className="mt-4 max-w-2xl text-display-2 text-primary">
          One day in Lisbon, generated just now.
        </h2>
        <p className="mt-5 max-w-prose text-body-lg text-secondary">
          Not a screenshot. Scrolling here fired a real request at the planner, and what follows
          arrived over the same stream the full app uses.
        </p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={inViewport}
          className="mt-12"
        >
          <WorldMap />
        </motion.div>

        <div className="mt-16 grid gap-8 lg:grid-cols-[1fr_20rem]">
          <div>
            {failed !== null ? (
              <GlassPanel radius="xl" className="p-8 text-center">
                <p className="text-h3 text-primary">The planner did not answer</p>
                <p className="mx-auto mt-3 max-w-prose text-body text-secondary">{failed}</p>
                <Button
                  variant="secondary"
                  className="mt-6"
                  onClick={() => {
                    setAttempt((count) => count + 1);
                  }}
                >
                  Try again
                </Button>
              </GlassPanel>
            ) : day === null ? (
              <div>
                <p aria-live="polite" className="mb-5 text-sm text-tertiary">
                  {status}
                </p>
                <DayColumnSkeleton blocks={5} />
              </div>
            ) : (
              <ol className="space-y-5">
                {day.blocks.map((block) => (
                  <li key={block.id}>
                    <ActivityCard
                      block={block}
                      currency="EUR"
                      dayId={day.id}
                      sortable={false}
                      onSwap={() => undefined}
                      onRemove={() => undefined}
                    />
                  </li>
                ))}
              </ol>
            )}
          </div>

          <GlassPanel radius="xl" className="h-fit p-6 lg:sticky lg:top-24">
            <h3 className="text-h3 text-primary">Try it properly</h3>
            <p className="mt-3 text-sm text-secondary">
              The full planner lets you set the pace and budget, run up to seven days, drag
              activities between slots and swap anything you do not like.
            </p>
            <Link
              to="/plan"
              className="mt-6 flex h-12 items-center justify-center rounded-md bg-accent font-medium text-accent-contrast transition-colors hover:bg-accent-hover"
            >
              Open the planner
            </Link>
          </GlassPanel>
        </div>
      </div>
    </section>
  );
}
