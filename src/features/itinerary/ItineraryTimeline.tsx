import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCallback, useState } from 'react';

import { DayColumnSkeleton, toast } from '@/features/ui';
import type { ActivityKind, Itinerary } from '@/types/itinerary';

import { DayColumn } from './DayColumn';
import { SwapDialog } from './SwapDialog';
import { usePlanStore } from './plan.store';

export interface ItineraryTimelineProps {
  itinerary: Itinerary;
  /** How many days the server said to expect — drives skeleton count. */
  expectedDays: number;
  streaming: boolean;
}

interface SwapTarget {
  dayId: string;
  blockId: string;
  kind: ActivityKind;
}

/**
 * The itinerary.
 *
 * Drag-and-drop is scoped to reordering *within* a day, deliberately.
 * Cross-day moves exist in the reducer and are exposed through the store, but
 * dragging a card between two long, independently scrolling columns is a
 * gesture that fails more often than it succeeds — the day picker in the
 * swap dialog is the reliable path for that.
 *
 * Both sensors are wired: pointer with an activation distance (so a click on
 * the handle is not swallowed as a micro-drag) and keyboard, so reordering is
 * fully operable without a mouse.
 */
export function ItineraryTimeline({
  itinerary,
  expectedDays,
  streaming,
}: ItineraryTimelineProps): React.ReactElement {
  const reorder = usePlanStore((state) => state.reorder);
  const dropBlock = usePlanStore((state) => state.dropBlock);
  const [swapTarget, setSwapTarget] = useState<SwapTarget | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const dayId = (active.data.current as { dayId?: string } | undefined)?.dayId;
      if (dayId === undefined) return;

      const day = itinerary.days.find((candidate) => candidate.id === dayId);
      if (!day) return;

      const fromIndex = day.blocks.findIndex((block) => block.id === active.id);
      const toIndex = day.blocks.findIndex((block) => block.id === over.id);
      if (fromIndex === -1 || toIndex === -1) return;

      reorder(dayId, fromIndex, toIndex);
    },
    [itinerary.days, reorder],
  );

  const handleRemove = useCallback(
    (dayId: string, blockId: string) => {
      const day = itinerary.days.find((candidate) => candidate.id === dayId);
      if (day && day.blocks.length <= 1) {
        toast.warning('That is the last activity', 'A day cannot be left empty — swap it instead.');
        return;
      }
      dropBlock(dayId, blockId);
      toast.success('Removed', 'The rest of the day has been re-timed around it.');
    },
    [itinerary.days, dropBlock],
  );

  const pendingDays = Math.max(0, expectedDays - itinerary.days.length);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
        accessibility={{
          announcements: {
            onDragStart: ({ active }) => `Picked up ${String(active.id)}.`,
            onDragOver: ({ over }) =>
              over ? `Now over position of ${String(over.id)}.` : 'No longer over a drop target.',
            onDragEnd: ({ over }) =>
              over
                ? 'Dropped. The day has been re-timed around the new order.'
                : 'Dropped outside the list. Nothing changed.',
            onDragCancel: () => 'Reorder cancelled.',
          },
        }}
      >
        <div className="space-y-16">
          {itinerary.days.map((day) => (
            <DayColumn
              key={day.id}
              day={day}
              currency={itinerary.meta.currency}
              sortable={!streaming}
              onSwap={(dayId, blockId, kind) => {
                setSwapTarget({ dayId, blockId, kind });
              }}
              onRemove={handleRemove}
            />
          ))}

          {Array.from({ length: pendingDays }, (_, index) => (
            <DayColumnSkeleton key={`pending-${String(index)}`} />
          ))}
        </div>
      </DndContext>

      {swapTarget === null ? null : (
        <SwapDialog
          dayId={swapTarget.dayId}
          blockId={swapTarget.blockId}
          kind={swapTarget.kind}
          currency={itinerary.meta.currency}
          onClose={() => {
            setSwapTarget(null);
          }}
        />
      )}
    </>
  );
}
