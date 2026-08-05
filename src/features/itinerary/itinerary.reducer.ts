import type { ActivityBlock, Itinerary, ItineraryDay } from '@/types/itinerary';

/**
 * Pure itinerary transforms.
 *
 * Kept out of the store deliberately: these are the rules of the product (what
 * happens to the clock when you drag block 4 above block 1) and they are worth
 * testing directly, without mounting a component or a store. The store calls
 * them; it does not contain them.
 *
 * Every function returns a new object and mutates nothing.
 */

/** Slack between two consecutive blocks, in minutes. Matches the planner. */
const SLACK_MINUTES = 15;
const DAY_START_MINUTES = 9 * 60;

export function toMinutes(time: string): number {
  const [h, m] = time.split(':');
  return Number(h ?? 0) * 60 + Number(m ?? 0);
}

export function toTimeString(minutes: number): string {
  const clamped = Math.min(23 * 60 + 59, Math.max(0, Math.round(minutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Recomputes start times and walking legs after any structural change.
 *
 * This is the function that makes drag-and-drop feel like a planner rather
 * than a list: move an activity and the whole day re-times around it, walking
 * distances included. The first block always anchors to 09:00 — reordering
 * should not silently shift the day earlier or later.
 */
export function retimeDay(day: ItineraryDay): ItineraryDay {
  let clock = DAY_START_MINUTES;
  let previous: ActivityBlock | null = null;

  const blocks = day.blocks.map((block) => {
    const walk = previous === null ? null : walkMinutes(previous, block);
    clock += walk ?? 0;

    const retimed: ActivityBlock = {
      ...block,
      startTime: toTimeString(clock),
      place: { ...block.place, walkFromPrevious: walk },
    };

    clock += block.durationMinutes + SLACK_MINUTES;
    previous = block;
    return retimed;
  });

  return { ...day, blocks };
}

/** Haversine, then a walking pace. Duplicated from the planner by intent —
 *  the client must be able to re-time a day with the server offline. */
function walkMinutes(from: ActivityBlock, to: ActivityBlock): number {
  const R = 6_371_000;
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const a = from.place.coordinates;
  const b = to.place.coordinates;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat));
  const metres = 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));

  if (metres > 2_500) return Math.round(metres / 400);
  return Math.max(1, Math.round(metres / 75));
}

/* -------------------------------------------------------------------------
 * Structural operations
 * ---------------------------------------------------------------------- */

export function reorderWithinDay(
  itinerary: Itinerary,
  dayId: string,
  fromIndex: number,
  toIndex: number,
): Itinerary {
  const days = itinerary.days.map((day) => {
    if (day.id !== dayId) return day;

    const blocks = [...day.blocks];
    if (fromIndex < 0 || fromIndex >= blocks.length) return day;

    const [moved] = blocks.splice(fromIndex, 1);
    if (!moved) return day;

    blocks.splice(Math.max(0, Math.min(blocks.length, toIndex)), 0, moved);
    return retimeDay({ ...day, blocks });
  });

  return { ...itinerary, days };
}

export function moveBlockBetweenDays(
  itinerary: Itinerary,
  fromDayId: string,
  toDayId: string,
  blockId: string,
  toIndex: number,
): Itinerary {
  if (fromDayId === toDayId) return itinerary;

  const source = itinerary.days.find((day) => day.id === fromDayId);
  const block = source?.blocks.find((b) => b.id === blockId);
  if (!source || !block) return itinerary;

  // A day is not allowed to become empty — an empty column is a broken plan,
  // not a valid state, and there is no UI affordance to refill one.
  if (source.blocks.length <= 1) return itinerary;

  const days = itinerary.days.map((day) => {
    if (day.id === fromDayId) {
      return retimeDay({ ...day, blocks: day.blocks.filter((b) => b.id !== blockId) });
    }
    if (day.id === toDayId) {
      const blocks = [...day.blocks];
      blocks.splice(Math.max(0, Math.min(blocks.length, toIndex)), 0, block);
      return retimeDay({ ...day, blocks });
    }
    return day;
  });

  return { ...itinerary, days };
}

export function replaceBlock(
  itinerary: Itinerary,
  dayId: string,
  blockId: string,
  replacement: ActivityBlock,
): Itinerary {
  const days = itinerary.days.map((day) => {
    if (day.id !== dayId) return day;

    const blocks = day.blocks.map((block) =>
      block.id === blockId
        ? // Keep the original id so React reconciliation, drag state and any
          // pending animation on this row survive the swap.
          { ...replacement, id: block.id }
        : block,
    );

    return retimeDay({ ...day, blocks });
  });

  return { ...itinerary, days };
}

export function removeBlock(itinerary: Itinerary, dayId: string, blockId: string): Itinerary {
  const days = itinerary.days.map((day) => {
    if (day.id !== dayId) return day;
    if (day.blocks.length <= 1) return day;
    return retimeDay({ ...day, blocks: day.blocks.filter((block) => block.id !== blockId) });
  });

  return { ...itinerary, days };
}

/* -------------------------------------------------------------------------
 * Derived figures
 * ---------------------------------------------------------------------- */

export interface DayTotals {
  cost: number;
  activeMinutes: number;
  walkMinutes: number;
  endTime: string;
}

export function dayTotals(day: ItineraryDay): DayTotals {
  const cost = day.blocks.reduce((sum, block) => sum + block.price, 0);
  const activeMinutes = day.blocks.reduce((sum, block) => sum + block.durationMinutes, 0);
  const walk = day.blocks.reduce((sum, block) => sum + (block.place.walkFromPrevious ?? 0), 0);

  const last = day.blocks.at(-1);
  const endTime = last ? toTimeString(toMinutes(last.startTime) + last.durationMinutes) : '—';

  return { cost, activeMinutes, walkMinutes: walk, endTime };
}

export function tripTotals(itinerary: Itinerary): {
  cost: number;
  blocks: number;
  walkMinutes: number;
  freeBlocks: number;
} {
  const all = itinerary.days.flatMap((day) => day.blocks);
  return {
    cost: all.reduce((sum, block) => sum + block.price, 0),
    blocks: all.length,
    walkMinutes: all.reduce((sum, block) => sum + (block.place.walkFromPrevious ?? 0), 0),
    freeBlocks: all.filter((block) => block.price === 0).length,
  };
}
