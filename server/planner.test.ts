import { describe, expect, it } from 'vitest';

import { ItineraryDaySchema, type PlanRequest } from '../src/types/itinerary';

import {
  buildHighlights,
  buildMeta,
  buildSummary,
  composeDay,
  createPlannerState,
  createRng,
  distanceMetres,
} from './planner';

const REQUEST: PlanRequest = {
  destination: 'Lisbon',
  days: 3,
  moods: ['food', 'culture'],
  budgetPerDay: 120,
  pace: 'balanced',
};

function plan(overrides: Partial<PlanRequest> = {}) {
  const request = { ...REQUEST, ...overrides };
  const state = createPlannerState(request);
  if (!state) throw new Error('planner state could not be created');

  const days = Array.from({ length: request.days }, (_, index) => composeDay(state, index + 1));
  return { request, state, days };
}

describe('distanceMetres', () => {
  it('is zero for identical points', () => {
    const point = { lat: 38.7223, lng: -9.1393 };
    expect(distanceMetres(point, point)).toBe(0);
  });

  it('matches the known Lisbon–Porto distance to within a percent', () => {
    const metres = distanceMetres({ lat: 38.7223, lng: -9.1393 }, { lat: 41.1579, lng: -8.6291 });
    // Great-circle distance is ~274 km.
    expect(metres).toBeGreaterThan(270_000);
    expect(metres).toBeLessThan(278_000);
  });

  it('is symmetric', () => {
    const a = { lat: 35.6762, lng: 139.6503 };
    const b = { lat: 64.1466, lng: -21.9426 };
    expect(distanceMetres(a, b)).toBeCloseTo(distanceMetres(b, a), 6);
  });
});

