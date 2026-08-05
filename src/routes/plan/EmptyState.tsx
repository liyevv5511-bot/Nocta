import { GlassPanel } from '@/features/ui';

/**
 * Shown before anything has been generated.
 *
 * Deliberately not a blank panel with an arrow: it states what the planner
 * will actually produce, so the empty state sells the feature rather than
 * apologising for the absence of one.
 */
export function EmptyState(): React.ReactElement {
  return (
    <GlassPanel radius="xl" className="p-10 text-center">
      <p className="text-h2 text-primary">Nothing planned yet</p>
      <p className="mx-auto mt-4 max-w-prose text-body-lg text-secondary">
        Choose a destination on the left and the planner will build a schedule — hour by hour, with
        the walking time between every stop worked out.
      </p>
      <p className="mt-6 text-sm text-tertiary">
        Eight cities available. Nothing is charged, ever.
      </p>
    </GlassPanel>
  );
}
