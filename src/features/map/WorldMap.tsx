import { AnimatePresence } from 'framer-motion';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CITIES } from '@/data/cities';
import { useThemeStore } from '@/features/theme/theme.store';
import { cn } from '@/lib/cn';
import { useElementSize } from '@/lib/useElementSize';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import type { City } from '@/types/city';

import { CityCard } from './CityCard';
import { CityList } from './CityList';
import { clusterCities, findClusterAt } from './markers';
import { readPalette, renderMap, type MapPalette } from './renderMap';
import { useMapCamera, WORLD_VIEW } from './useMapCamera';

export interface WorldMapProps {
  /** Cities drawn as a connected route. Empty for the plain destination map. */
  route?: readonly City[];
  /**
   * Renders the focusable destination list beside the canvas.
   *
   * Only pass `false` when the surrounding page already exposes the same
   * cities as real, focusable controls — the route builder does, through its
   * stop list and city picker. The canvas has no accessibility surface of its
   * own, so switching this off without a replacement removes the feature for
   * anyone not using a pointer.
   */
  showDestinationList?: boolean;
  className?: string;
}

const CITY_ZOOM = 5.5;

/**
 * The interactive world map.
 *
 * Canvas rather than DOM markers: at cluster level this redraws on every
 * camera frame, and sixty style recalculations a second across N absolutely
 * positioned nodes is exactly the kind of thing that shows up as jank on a
 * mid-range phone.
 *
 * Because canvas has no accessibility surface at all, the same data is
 * rendered as a real, focusable list beside it (`CityList`). That list is not
 * a fallback — it is always present, always in the tab order, and selecting
 * from it drives the same camera. Keyboard and screen-reader users get the
 * feature, not a notice explaining that they cannot have it.
 */
export function WorldMap({
  route = [],
  showDestinationList = true,
  className,
}: WorldMapProps): React.ReactElement {
  const { t } = useTranslation();
  const [containerRef, size] = useElementSize();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paletteRef = useRef<MapPalette | null>(null);

  const resolvedTheme = useThemeStore((state) => state.resolved);
  const reducedMotion = usePrefersReducedMotion();

  const camera = useMapCamera(size);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selected, setSelected] = useState<City | null>(null);
  const [routeProgress, setRouteProgress] = useState(reducedMotion ? 1 : 0);

  const clusters = useMemo(
    () => (size.width > 0 ? clusterCities(CITIES, camera.viewport) : []),
    [size.width, camera.viewport],
  );

  /* ------------------------------------------------------------- Palette */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) paletteRef.current = readPalette(canvas);
  }, [resolvedTheme]);

  /* -------------------------------------------------------- Route reveal */
  useEffect(() => {
    if (route.length < 2 || reducedMotion) {
      setRouteProgress(1);
      return;
    }

    setRouteProgress(0);
    const started = performance.now();
    const duration = 400 * route.length;
    let frame = requestAnimationFrame(function step(now: number): void {
      const progress = Math.min(1, (now - started) / duration);
      setRouteProgress(progress);
      if (progress < 1) frame = requestAnimationFrame(step);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [route, reducedMotion]);

  /* ---------------------------------------------------------- Draw pass */
  useEffect(() => {
    const canvas = canvasRef.current;
    const palette = paletteRef.current;
    if (!canvas || !palette || size.width === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size.width * dpr;
    canvas.height = size.height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderMap({
      ctx,
      viewport: camera.viewport,
      palette,
      clusters,
      hoveredId,
      selectedId: selected?.id ?? null,
      route,
      routeProgress,
    });
  }, [size, camera.viewport, clusters, hoveredId, selected, route, routeProgress]);

  /* ------------------------------------------------------------- Pointer */
  const pointFromEvent = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }, []);

  const select = useCallback(
    (city: City) => {
      setSelected(city);
      camera.flyTo({ centre: city.coordinates, zoom: CITY_ZOOM });
    },
    [camera],
  );

  const clearSelection = useCallback(() => {
    setSelected(null);
    camera.flyTo(WORLD_VIEW);
  }, [camera]);

  return (
    <div className={cn('grid gap-6', showDestinationList && 'lg:grid-cols-[1fr_20rem]', className)}>
      <div
        ref={containerRef}
        className="relative aspect-[16/10] overflow-hidden rounded-xl border border-subtle bg-surface-sunken lg:aspect-auto lg:min-h-[32rem]"
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{ width: size.width, height: size.height }}
          className="absolute inset-0 cursor-crosshair"
          onPointerMove={(event) => {
            const cluster = findClusterAt(clusters, pointFromEvent(event));
            setHoveredId(cluster?.id ?? null);
            event.currentTarget.style.cursor = cluster ? 'pointer' : 'crosshair';
          }}
          onPointerLeave={() => {
            setHoveredId(null);
          }}
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const cluster = findClusterAt(clusters, {
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            });
            const city = cluster?.cities[0];
            if (city) select(city);
            else clearSelection();
          }}
        />

        <AnimatePresence>
          {selected === null ? null : (
            <CityCard
              key={selected.id}
              city={selected}
              onClose={clearSelection}
              className="absolute inset-x-4 bottom-4 sm:inset-x-auto sm:left-4 sm:w-80"
            />
          )}
        </AnimatePresence>

        <p className="pointer-events-none absolute top-4 right-4 rounded-pill border border-subtle bg-canvas/70 px-3 py-1 text-mono-xs tracking-[0.09em] text-tertiary uppercase">
          {routeLabel(route, selected, t)}
        </p>
      </div>

      {showDestinationList ? (
        <CityList
          cities={CITIES}
          selectedId={selected?.id ?? null}
          onSelect={select}
          onHover={(cityId) => {
            const cluster = clusters.find((candidate) =>
              candidate.cities.some((city) => city.id === cityId),
            );
            setHoveredId(cluster?.id ?? null);
          }}
        />
      ) : null}
    </div>
  );
}

/** What the overlay chip says: the route if there is one, else the catalogue. */
function routeLabel(route: readonly City[], selected: City | null, t: TFunction): string {
  if (route.length > 0) return t('common.stops', { count: route.length });
  return selected === null ? t('map.destinationCount', { count: CITIES.length }) : selected.country;
}
