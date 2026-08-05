import cors from 'cors';
import express, { type Request, type Response } from 'express';

import { CITIES, CITY_BY_ID, findCityByName } from '../src/data/cities';
import { photo, PHOTO_SIZES } from '../src/data/images';
import { getCityVenues } from '../src/data/venues';
import {
  AlternativesRequestSchema,
  PlanRequestSchema,
  type ActivityBlock,
  type ItineraryDay,
  type PlanEvent,
  type PlanRequest,
} from '../src/types/itinerary';
import {
  buildHighlights,
  buildMeta,
  buildSummary,
  composeDay,
  createPlannerState,
  createRng,
  statusMessages,
} from './planner';

/**
 * The mock AI service.
 *
 * This is a real HTTP service with a real streaming protocol, not a fixture
 * the client pretends to wait for. It validates its input with the shared Zod
 * schema, emits a discriminated-union event stream over SSE, and applies
 * staged latency so the client's progressive-render path is exercised for
 * real rather than hypothetically.
 *
 * SWAPPING IN A REAL MODEL: replace the body of `streamPlan` — hand
 * `PlanRequestSchema`'s output plus `ItinerarySchema` to a model as a
 * structured-output request, and forward its partial days as `day` frames.
 * Every other file in this repository stays as it is.
 */

const PORT = Number(process.env.PORT ?? 8787);
const app = express();

app.use(express.json({ limit: '64kb' }));
app.use(
  cors({
    origin: process.env.NOCTA_ALLOWED_ORIGIN ?? true,
    methods: ['GET', 'POST'],
  }),
);

/* -------------------------------------------------------------------------
 * Simulated latency
 *
 * Real generation is not uniform: the model thinks for a while, then emits a
 * burst. `pause` is deliberately jittered so the client cannot accidentally
 * depend on a fixed cadence.
 * ---------------------------------------------------------------------- */

function pause(ms: number, jitter = 0.25): Promise<void> {
  const spread = ms * jitter;
  const actual = ms - spread + Math.random() * spread * 2;
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, actual)));
}

/* -------------------------------------------------------------------------
 * SSE plumbing
 * ---------------------------------------------------------------------- */

function openStream(res: Response): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    // Nginx and friends buffer SSE into uselessness without this.
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
}

