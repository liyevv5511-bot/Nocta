import { cn } from '@/lib/cn';

export interface SkeletonProps {
  className?: string;
  /** Rendered as a rounded bar by default; `circle` for avatars/markers. */
  shape?: 'bar' | 'circle' | 'block';
}

/**
 * Loading placeholder.
 *
 * The shimmer lives in CSS (`.skeleton`) rather than in Framer Motion: there
 * can be forty of these on screen during generation, and forty JS-driven
 * animations is forty too many. `prefers-reduced-motion` stops the sweep and
 * leaves a static tint.
 */
export function Skeleton({ className, shape = 'bar' }: SkeletonProps): React.ReactElement {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'skeleton',
        shape === 'bar' && 'h-4 rounded-pill',
        shape === 'circle' && 'aspect-square rounded-pill',
        shape === 'block' && 'rounded-md',
        className,
      )}
    />
  );
}

/**
 * Skeleton of an activity card, matched to the real card's metrics so the
 * swap costs zero layout shift. If `ActivityCard`'s padding changes, this
 * changes with it — that is the point of keeping them adjacent.
 */
export function ActivityCardSkeleton(): React.ReactElement {
  return (
    <div className="rounded-lg border border-subtle bg-surface p-5">
      <div className="flex items-start gap-4">
        <Skeleton shape="block" className="size-20 shrink-0" />
        <div className="min-w-0 flex-1 space-y-2.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
      </div>
    </div>
  );
}

/** The whole day column, used while a `day` frame is still in flight. */
export function DayColumnSkeleton({ blocks = 4 }: { blocks?: number }): React.ReactElement {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-3.5 w-56" />
      </div>
      {Array.from({ length: blocks }, (_, index) => (
        <ActivityCardSkeleton key={index} />
      ))}
    </div>
  );
}
