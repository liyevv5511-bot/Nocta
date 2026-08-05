import type { City } from '@/types/city';
import type { Coordinates } from '@/types/itinerary';

/**
 * Projection, clustering and great-circle geometry.
 *
 * Pure functions, no DOM. The canvas renderer and the SVG fallback both draw
 * from these, which is what keeps the two implementations agreeing about
 * where a city is — the classic failure mode of having a "real" map and a
 * "simple" map is that they disagree by a few degrees and nobody notices
 * until a marker sits in the sea.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Viewport {
  width: number;
  height: number;
  /** Centre of the view, in degrees. */
  centre: Coordinates;
  /** 1 = whole world fits the width. */
  zoom: number;
}

/* -------------------------------------------------------------------------
 * Equirectangular — used by the flat world map
 * ---------------------------------------------------------------------- */

export function project(coordinates: Coordinates, viewport: Viewport): Point {
  const { width, height, centre, zoom } = viewport;

  const scaleX = (width * zoom) / 360;
  const scaleY = (height * zoom) / 180;

  return {
    x: width / 2 + wrapLongitude(coordinates.lng - centre.lng) * scaleX,
    y: height / 2 - (coordinates.lat - centre.lat) * scaleY,
  };
}

export function unproject(point: Point, viewport: Viewport): Coordinates {
  const { width, height, centre, zoom } = viewport;
  const scaleX = (width * zoom) / 360;
  const scaleY = (height * zoom) / 180;

  return {
    lng: wrapLongitude(centre.lng + (point.x - width / 2) / scaleX),
    lat: clampLatitude(centre.lat - (point.y - height / 2) / scaleY),
  };
}

/** Keeps longitude in (-180, 180] so a marker near the antimeridian does not
 *  render 20,000 km off-screen. */
export function wrapLongitude(lng: number): number {
  let value = lng;
  while (value > 180) value -= 360;
  while (value <= -180) value += 360;
  return value;
}

export function clampLatitude(lat: number): number {
  return Math.max(-85, Math.min(85, lat));
}

/* -------------------------------------------------------------------------
 * Orthographic — used by the hero globe
 * ---------------------------------------------------------------------- */

export interface GlobeProjection extends Point {
  /** `false` when the point is on the far side and must not be drawn. */
  visible: boolean;
  /** 0 at the limb, 1 at the centre — drives marker opacity and size. */
  depth: number;
}

export function projectGlobe(
  coordinates: Coordinates,
  rotationDeg: number,
  tiltDeg: number,
  radius: number,
  centre: Point,
): GlobeProjection {
  const lat = (coordinates.lat * Math.PI) / 180;
  const lng = ((coordinates.lng + rotationDeg) * Math.PI) / 180;
  const tilt = (tiltDeg * Math.PI) / 180;

  // Unit sphere, then tilt about the x-axis.
  const x = Math.cos(lat) * Math.sin(lng);
  const y0 = Math.sin(lat);
  const z0 = Math.cos(lat) * Math.cos(lng);

  const y = y0 * Math.cos(tilt) - z0 * Math.sin(tilt);
  const z = y0 * Math.sin(tilt) + z0 * Math.cos(tilt);

  return {
    x: centre.x + x * radius,
    y: centre.y - y * radius,
    visible: z > 0,
    depth: Math.max(0, z),
  };
}

/* -------------------------------------------------------------------------
 * Great-circle interpolation — the animated route arcs
 * ---------------------------------------------------------------------- */

/**
 * Points along the great circle between two coordinates, via spherical linear
 * interpolation. A straight line in screen space between two cities is wrong
 * at any distance worth flying, and looks wrong even when it is not.
 */
export function greatCircle(from: Coordinates, to: Coordinates, segments = 64): Coordinates[] {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const toDeg = (rad: number): number => (rad * 180) / Math.PI;

  const lat1 = toRad(from.lat);
  const lng1 = toRad(from.lng);
  const lat2 = toRad(to.lat);
  const lng2 = toRad(to.lng);

  const delta =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((lat2 - lat1) / 2) ** 2 +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2,
      ),
    );

  // Coincident points: no arc to draw.
  if (delta === 0 || Number.isNaN(delta)) return [from, to];

  const points: Coordinates[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const f = i / segments;
    const a = Math.sin((1 - f) * delta) / Math.sin(delta);
    const b = Math.sin(f * delta) / Math.sin(delta);

    const x = a * Math.cos(lat1) * Math.cos(lng1) + b * Math.cos(lat2) * Math.cos(lng2);
    const y = a * Math.cos(lat1) * Math.sin(lng1) + b * Math.cos(lat2) * Math.sin(lng2);
    const z = a * Math.sin(lat1) + b * Math.sin(lat2);

    points.push({
      lat: toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))),
      lng: toDeg(Math.atan2(y, x)),
    });
  }

  return points;
}

/* -------------------------------------------------------------------------
 * Clustering
 * ---------------------------------------------------------------------- */

export interface Cluster {
  id: string;
  /** Screen position — the centroid of the members. */
  point: Point;
  cities: City[];
}

/**
 * Screen-space grid clustering.
 *
 * Grid buckets rather than a distance-based hierarchy: with a catalogue this
 * size, an O(n²) proximity pass is imperceptible either way, and the grid has
 * the property that matters here — it is stable under small camera moves, so
 * clusters do not flicker apart and back together while panning.
 */
export function clusterCities(
  cities: readonly City[],
  viewport: Viewport,
  cellSize = 64,
): Cluster[] {
  const buckets = new Map<string, { cities: City[]; sumX: number; sumY: number }>();

  for (const city of cities) {
    const point = project(city.coordinates, viewport);
    const key = `${String(Math.floor(point.x / cellSize))}:${String(Math.floor(point.y / cellSize))}`;

    const bucket = buckets.get(key);
    if (bucket) {
      bucket.cities.push(city);
      bucket.sumX += point.x;
      bucket.sumY += point.y;
    } else {
      buckets.set(key, { cities: [city], sumX: point.x, sumY: point.y });
    }
  }

  return [...buckets.entries()]
    .map(([key, bucket]) => ({
      id: key,
      point: { x: bucket.sumX / bucket.cities.length, y: bucket.sumY / bucket.cities.length },
      // Most popular first, so a collapsed cluster labels itself sensibly.
      cities: [...bucket.cities].sort((a, b) => b.popularity - a.popularity),
    }))
    .sort((a, b) => a.point.y - b.point.y);
}

/** Hit test in screen space, with a generous radius for touch. */
export function findClusterAt(
  clusters: readonly Cluster[],
  point: Point,
  radius = 22,
): Cluster | null {
  let best: Cluster | null = null;
  let bestDistance = radius;

  for (const cluster of clusters) {
    const dx = cluster.point.x - point.x;
    const dy = cluster.point.y - point.y;
    const distance = Math.hypot(dx, dy);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = cluster;
    }
  }

  return best;
}
