import { describe, expect, it } from 'vitest';

import type { ActivityBlock, Itinerary, ItineraryDay } from '@/types/itinerary';

import {
  dayTotals,
  moveBlockBetweenDays,
  removeBlock,
  reorderWithinDay,
  replaceBlock,
  retimeDay,
  toMinutes,
  toTimeString,
  tripTotals,
} from './itinerary.reducer';

/* -------------------------------------------------------------------------
 * Fixtures — Lisbon coordinates, so the walking maths is checkable by hand.
 * ---------------------------------------------------------------------- */

function block(overrides: Partial<ActivityBlock> & { id: string }): ActivityBlock {
  return {
    kind: 'landmark',
    title: `Block ${overrides.id}`,
    summary: 'A place worth an hour.',
    startTime: '09:00',
    durationMinutes: 60,
    place: {
      name: 'Somewhere',
      address: 'Lisbon',
      coordinates: { lat: 38.7223, lng: -9.1393 },
      walkFromPrevious: null,
    },
    price: 10,
    tags: [],
    imageUrl: 'https://example.test/photo.jpg',
    note: null,
    ...overrides,
  };
}

function day(blocks: ActivityBlock[]): ItineraryDay {
  return { id: 'day-1', dayNumber: 1, title: 'Day one', theme: 'A theme.', blocks };
}

function itinerary(days: ItineraryDay[]): Itinerary {
  return {
    id: 'trip_test',
    meta: {
      destination: 'Lisbon',
      countryCode: 'PT',
      currency: 'EUR',
      pace: 'balanced',
      moods: ['food'],
      budgetPerDay: 120,
      coordinates: { lat: 38.7223, lng: -9.1393 },
    },
    summary: 'Test trip.',
    days,
    highlights: ['One highlight'],
    generatedAt: '2026-01-01T00:00:00.000Z',
  };
}

/* ---------------------------------------------------------------------- */

describe('time helpers', () => {
  it('round-trips through minutes', () => {
    expect(toTimeString(toMinutes('14:35'))).toBe('14:35');
  });

  it('pads single-digit hours and minutes', () => {
    expect(toTimeString(9 * 60 + 5)).toBe('09:05');
  });

  it('clamps rather than wrapping past midnight', () => {
    expect(toTimeString(25 * 60)).toBe('23:59');
    expect(toTimeString(-30)).toBe('00:00');
  });
});

describe('retimeDay', () => {
  it('anchors the first block to 09:00 regardless of its previous time', () => {
    const result = retimeDay(day([block({ id: 'a', startTime: '17:20' })]));
    expect(result.blocks[0]?.startTime).toBe('09:00');
  });

  it('clears the walking leg on the first block only', () => {
    const result = retimeDay(
      day([
        block({ id: 'a' }),
        block({
          id: 'b',
          place: {
            name: 'Belém',
            address: 'Lisbon',
            coordinates: { lat: 38.6979, lng: -9.2065 },
            walkFromPrevious: 999,
          },
        }),
      ]),
    );

    expect(result.blocks[0]?.place.walkFromPrevious).toBeNull();
    expect(result.blocks[1]?.place.walkFromPrevious).toBeGreaterThan(0);
  });

  it('accumulates duration, slack and travel into later start times', () => {
    const result = retimeDay(day([block({ id: 'a', durationMinutes: 60 }), block({ id: 'b' })]));

    // 09:00 + 60min + 15min slack + 1min minimum walk at the same coordinates.
    expect(result.blocks[1]?.startTime).toBe('10:16');
  });

  it('models long hops as transit rather than an implausible walk', () => {
    const result = retimeDay(
      day([
        block({ id: 'a' }),
        block({
          id: 'b',
          place: {
            name: 'Cascais',
            address: 'Cascais',
            // ~25 km west of the anchor.
            coordinates: { lat: 38.6979, lng: -9.4215 },
            walkFromPrevious: null,
          },
        }),
      ]),
    );

    const leg = result.blocks[1]?.place.walkFromPrevious ?? 0;
    // At walking pace 25km would be ~5.5 hours; the transit model must be far
    // shorter, while still costing real time.
    expect(leg).toBeGreaterThan(20);
    expect(leg).toBeLessThan(120);
  });
});

