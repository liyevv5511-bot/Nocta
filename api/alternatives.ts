import { buildAlternatives } from '../server/alternatives';
import { AlternativesRequestSchema } from '../src/types/itinerary';

/**
 * POST /api/alternatives — the "swap this" suggestions.
 *
 * The selection logic lives in `server/alternatives.ts` so this handler and the
 * Express route are two transports over one implementation.
 */
export const config = { runtime: 'nodejs' };

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

  const parsed = AlternativesRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'invalid_request' }, { status: 400 });
  }

  const alternatives = buildAlternatives(parsed.data);
  if (!alternatives) {
    return Response.json({ error: 'unknown_destination' }, { status: 404 });
  }

  return Response.json(
    { alternatives },
    // The catalogue is static, so a swap list is safely cacheable at the edge.
    { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=3600' } },
  );
}
