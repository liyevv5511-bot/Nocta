import cors from 'cors';
import express, { type Request, type Response } from 'express';

import { CITIES } from '../src/data/cities';
import {
  AlternativesRequestSchema,
  PlanRequestSchema,
  type PlanRequest,
} from '../src/types/itinerary';
import { buildAlternatives } from './alternatives';
import { planEvents, toSseFrame } from './planStream';

/**
 * The mock AI service.
 *
 * This is a real HTTP service with a real streaming protocol, not a fixture
 * the client pretends to wait for. It validates its input with the shared Zod
 * schema, emits a discriminated-union event stream over SSE, and applies
 * staged latency so the client's progressive-render path is exercised for
 * real rather than hypothetically.
 *
 * The event sequence itself lives in `planStream.ts`, shared with the
 * serverless function that serves the deployed build — so the hosted planner
 * cannot drift from the one used in development.
 *
 * SWAPPING IN A REAL MODEL: replace the body of `planEvents` — hand
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
    for await (const event of planEvents(request, { isCancelled })) {
      if (isCancelled()) return;
      res.write(toSseFrame(event));
    }

    if (!res.writableEnded) res.end();
  } catch (error) {
    console.error('[plan] generation failed', error);

    if (!res.writableEnded) {
      res.write(
        toSseFrame({
          type: 'error',
          code: 'internal',
          message: 'The planner failed part-way through. Nothing was saved — try again.',
        }),
      );
      res.end();
    }
  }
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

  const alternatives = buildAlternatives(parsed.data);
  if (!alternatives) {
    res.status(404).json({ error: 'unknown_destination' });
    return;
  }

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
