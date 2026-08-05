import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import { useCallback, type ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { SPRING } from '@/lib/motion';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';

export interface CardProps {
  children: ReactNode;
  className?: string;
  /** Adds the pointer-tracked 3D tilt. Desktop pointers only. */
  interactive?: boolean;
  /** Maximum rotation in degrees at the card's corners. */
  tiltStrength?: number;
  onClick?: () => void;
  as?: 'div' | 'article' | 'li';
}

const PERSPECTIVE = 900;

/**
 * Surface card with an optional pointer-tracked tilt.
 *
 * The tilt is deliberately restrained — three degrees, spring-damped, with a
 * light sheen that tracks the cursor. Anything stronger reads as a gimmick at
 * the second interaction. It is disabled entirely for coarse pointers (there
 * is no hover on touch, so the effect would only ever fire on tap) and under
 * `prefers-reduced-motion`, where the card becomes a plain surface.
 */
export function Card({
  children,
  className,
  interactive = false,
  tiltStrength = 3,
  onClick,
  as = 'div',
}: CardProps): React.ReactElement {
  const reducedMotion = usePrefersReducedMotion();
  const enabled = interactive && !reducedMotion;

  const rotateX = useSpring(useMotionValue(0), SPRING);
  const rotateY = useSpring(useMotionValue(0), SPRING);
  const sheenX = useMotionValue(50);
  const sheenY = useMotionValue(50);

  const sheen = useMotionTemplate`radial-gradient(38% 38% at ${sheenX}% ${sheenY}%, oklch(100% 0 0 / 0.1), transparent 70%)`;

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!enabled || event.pointerType !== 'mouse') return;

      const bounds = event.currentTarget.getBoundingClientRect();
      const px = (event.clientX - bounds.left) / bounds.width;
      const py = (event.clientY - bounds.top) / bounds.height;

      rotateY.set((px - 0.5) * 2 * tiltStrength);
      rotateX.set((0.5 - py) * 2 * tiltStrength);
      sheenX.set(px * 100);
      sheenY.set(py * 100);
    },
    [enabled, rotateX, rotateY, sheenX, sheenY, tiltStrength],
  );

  const handlePointerLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

  const MotionTag = motion[as];
  const isButton = typeof onClick === 'function';

  return (
    <MotionTag
      className={cn(
        'group relative isolate overflow-hidden rounded-lg',
        'border border-subtle bg-surface',
        'transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out-expo)]',
        'hover:border-default hover:shadow-lg',
        isButton && 'cursor-pointer text-left',
        className,
      )}
      style={enabled ? { rotateX, rotateY, transformPerspective: PERSPECTIVE } : undefined}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...(isButton
        ? {
            onClick,
            role: 'button',
            tabIndex: 0,
            onKeyDown: (event: React.KeyboardEvent) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick();
              }
            },
          }
        : {})}
    >
      {children}

      {enabled ? (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-[var(--duration-base)] group-hover:opacity-100"
          style={{ backgroundImage: sheen }}
        />
      ) : null}
    </MotionTag>
  );
}

export function CardBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): React.ReactElement {
  return <div className={cn('p-5', className)}>{children}</div>;
}

export function CardMedia({
  children,
  className,
  ratio = '4/3',
}: {
  children: ReactNode;
  className?: string;
  /** Reserved via `aspect-ratio` so images never shift the layout in. */
  ratio?: string;
}): React.ReactElement {
  return (
    <div
      className={cn('relative overflow-hidden bg-surface-sunken', className)}
      style={{ aspectRatio: ratio }}
    >
      {children}
    </div>
  );
}
