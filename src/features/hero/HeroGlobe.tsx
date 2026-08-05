import { useEffect, useRef } from 'react';

import { CITIES } from '@/data/cities';
import { useThemeStore } from '@/features/theme/theme.store';
import { greatCircle, projectGlobe } from '@/features/map/markers';
import { useElementSize } from '@/lib/useElementSize';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';

/**
 * The hero globe.
 *
 * An orthographic wireframe sphere with the catalogue's cities projected onto
 * it and great-circle arcs running between them. Hand-rolled on canvas rather
 * than three.js: the entire effect is a projection function and about eighty
 * lines of drawing, against ~600kb of WebGL runtime for something the user
 * looks at for four seconds. That trade is the whole reason the first-load
 * budget is achievable.
 *
 * Under `prefers-reduced-motion` the rotation stops and a single static frame
 * is drawn — the composition still works standing still, which is the test.
 */
export function HeroGlobe({ className }: { className?: string }): React.ReactElement {
  const [containerRef, size] = useElementSize();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const resolvedTheme = useThemeStore((state) => state.resolved);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size.width * dpr;
    canvas.height = size.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const styles = getComputedStyle(canvas);
    const palette = {
      grid: styles.getPropertyValue('--border-subtle').trim(),
      limb: styles.getPropertyValue('--border-default').trim(),
      marker: styles.getPropertyValue('--accent').trim(),
      arc: styles.getPropertyValue('--accent-alt').trim(),
    };

    const centre = { x: size.width / 2, y: size.height / 2 };
    const radius = Math.min(size.width, size.height) * 0.42;
    const tilt = 18;

    // Fixed set of legs, so the arcs are stable between frames rather than
    // re-randomised — a globe whose routes flicker looks broken, not alive.
    const legs = CITIES.slice(0, 6).map((city, index) => ({
      from: city.coordinates,
      to: (CITIES[(index + 3) % CITIES.length] ?? city).coordinates,
    }));

    let frame = 0;

    const draw = (): void => {
      const rotation = rotationRef.current;
      ctx.clearRect(0, 0, size.width, size.height);

      // Limb
      ctx.beginPath();
      ctx.strokeStyle = palette.limb;
      ctx.lineWidth = 1;
      ctx.arc(centre.x, centre.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Parallels
      ctx.strokeStyle = palette.grid;
      for (let lat = -60; lat <= 60; lat += 20) {
        strokePath(
          ctx,
          sample(-180, 180, 4, (lng) => ({ lat, lng })),
          rotation,
          tilt,
          radius,
          centre,
        );
      }

      // Meridians
      for (let lng = -180; lng < 180; lng += 20) {
        strokePath(
          ctx,
          sample(-85, 85, 4, (lat) => ({ lat, lng })),
          rotation,
          tilt,
          radius,
          centre,
        );
      }

      // Arcs
      ctx.strokeStyle = palette.arc;
      ctx.lineWidth = 1.25;
      for (const leg of legs) {
        strokePath(ctx, greatCircle(leg.from, leg.to, 48), rotation, tilt, radius, centre);
      }

      // Cities
      for (const city of CITIES) {
        const point = projectGlobe(city.coordinates, rotation, tilt, radius, centre);
        if (!point.visible) continue;

        ctx.globalAlpha = 0.35 + point.depth * 0.65;
        ctx.fillStyle = palette.marker;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2 + city.popularity * 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    };

    if (reducedMotion) {
      draw();
      return;
    }

    const loop = (): void => {
      // ~0.055°/frame ≈ one revolution every two minutes. Slow enough to read
      // as drift rather than spin.
      rotationRef.current = (rotationRef.current + 0.055) % 360;
      draw();
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [size, resolvedTheme, reducedMotion]);

  return (
    <div ref={containerRef} className={className} aria-hidden="true">
      <canvas ref={canvasRef} style={{ width: size.width, height: size.height }} />
    </div>
  );
}

/** Draws a coordinate path, breaking it wherever it crosses the far side. */
function strokePath(
  ctx: CanvasRenderingContext2D,
  path: { lat: number; lng: number }[],
  rotation: number,
  tilt: number,
  radius: number,
  centre: { x: number; y: number },
): void {
  ctx.beginPath();
  let drawing = false;

  for (const coordinate of path) {
    const point = projectGlobe(coordinate, rotation, tilt, radius, centre);

    if (!point.visible) {
      drawing = false;
      continue;
    }
    if (!drawing) {
      ctx.moveTo(point.x, point.y);
      drawing = true;
    } else {
      ctx.lineTo(point.x, point.y);
    }
  }

  ctx.stroke();
}

function sample(
  from: number,
  to: number,
  step: number,
  build: (value: number) => { lat: number; lng: number },
): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  for (let value = from; value <= to; value += step) points.push(build(value));
  return points;
}
