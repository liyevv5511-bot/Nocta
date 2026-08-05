import { CITIES } from '../src/data/cities';
import type { PlanEvent, PlanRequest } from '../src/types/itinerary';

import {
  buildHighlights,
  buildMeta,
  buildSummary,
  composeDay,
  createPlannerState,
  createRng,
  statusMessages,
} from './planner';
import type { ItineraryDay } from '../src/types/itinerary';

/**
 * The plan event stream, as a transport-agnostic generator.
 *
 * Two runtimes consume this: the local Express service (`server/index.ts`) and
 * the deployed serverless function (`api/plan.ts`). Neither owns the sequence —
 * they only know how to write a `PlanEvent` onto their own kind of response.
 *
 * That split is what stops the hosted planner from quietly drifting from the
 * one used in development, which is the failure mode of "port the handler to
 * the platform" — you end up with two implementations and only one of them
 * gets the next fix.
 */

export interface StreamOptions {
  /** Polled between frames. Both runtimes can detect a hung-up client. */
  isCancelled?: () => boolean;
  /** Set to 0 in tests; the staged latency is a UX device, not a constraint. */
  latency?: number;
}

/**
 * Simulated think time.
 *
 * Real generation is not uniform: the model thinks, then emits a burst. The
 * jitter is deliberate so no client can accidentally depend on a fixed cadence.
 */
function pause(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  const spread = ms * 0.25;
  const actual = ms - spread + Math.random() * spread * 2;
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, actual)));
}

export async function* planEvents(
  request: PlanRequest,
  options: StreamOptions = {},
): AsyncGenerator<PlanEvent> {
  const { isCancelled = () => false, latency = 1 } = options;
  const state = createPlannerState(request);

  if (!state) {
    await pause(500 * latency);
    yield {
      type: 'error',
      code: 'unknown_destination',
      message: `We do not have a venue catalogue for "${request.destination}" yet. Try one of the ${String(CITIES.length)} cities on the map.`,
    };
    return;
  }

  const { city } = state;
  const messages = statusMessages(city, request);

  // Phase 1 — thinking. Status frames only.
  for (const [index, message] of messages.entries()) {
    if (isCancelled()) return;

    yield {
      type: 'status',
      message,
      // Status occupies the first 35% of the bar; days fill the rest.
      progress: ((index + 1) / messages.length) * 0.35,
    };
    await pause((index === 0 ? 700 : 520) * latency);
  }

  if (isCancelled()) return;

  // Phase 2 — the envelope. The client can render the header, the map and the
  // day skeletons from this alone.
  yield {
    type: 'meta',
    id: `trip_${city.id}_${tripSuffix(request)}`,
    meta: buildMeta(city, request),
    summary: buildSummary(city, request),
    totalDays: request.days,
  };

  await pause(400 * latency);

  // Phase 3 — one day at a time. This is the frame the UI animates in.
  const days: ItineraryDay[] = [];

  for (let dayNumber = 1; dayNumber <= request.days; dayNumber += 1) {
    if (isCancelled()) return;

    const day = composeDay(state, dayNumber);
    days.push(day);

    yield { type: 'day', day };
    yield {
      type: 'status',
      message:
        dayNumber === request.days
          ? 'Checking the whole plan for conflicts…'
          : `Building day ${String(dayNumber + 1)} of ${String(request.days)}…`,
      progress: 0.35 + (dayNumber / request.days) * 0.6,
    };

    await pause(620 * latency);
  }

  if (isCancelled()) return;

  // Phase 4 — close.
  yield {
    type: 'done',
    highlights: buildHighlights(days, city),
    generatedAt: new Date().toISOString(),
  };
}

/** Deterministic id suffix: the same request always yields the same trip id. */
function tripSuffix(request: PlanRequest): string {
  const rng = createRng(
    `${request.destination}:${String(request.days)}:${request.moods.join(',')}:${request.pace}:${String(request.budgetPerDay)}`,
  );

  return Math.floor(rng() * 0xffffff)
    .toString(36)
    .padStart(5, '0');
}

/** Serialises one event as an SSE frame. Shared so the wire format is one line. */
export function toSseFrame(event: PlanEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}
