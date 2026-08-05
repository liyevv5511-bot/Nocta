import type { City } from '@/types/city';
import type { Coordinates } from '@/types/itinerary';

import { greatCircle, project, type Cluster, type Viewport } from './markers';

/**
 * Canvas painting.
 *
 * Separate from the component because drawing is not React's job and because
 * a render pass that runs sixty times a second should not be re-created on
 * every commit. The palette is passed in — read once from the CSS custom
 * properties — so the map follows the theme without this module knowing
 * anything about themes.
 */

export interface MapPalette {
  graticule: string;
  graticuleMajor: string;
  marker: string;
  markerMuted: string;
  markerText: string;
  arc: string;
  glow: string;
}

/** Reads the live token values off an element. Called on theme change only. */
export function readPalette(element: HTMLElement): MapPalette {
  const styles = getComputedStyle(element);
  const token = (name: string): string => styles.getPropertyValue(name).trim();

  return {
    graticule: token('--border-subtle'),
    graticuleMajor: token('--border-default'),
    marker: token('--accent'),
    markerMuted: token('--text-tertiary'),
    markerText: token('--accent-contrast'),
    arc: token('--accent-alt'),
    glow: token('--accent'),
  };
}

export interface RenderInput {
  ctx: CanvasRenderingContext2D;
  viewport: Viewport;
  palette: MapPalette;
  clusters: readonly Cluster[];
  hoveredId: string | null;
  selectedId: string | null;
  /** Cities in route order. Drawn as animated great-circle arcs. */
  route: readonly City[];
  /** 0…1, drives the arc draw-on animation. */
  routeProgress: number;
}

const GRATICULE_STEP = 15;

export function renderMap(input: RenderInput): void {
  const { ctx, viewport, palette } = input;
  const { width, height } = viewport;

  ctx.clearRect(0, 0, width, height);

  drawGraticule(ctx, viewport, palette);
  drawRoute(input);
  drawClusters(input);
}

/**
 * The basemap.
 *
 * A graticule rather than coastlines — this is a deliberate design position,
 * not a missing feature. The map's job here is "where in the world, and how
 * far apart", and a stylised grid answers that without shipping a megabyte of
 * vector tiles or requiring an API key. See `MapProvider` for how a real
 * Mapbox basemap slots in behind the same interface.
 */
function drawGraticule(
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  palette: MapPalette,
): void {
  ctx.lineWidth = 1;

  for (let lat = -75; lat <= 75; lat += GRATICULE_STEP) {
    const isEquator = lat === 0;
    ctx.beginPath();
    ctx.strokeStyle = isEquator ? palette.graticuleMajor : palette.graticule;

    const start = project({ lat, lng: -180 }, viewport);
    const end = project({ lat, lng: 180 }, viewport);
    ctx.moveTo(0, start.y);
    ctx.lineTo(width(ctx), end.y);
    ctx.stroke();
  }

  for (let lng = -180; lng <= 180; lng += GRATICULE_STEP) {
    const isMeridian = lng === 0;
    ctx.beginPath();
    ctx.strokeStyle = isMeridian ? palette.graticuleMajor : palette.graticule;

    const top = project({ lat: 85, lng }, viewport);
    const bottom = project({ lat: -85, lng }, viewport);
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(bottom.x, bottom.y);
    ctx.stroke();
  }
}

function width(ctx: CanvasRenderingContext2D): number {
  return ctx.canvas.width / (window.devicePixelRatio || 1);
}

function drawRoute(input: RenderInput): void {
  const { ctx, viewport, palette, route, routeProgress } = input;
  if (route.length < 2) return;

  ctx.save();
  ctx.strokeStyle = palette.arc;
  ctx.lineWidth = 1.75;
  ctx.lineCap = 'round';
  ctx.setLineDash([]);

  for (let i = 0; i < route.length - 1; i += 1) {
    const from = route[i];
    const to = route[i + 1];
    if (!from || !to) continue;

    // Each leg animates in sequence rather than all at once, so a five-city
    // route reads as a journey being drawn instead of a net appearing.
    const legStart = i / (route.length - 1);
    const legEnd = (i + 1) / (route.length - 1);
    const legProgress = Math.max(0, Math.min(1, (routeProgress - legStart) / (legEnd - legStart)));
    if (legProgress <= 0) break;

    drawArc(ctx, viewport, from.coordinates, to.coordinates, legProgress);
  }

  ctx.restore();
}

function drawArc(
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  from: Coordinates,
  to: Coordinates,
  progress: number,
): void {
  const points = greatCircle(from, to, 72);
  const visible = Math.max(2, Math.floor(points.length * progress));

  ctx.beginPath();
  let previousX: number | null = null;

  for (let i = 0; i < visible; i += 1) {
    const coordinate = points[i];
    if (!coordinate) continue;

    const point = project(coordinate, viewport);

    // The arc wraps the antimeridian: break the path rather than drawing a
    // horizontal streak across the whole map.
    if (previousX !== null && Math.abs(point.x - previousX) > viewport.width / 2) {
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    } else if (i === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }

    previousX = point.x;
  }

  ctx.stroke();
}

function drawClusters(input: RenderInput): void {
  const { ctx, palette, clusters, hoveredId, selectedId } = input;

  for (const cluster of clusters) {
    const isCluster = cluster.cities.length > 1;
    const primary = cluster.cities[0];
    if (!primary) continue;

    const isHovered = cluster.id === hoveredId;
    const isSelected = cluster.cities.some((city) => city.id === selectedId);

    const baseRadius = isCluster ? 14 : 5 + primary.popularity * 4;
    const radius = baseRadius * (isHovered || isSelected ? 1.35 : 1);

    if (isHovered || isSelected) {
      const gradient = ctx.createRadialGradient(
        cluster.point.x,
        cluster.point.y,
        0,
        cluster.point.x,
        cluster.point.y,
        radius * 4,
      );
      gradient.addColorStop(0, palette.glow);
      gradient.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cluster.point.x, cluster.point.y, radius * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.beginPath();
    ctx.fillStyle = isSelected || isHovered ? palette.marker : palette.markerMuted;
    ctx.arc(cluster.point.x, cluster.point.y, radius, 0, Math.PI * 2);
    ctx.fill();

    if (isCluster) {
      ctx.fillStyle = palette.markerText;
      ctx.font = '600 11px ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(cluster.cities.length), cluster.point.x, cluster.point.y + 0.5);
    }
  }
}