describe('reorderWithinDay', () => {
  const base = itinerary([day([block({ id: 'a' }), block({ id: 'b' }), block({ id: 'c' })])]);

  it('moves a block and re-times the day', () => {
    const result = reorderWithinDay(base, 'day-1', 2, 0);
    expect(result.days[0]?.blocks.map((b) => b.id)).toEqual(['c', 'a', 'b']);
    expect(result.days[0]?.blocks[0]?.startTime).toBe('09:00');
  });

  it('leaves the itinerary untouched for an out-of-range index', () => {
    expect(reorderWithinDay(base, 'day-1', 9, 0).days[0]?.blocks.map((b) => b.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('ignores an unknown day', () => {
    expect(reorderWithinDay(base, 'day-99', 0, 1)).toEqual(base);
  });

  it('does not mutate the input', () => {
    const before = JSON.stringify(base);
    reorderWithinDay(base, 'day-1', 0, 2);
    expect(JSON.stringify(base)).toBe(before);
  });
});

describe('moveBlockBetweenDays', () => {
  const two = itinerary([
    { ...day([block({ id: 'a' }), block({ id: 'b' })]), id: 'day-1' },
    { ...day([block({ id: 'c' })]), id: 'day-2', dayNumber: 2 },
  ]);

  it('moves a block and re-times both days', () => {
    const result = moveBlockBetweenDays(two, 'day-1', 'day-2', 'b', 0);
    expect(result.days[0]?.blocks.map((b) => b.id)).toEqual(['a']);
    expect(result.days[1]?.blocks.map((b) => b.id)).toEqual(['b', 'c']);
  });

  it('refuses to empty the source day', () => {
    const result = moveBlockBetweenDays(two, 'day-2', 'day-1', 'c', 0);
    expect(result).toEqual(two);
  });

  it('is a no-op when source and target are the same day', () => {
    expect(moveBlockBetweenDays(two, 'day-1', 'day-1', 'a', 1)).toEqual(two);
  });
});

describe('replaceBlock', () => {
  it('keeps the original id so React and drag state survive the swap', () => {
    const base = itinerary([day([block({ id: 'a' }), block({ id: 'b' })])]);
    const result = replaceBlock(base, 'day-1', 'a', block({ id: 'zzz', title: 'Replacement' }));

    expect(result.days[0]?.blocks[0]?.id).toBe('a');
    expect(result.days[0]?.blocks[0]?.title).toBe('Replacement');
  });

  it('re-times around a longer replacement', () => {
    const base = itinerary([day([block({ id: 'a', durationMinutes: 30 }), block({ id: 'b' })])]);
    const result = replaceBlock(base, 'day-1', 'a', block({ id: 'x', durationMinutes: 180 }));

    expect(result.days[0]?.blocks[1]?.startTime).toBe('12:16');
  });
});

describe('removeBlock', () => {
  it('removes and re-times', () => {
    const base = itinerary([day([block({ id: 'a' }), block({ id: 'b' })])]);
    const result = removeBlock(base, 'day-1', 'a');
    expect(result.days[0]?.blocks.map((b) => b.id)).toEqual(['b']);
    expect(result.days[0]?.blocks[0]?.startTime).toBe('09:00');
  });

  it('refuses to remove the last block in a day', () => {
    const base = itinerary([day([block({ id: 'only' })])]);
    expect(removeBlock(base, 'day-1', 'only')).toEqual(base);
  });
});

describe('totals', () => {
  it('sums cost, active time and walking for a day', () => {
    const result = retimeDay(
      day([
        block({ id: 'a', price: 12, durationMinutes: 90 }),
        block({ id: 'b', price: 0, durationMinutes: 45 }),
      ]),
    );
    const totals = dayTotals(result);

    expect(totals.cost).toBe(12);
    expect(totals.activeMinutes).toBe(135);
    expect(totals.walkMinutes).toBeGreaterThan(0);
    expect(totals.endTime).toBe('11:31');
  });

  it('reports an em dash for a day with no blocks', () => {
    expect(dayTotals(day([])).endTime).toBe('—');
  });

  it('aggregates across days and counts free activities', () => {
    const totals = tripTotals(
      itinerary([
        { ...day([block({ id: 'a', price: 20 }), block({ id: 'b', price: 0 })]), id: 'day-1' },
        { ...day([block({ id: 'c', price: 0 })]), id: 'day-2', dayNumber: 2 },
      ]),
    );

    expect(totals.blocks).toBe(3);
    expect(totals.cost).toBe(20);
    expect(totals.freeBlocks).toBe(2);
  });
});
