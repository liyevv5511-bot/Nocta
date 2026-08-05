import { useCallback, useEffect, useRef, useState } from 'react';

import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import type { Coordinates } from '@/types/itinerary';

import type { Viewport } from './markers';

export interface CameraTarget {
  centre: Coordinates;
  zoom: number;
}

export interface MapCamera {
  viewport: Viewport;
  /** Animated move. This is the "fly to" the map exposes to the rest of the app. */
  flyTo: (target: CameraTarget) => void;
  /** Immediate move — used on resize and on first mount. */
  jumpTo: (target: CameraTarget) => void;
  isMoving: boolean;
}

const WORLD: CameraTarget = { centre: { lat: 20, lng: 10 }, zoom: 1 };

/** Duration scales with distance: a hop to a neighbour should not take as
 *  long as crossing the Pacific. Bounded so neither extreme is tedious. */
function flightDuration(from: Coordinates, to: Coordinates, reduced: boolean): number {
  if (reduced) return 0;
  const distance = Math.hypot(to.lat - from.lat, shortestLngDelta(from.lng, to.lng));
  return Math.min(1600, Math.max(650, 380 + distance * 6));
}

function shortestLngDelta(from: number, to: number): number {
  let delta = to - from;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  return delta;
}

/** The house easing curve, as a scalar function of progress. */
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - 2 ** (-10 * t);
}

/**
 * Camera controller.
 *
 * Drives centre and zoom with `requestAnimationFrame` rather than CSS or
 * Framer, for one reason: the values are consumed by a canvas renderer, which
 * needs them as numbers on the frame it draws, not as an interpolated style on
 * a DOM node.
 *
 * Longitude interpolates along the *shorter* arc, so flying from Tokyo to
 * Reykjavík crosses the Pacific rather than spinning the long way round
 * through Europe — the naive lerp does the latter and it looks broken.
 */
export function useMapCamera(size: { width: number; height: number }): MapCamera {
  const reducedMotion = usePrefersReducedMotion();

  const [camera, setCamera] = useState<CameraTarget>(WORLD);
  const [isMoving, setIsMoving] = useState(false);
  const frameRef = useRef<number | null>(null);

  const cancel = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const jumpTo = useCallback(
    (target: CameraTarget) => {
      cancel();
      setIsMoving(false);
      setCamera(target);
    },
    [cancel],
  );

  const flyTo = useCallback(
    (target: CameraTarget) => {
      cancel();

      setCamera((from) => {
        const duration = flightDuration(from.centre, target.centre, reducedMotion);

        if (duration === 0) {
          setIsMoving(false);
          return target;
        }

        const startTime = performance.now();
        const lngDelta = shortestLngDelta(from.centre.lng, target.centre.lng);
        setIsMoving(true);

        const step = (now: number): void => {
          const progress = Math.min(1, (now - startTime) / duration);
          const eased = easeOutExpo(progress);

          setCamera({
            centre: {
              lat: from.centre.lat + (target.centre.lat - from.centre.lat) * eased,
              lng: from.centre.lng + lngDelta * eased,
            },
            // Zoom interpolates logarithmically — linear zoom accelerates
            // visibly at the top of the range and reads as a jolt.
            zoom: from.zoom * (target.zoom / from.zoom) ** eased,
          });

          if (progress < 1) {
            frameRef.current = requestAnimationFrame(step);
          } else {
            frameRef.current = null;
            setIsMoving(false);
          }
        };

        frameRef.current = requestAnimationFrame(step);
        return from;
      });
    },
    [cancel, reducedMotion],
  );

  useEffect(() => cancel, [cancel]);

  return {
    viewport: { width: size.width, height: size.height, centre: camera.centre, zoom: camera.zoom },
    flyTo,
    jumpTo,
    isMoving,
  };
}

export const WORLD_VIEW = WORLD;