describe('createRng', () => {
  it('is deterministic for a given seed', () => {
    const a = createRng('lisbon:3');
    const b = createRng('lisbon:3');
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('diverges for different seeds', () => {
    expect(createRng('lisbon:3')()).not.toBe(createRng('lisbon:4')());
  });

  it('stays within [0, 1)', () => {
    const rng = createRng('bounds');
    for (let i = 0; i < 500; i += 1) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('createPlannerState', () => {
  it('resolves a city by name, case-insensitively', () => {
    expect(createPlannerState({ ...REQUEST, destination: 'lisbon' })).not.toBeNull();
  });

  it('resolves a city by id', () => {
    expect(createPlannerState({ ...REQUEST, destination: 'mexico-city' })).not.toBeNull();
  });

  it('returns null for a city with no catalogue, rather than inventing one', () => {
    expect(createPlannerState({ ...REQUEST, destination: 'Atlantis' })).toBeNull();
  });
});

describe('composeDay', () => {
  it('produces days that satisfy the shared schema', () => {
    for (const day of plan().days) {
      const result = ItineraryDaySchema.safeParse(day);
      expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
    }
  });

  it.each([
    ['relaxed', 4],
    ['balanced', 5],
    ['intense', 6],
  ] as const)('honours the %s pace with %i blocks a day', (pace, expected) => {
    const { days } = plan({ pace, days: 1 });
    expect(days[0]?.blocks).toHaveLength(expected);
  });

  it('never repeats a venue while the catalogue can still cover the trip', () => {
    const titles = plan({ days: 3, pace: 'balanced' }).days.flatMap((day) =>
      day.blocks.map((block) => block.title),
    );
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('fills the longest supported trip without producing a thin day', () => {
    const { days } = plan({ days: 7, pace: 'intense' });

    expect(days).toHaveLength(7);
    for (const day of days) {
      // Day trips are legitimately shorter; nothing may be empty or near-empty.
      expect(day.blocks.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('labels a recycled venue as a deliberate return visit', () => {
    const blocks = plan({ days: 7, pace: 'intense' }).days.flatMap((day) => day.blocks);
    const seen = new Map<string, number>();

    for (const block of blocks) {
      seen.set(block.title, (seen.get(block.title) ?? 0) + 1);
    }

    for (const [title, count] of seen) {
      if (count === 1) continue;
      const repeats = blocks.filter((block) => block.title === title).slice(1);
      for (const repeat of repeats) {
        expect(repeat.note).not.toBeNull();
      }
    }
  });

  it('keeps every block id unique, even across recycled passes', () => {
    const ids = plan({ days: 7, pace: 'intense' }).days.flatMap((day) =>
      day.blocks.map((block) => block.id),
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('never bills a day-trip journey twice as a walking leg', () => {
    for (const day of plan({ destination: 'Tokyo', days: 4 }).days) {
      day.blocks.forEach((block, index) => {
        if (day.blocks[index - 1]?.kind !== 'transit') return;
        // The train ride is already the previous block's duration.
        expect(block.place.walkFromPrevious).toBeLessThanOrEqual(20);
      });
    }
  });

  it('starts every day at 09:00', () => {
    for (const day of plan().days) {
      expect(day.blocks[0]?.startTime).toBe('09:00');
    }
  });

  it('lays start times out in ascending order', () => {
    for (const day of plan().days) {
      const times = day.blocks.map((block) => block.startTime);
      expect([...times].sort()).toEqual(times);
    }
  });

  it('leaves the first block of a day with no walking leg', () => {
    for (const day of plan().days) {
      expect(day.blocks[0]?.place.walkFromPrevious).toBeNull();
    }
  });

  it('gives every subsequent block a positive walking leg', () => {
    for (const day of plan().days) {
      for (const block of day.blocks.slice(1)) {
        expect(block.place.walkFromPrevious).toBeGreaterThan(0);
      }
    }
  });

  it('weights selection toward the requested moods', () => {
    const foodBlocks = plan({ moods: ['food'], days: 1, pace: 'intense' }).days[0]?.blocks ?? [];
    const edible = foodBlocks.filter((block) => block.kind === 'food' || block.kind === 'cafe');
    expect(edible.length).toBeGreaterThanOrEqual(2);
  });

  it('is deterministic — the same request produces the same plan', () => {
    const first = plan({ days: 3 }).days;
    const second = plan({ days: 3 }).days;
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });

  it('produces a different plan for a different mood set', () => {
    const food = JSON.stringify(plan({ moods: ['food'], days: 2 }).days);
    const nature = JSON.stringify(plan({ moods: ['nature'], days: 2 }).days);
    expect(food).not.toBe(nature);
  });

  it('keeps evening blocks in the evening', () => {
    for (const day of plan({ moods: ['nightlife', 'food'], days: 2 }).days) {
      const nightlife = day.blocks.filter((block) => block.kind === 'nightlife');
      for (const block of nightlife) {
        expect(Number(block.startTime.slice(0, 2))).toBeGreaterThanOrEqual(19);
      }
    }
  });

  it('respects the budget by preferring affordable venues', () => {
    const cheap = plan({ budgetPerDay: 40, days: 1 }).days[0];
    const rich = plan({ budgetPerDay: 400, days: 1 }).days[0];

    const cost = (day: typeof cheap): number =>
      (day?.blocks ?? []).reduce((sum, block) => sum + block.price, 0);

    expect(cost(cheap)).toBeLessThan(cost(rich));
  });
});

describe('trip-level output', () => {
  it('builds meta that mirrors the request', () => {
    const state = createPlannerState(REQUEST);
    if (!state) throw new Error('unreachable');

    const meta = buildMeta(state.city, REQUEST);
    expect(meta).toMatchObject({
      destination: 'Lisbon',
      countryCode: 'PT',
      currency: 'EUR',
      pace: 'balanced',
      budgetPerDay: 120,
    });
  });

  it('writes a summary that names the destination and the budget', () => {
    const state = createPlannerState(REQUEST);
    if (!state) throw new Error('unreachable');

    const summary = buildSummary(state.city, REQUEST);
    expect(summary).toContain('Lisbon');
    expect(summary).toContain('120');
  });

  it('derives highlights from the actual blocks', () => {
    const { state, days } = plan();
    const highlights = buildHighlights(days, state.city);

    expect(highlights.length).toBeGreaterThan(0);
    expect(highlights.length).toBeLessThanOrEqual(6);
    expect(highlights[0]).toContain(String(days.flatMap((day) => day.blocks).length));
  });
});

describe('every city in the catalogue is plannable', () => {
  it.each([
    'Lisbon',
    'Porto',
    'Tokyo',
    'Kyoto',
    'Reykjavík',
    'Marrakesh',
    'Copenhagen',
    'Mexico City',
  ])('%s produces four valid days', (destination) => {
    const { days } = plan({ destination, days: 4 });

    expect(days).toHaveLength(4);
    for (const day of days) {
      expect(ItineraryDaySchema.safeParse(day).success).toBe(true);
    }
  });
});
