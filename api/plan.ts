import { planEvents, toSseFrame } from '../server/planStream';
import { PlanRequestSchema } from '../src/types/itinerary';

/**
 * POST /api/plan — the deployed planner.
 *
 * The Express service in `server/` is the development entry point; this is the
 * same planner behind a serverless function. Both consume `planEvents`, so
 * there is one implementation of the sequence and one place to change when the
 * mock becomes a real model.
 *
 * Written against the Web `Request`/`Response` API rather than Node's
 * `(req, res)`: streaming a `ReadableStream` back is the part that has to work,
 * and the Web signature is the one that streams on every runtime Vercel offers
 * rather than only on some of them.
 */
export const config = { runtime: 'nodejs' };

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  // Without this a proxy will buffer the whole stream and deliver it at once,
  // which turns the entire progressive-render design into a spinner.
  'X-Accel-Buffering': 'no',
} as const;

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json({ error: 'method_not_allowed' }, { status: 405 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = PlanRequestSchema.safeParse(body);

  // A bad request is answered as JSON, before the stream opens — a client that
  // never gets a 200 should never be left parsing SSE frames.
  if (!parsed.success) {
    return Response.json(
      {
        error: 'invalid_request',
        detail: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const encoder = new TextEncoder();

  // `request.signal` aborts when the client hangs up — a navigation away, or
  // the app's own cancel button. Without honouring it the function keeps
  // composing days nobody will read, and bills for the privilege.
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of planEvents(parsed.data, {
          isCancelled: () => request.signal.aborted,
        })) {
          if (request.signal.aborted) break;
          controller.enqueue(encoder.encode(toSseFrame(event)));
        }
      } catch (error) {
        console.error('[plan] generation failed', error);

        controller.enqueue(
          encoder.encode(
            toSseFrame({
              type: 'error',
              code: 'internal',
              message: 'The planner failed part-way through. Nothing was saved — try again.',
            }),
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
