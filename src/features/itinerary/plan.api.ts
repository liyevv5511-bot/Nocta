import { ApiError, toApiError } from '@/types/api';
import {
  AlternativesResponseSchema,
  PlanEventSchema,
  type ActivityBlock,
  type ActivityKind,
  type PlanEvent,
  type PlanRequest,
} from '@/types/itinerary';

/**
 * The transport.
 *
 * `fetch` + a `ReadableStream` reader rather than `EventSource`, for one
 * decisive reason: `EventSource` cannot issue a POST, and the plan request is
 * a body, not a query string. Cramming the request into a URL would cap it at
 * the browser's URL length and put the user's inputs in every access log.
 *
 * Everything that comes back is parsed through `PlanEventSchema`. A frame the
 * schema rejects is dropped and reported — it never reaches state. That is
 * what makes swapping in a real model safe: the model can hallucinate a shape,
 * and the UI still cannot be corrupted by it.
 */

const ENDPOINT = '/api/plan';
const GENERATION_TIMEOUT_MS = 45_000;

export interface StreamHandlers {
  onEvent: (event: PlanEvent) => void;
  /** Called for frames that arrive but fail validation. Non-fatal. */
  onInvalidFrame?: (raw: string, issue: string) => void;
}

/**
 * Streams a plan. Resolves when the server closes the stream; rejects with an
 * `ApiError` on transport failure, timeout or abort.
 */
export async function streamPlan(
  request: PlanRequest,
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  // Compose the caller's signal with our own timeout, so a hung server does
  // not leave a spinner running forever and a user cancel still wins.
  const timeoutController = new AbortController();
  const timer = window.setTimeout(() => {
    timeoutController.abort(new DOMException('Generation timed out', 'TimeoutError'));
  }, GENERATION_TIMEOUT_MS);

  const composed = signal
    ? AbortSignal.any([signal, timeoutController.signal])
    : timeoutController.signal;

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(request),
      signal: composed,
    });

    if (!response.ok) {
      throw new ApiError(
        response.status === 429 ? 'rate_limited' : 'server',
        `Planner responded ${String(response.status)}`,
      );
    }

    if (!response.body) {
      throw new ApiError('server', 'Planner returned an empty stream');
    }

    await consume(response.body, handlers);
  } catch (error) {
    if (timeoutController.signal.aborted && !(signal?.aborted ?? false)) {
      throw new ApiError('timeout', 'Generation timed out');
    }
    throw toApiError(error);
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * SSE framing.
 *
 * Frames are separated by a blank line and may be split across any number of
 * network chunks — the buffer below is not optional defensiveness, it is the
 * protocol. A naive `JSON.parse(chunk)` works locally and fails the moment a
 * real network splits a frame.
 */
async function consume(body: ReadableStream<Uint8Array>, handlers: StreamHandlers): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let separator = buffer.indexOf('\n\n');
      while (separator !== -1) {
        const frame = buffer.slice(0, separator);
        buffer = buffer.slice(separator + 2);
        dispatch(frame, handlers);
        separator = buffer.indexOf('\n\n');
      }
    }

    // A final frame with no trailing blank line.
    if (buffer.trim().length > 0) dispatch(buffer, handlers);
  } finally {
    reader.releaseLock();
  }
}

function dispatch(frame: string, handlers: StreamHandlers): void {
  const payload = frame
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .join('');

  if (payload.length === 0) return;

  let json: unknown;
  try {
    json = JSON.parse(payload);
  } catch {
    handlers.onInvalidFrame?.(payload, 'not valid JSON');
    return;
  }

  const parsed = PlanEventSchema.safeParse(json);
  if (!parsed.success) {
    handlers.onInvalidFrame?.(payload, parsed.error.issues[0]?.message ?? 'schema mismatch');
    return;
  }

  handlers.onEvent(parsed.data);
}

/* -------------------------------------------------------------------------
 * Alternatives
 * ---------------------------------------------------------------------- */

export async function fetchAlternatives(
  input: { destination: string; blockId: string; kind: ActivityKind; budgetPerDay: number },
  signal?: AbortSignal,
): Promise<ActivityBlock[]> {
  try {
    const response = await fetch('/api/alternatives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      ...(signal ? { signal } : {}),
    });

    if (response.status === 404) {
      throw new ApiError('not_found', 'No alternatives for this destination');
    }
    if (!response.ok) {
      throw new ApiError('server', `Alternatives responded ${String(response.status)}`);
    }

    const parsed = AlternativesResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      throw new ApiError('validation', 'Alternatives payload did not match the schema');
    }

    return parsed.data.alternatives;
  } catch (error) {
    throw toApiError(error);
  }
}
