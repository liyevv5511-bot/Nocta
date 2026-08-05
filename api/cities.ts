import { CITIES } from '../src/data/cities';

/**
 * GET /api/cities — the destination catalogue.
 *
 * The client bundles this data too; the endpoint exists so the catalogue is
 * inspectable without reading a JS chunk, and so a future client can drop it
 * from the bundle without the server changing shape.
 */
export const config = { runtime: 'nodejs' };

export default function handler(): Response {
  return Response.json(
    { cities: CITIES },
    // Immutable per deploy: the catalogue only changes when the build does.
    { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=86400' } },
  );
}
