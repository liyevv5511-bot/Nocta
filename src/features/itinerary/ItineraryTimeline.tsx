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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
        toast.warning(t('itinerary.lastActivity'), t('itinerary.lastActivityBody'));
        return;
      }
      dropBlock(dayId, blockId);
      toast.success(t('itinerary.removed'), t('itinerary.removedBody'));
    },
    [itinerary.days, dropBlock, t],
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
            onDragStart: ({ active }) => t('itinerary.dragStart', { title: String(active.id) }),
            onDragOver: ({ over }) =>
              over
                ? t('itinerary.dragOver', { title: String(over.id) })
                : t('itinerary.dragOutside'),
            onDragEnd: ({ over }) => (over ? t('itinerary.dragEnd') : t('itinerary.dragOutside')),
            onDragCancel: () => t('itinerary.dragCancel'),
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
