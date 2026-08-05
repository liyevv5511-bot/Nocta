import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';

/**
 * Custom cursor with magnetic snap.
 *
 * Three rules keep this from being the gimmick it usually is:
 *
 *  1. **It never replaces the system cursor.** The native cursor stays visible
 *     underneath. Hiding it is what makes custom cursors feel broken the
 *     moment the effect lags a frame, and it destroys the affordances the OS
 *     provides for free (text I-beam, resize handles, drag states).
 *  2. **Fine pointers only.** Gated on `(pointer: fine) and (hover: hover)`,
 *     so it never mounts on touch — where there is no cursor to augment and
 *     the listeners would just cost battery.
 *  3. **Off under reduced motion.** A spring chasing the pointer is exactly
 *     the kind of continuous movement the setting exists to stop.
 *
 * The magnetism itself: when the pointer is within range of an element marked
 * `data-magnetic`, the ring eases toward that element's centre instead of the
 * raw pointer position, and grows to wrap it. The pull is partial (60%) rather
 * than absolute so the ring still tracks intent rather than snapping and
 * sticking.
 */

const MAGNET_RADIUS = 70;
const MAGNET_PULL = 0.6;

export function MagneticCursor(): React.ReactElement | null {
  const reducedMotion = usePrefersReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [state, setState] = useState<{ width: number; height: number; radius: number }>({
    width: 26,
    height: 26,
    radius: 999,
  });

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 620, damping: 42, mass: 0.55 });
  const springY = useSpring(y, { stiffness: 620, damping: 42, mass: 0.55 });

  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (reducedMotion) return;
    if (!window.matchMedia('(pointer: fine) and (hover: hover)').matches) return;

    setEnabled(true);

    const handleMove = (event: PointerEvent): void => {
      if (frameRef.current !== null) return;

      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;

        const target = nearestMagnet(event.clientX, event.clientY);

        if (target === null) {
          x.set(event.clientX);
          y.set(event.clientY);
          setState((current) =>
            current.width === 26 ? current : { width: 26, height: 26, radius: 999 },
          );
          return;
        }

        const { rect } = target;
        const centreX = rect.left + rect.width / 2;
        const centreY = rect.top + rect.height / 2;

        x.set(event.clientX + (centreX - event.clientX) * MAGNET_PULL);
        y.set(event.clientY + (centreY - event.clientY) * MAGNET_PULL);

        setState({
          width: rect.width + 14,
          height: rect.height + 14,
          radius: Number.parseFloat(getComputedStyle(target.element).borderRadius) || 12,
        });
      });
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handleMove);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [reducedMotion, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 border border-strong mix-blend-difference"
      style={{
        x: springX,
        y: springY,
        zIndex: 'var(--z-cursor)',
        translateX: '-50%',
        translateY: '-50%',
      }}
      animate={{
        width: state.width,
        height: state.height,
        borderRadius: state.radius,
      }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
    />
  );
}

interface MagnetHit {
  element: HTMLElement;
  rect: DOMRect;
}

/** Closest `[data-magnetic]` element whose bounds are within pull range. */
function nearestMagnet(pointerX: number, pointerY: number): MagnetHit | null {
  const candidates = document.querySelectorAll<HTMLElement>('[data-magnetic]');

  let best: MagnetHit | null = null;
  let bestDistance = MAGNET_RADIUS;

  for (const element of candidates) {
    const rect = element.getBoundingClientRect();
    if (rect.width === 0) continue;

    // Distance to the rectangle, not to its centre — otherwise a wide button
    // stops attracting long before the pointer has left it.
    const dx = Math.max(rect.left - pointerX, 0, pointerX - rect.right);
    const dy = Math.max(rect.top - pointerY, 0, pointerY - rect.bottom);
    const distance = Math.hypot(dx, dy);

    if (distance < bestDistance) {
      bestDistance = distance;
      best = { element, rect };
    }
  }

  return best;
}