function send(res: Response, event: PlanEvent): void {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

/* -------------------------------------------------------------------------
 * POST /api/plan  →  text/event-stream
 * ---------------------------------------------------------------------- */

app.post('/api/plan', (req: Request, res: Response) => {
  const parsed = PlanRequestSchema.safeParse(req.body);

  // A bad request is answered as JSON, before the stream opens — a client that
  // never gets a 200 should never be left parsing SSE frames.
  if (!parsed.success) {
    res.status(400).json({
      error: 'invalid_request',
      detail: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  void streamPlan(parsed.data, res);
});

async function streamPlan(request: PlanRequest, res: Response): Promise<void> {
  openStream(res);

  // The client hanging up mid-generation is the normal case (navigation,
  // "cancel"), not an error. Everything downstream checks this flag.
  // Read through a function rather than as a variable. The flag is only ever
  // written from the 'close' callback, which control-flow analysis cannot see;
  // reading a plain `let` would be narrowed to `false` for the whole body and
  // every cancellation check would be compiled away as dead code.
  let cancelled = false;
  const isCancelled = (): boolean => cancelled;
  res.on('close', () => {
    cancelled = true;
  });

  try {
    const state = createPlannerState(request);

    if (!state) {
      await pause(500);
      send(res, {
        type: 'error',
        code: 'unknown_destination',
        message: `We do not have a venue catalogue for "${request.destination}" yet. Try one of the eight cities on the map.`,
      });
      res.end();
      return;
    }

    const { city } = state;
    const messages = statusMessages(city, request);

    // Phase 1 — thinking. Status frames only.
    for (let i = 0; i < messages.length; i += 1) {
      if (isCancelled()) return;
      const message = messages[i];
      if (!message) continue;
      send(res, {
        type: 'status',
        message,
        // Status occupies the first 35% of the bar; days fill the rest.
        progress: ((i + 1) / messages.length) * 0.35,
      });
      await pause(i === 0 ? 700 : 520);
    }

    if (isCancelled()) return;

    // Phase 2 — the envelope. The client can render the header, the map and
    // the day skeletons from this alone.
    send(res, {
      type: 'meta',
      id: `trip_${city.id}_${createTripSuffix(request)}`,
      meta: buildMeta(city, request),
      summary: buildSummary(city, request),
      totalDays: request.days,
    });

    await pause(400);

    // Phase 3 — one day at a time. This is the frame the UI animates in.
    const days: ItineraryDay[] = [];
    for (let dayNumber = 1; dayNumber <= request.days; dayNumber += 1) {
      if (isCancelled()) return;

      const day = composeDay(state, dayNumber);
      days.push(day);

      send(res, { type: 'day', day });
      send(res, {
        type: 'status',
        message:
          dayNumber === request.days
            ? 'Checking the whole plan for conflicts…'
            : `Building day ${String(dayNumber + 1)} of ${String(request.days)}…`,
        progress: 0.35 + (dayNumber / request.days) * 0.6,
      });

      await pause(620);
    }

    if (isCancelled()) return;

    // Phase 4 — close.
    send(res, {
      type: 'done',
      highlights: buildHighlights(days, city),
      generatedAt: new Date().toISOString(),
    });
    res.end();
  } catch (error) {
    console.error('[plan] generation failed', error);
    if (!res.writableEnded) {
      send(res, {
        type: 'error',
        code: 'internal',
        message: 'The planner failed part-way through. Nothing was saved — try again.',
      });
      res.end();
    }
  }
}

function createTripSuffix(request: PlanRequest): string {
  const rng = createRng(
    `${request.destination}:${String(request.days)}:${request.moods.join(',')}:${request.pace}:${String(request.budgetPerDay)}`,
  );
  return Math.floor(rng() * 0xffffff)
    .toString(36)
    .padStart(5, '0');
}

/* -------------------------------------------------------------------------
 * POST /api/alternatives  →  "swap this block"
 * ---------------------------------------------------------------------- */

app.post('/api/alternatives', (req: Request, res: Response) => {
  const parsed = AlternativesRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_request' });
    return;
  }

  const { destination, kind, blockId, budgetPerDay } = parsed.data;
  const city = findCityByName(destination) ?? CITY_BY_ID.get(destination);
  const venues = city ? getCityVenues(city.id) : undefined;

  if (!city || !venues) {
    res.status(404).json({ error: 'unknown_destination' });
    return;
  }

  // Prefer the same kind — a swap should be a different museum, not a bar.
  const sameKind = venues.venues.filter((v) => v.kind === kind);
  const fallback = venues.venues.filter((v) => v.kind !== kind);
  const pool = [...sameKind, ...fallback].filter((v) => v.price <= budgetPerDay);

  const chosen = (pool.length > 0 ? pool : venues.venues).slice(0, 3);

  const alternatives: ActivityBlock[] = chosen.map((venue, index) => ({
    id: `${blockId}-alt-${String(index)}`,
    kind: venue.kind,
    title: venue.title,
    summary: venue.summary,
    startTime: '12:00',
    durationMinutes: venue.durationMinutes,
    place: {
      name: venue.title,
      address: venue.address,
      coordinates: venue.coordinates,
      walkFromPrevious: null,
    },
    price: venue.price,
    tags: venue.tags.slice(0, 6),
    imageUrl: photo(venue.imageSeed, PHOTO_SIZES.card),
    note: venue.note ?? null,
  }));

  res.json({ alternatives });
});

/* -------------------------------------------------------------------------
 * GET /api/cities  →  the destination catalogue
 * ---------------------------------------------------------------------- */

app.get('/api/cities', (_req: Request, res: Response) => {
  res.json({ cities: CITIES });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, cities: CITIES.length, uptime: process.uptime() });
});

/* ---------------------------------------------------------------------- */

const server = app.listen(PORT, () => {
  console.log(`[nocta] mock AI service on http://localhost:${String(PORT)}`);
  console.log(`[nocta] ${String(CITIES.length)} cities in the catalogue`);
});

// Without this, an in-flight SSE stream keeps the process alive through Ctrl-C.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => {
      process.exit(0);
    });
  });
}
