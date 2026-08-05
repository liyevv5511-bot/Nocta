import { describe, expect, it } from 'vitest';

import { ActivityBlockSchema, PlanEventSchema, PlanRequestSchema } from './itinerary';

const validBlock = {
  id: 'd1-b0-castelo',
  kind: 'landmark',
  title: 'Castelo de São Jorge',
  summary: 'Moorish walls over the whole city.',
  startTime: '09:00',
  durationMinutes: 90,
  place: {
    name: 'Castelo de São Jorge',
    address: 'R. de Santa Cruz do Castelo, Lisboa',
    coordinates: { lat: 38.7139, lng: -9.1335 },
    walkFromPrevious: null,
  },
  price: 15,
  tags: ['castle', 'views'],
  imageUrl: 'https://picsum.photos/seed/castelo/800/600',
  note: null,
};

describe('ActivityBlockSchema', () => {
  it('accepts a well-formed block', () => {
    expect(ActivityBlockSchema.safeParse(validBlock).success).toBe(true);
  });

  it.each([
    ['9:00', 'single-digit hour'],
    ['24:00', 'hour out of range'],
    ['09:60', 'minute out of range'],
    ['0900', 'missing separator'],
    ['morning', 'not a time at all'],
  ])('rejects startTime %s (%s)', (startTime) => {
    expect(ActivityBlockSchema.safeParse({ ...validBlock, startTime }).success).toBe(false);
  });

  it('accepts 00:00 and 23:59 as boundaries', () => {
    for (const startTime of ['00:00', '23:59']) {
      expect(ActivityBlockSchema.safeParse({ ...validBlock, startTime }).success).toBe(true);
    }
  });

  it('rejects coordinates outside the globe', () => {
    const result = ActivityBlockSchema.safeParse({
      ...validBlock,
      place: { ...validBlock.place, coordinates: { lat: 91, lng: 0 } },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-URL image, which would render as a broken card', () => {
    expect(ActivityBlockSchema.safeParse({ ...validBlock, imageUrl: 'photo.jpg' }).success).toBe(
      false,
    );
  });

  it('requires note to be explicitly null rather than absent', () => {
    const { note: _note, ...withoutNote } = validBlock;
    expect(ActivityBlockSchema.safeParse(withoutNote).success).toBe(false);
  });

  it('caps tags at six', () => {
    const tags = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    expect(ActivityBlockSchema.safeParse({ ...validBlock, tags }).success).toBe(false);
  });
});

describe('PlanRequestSchema', () => {
  const valid = {
    destination: 'Lisbon',
    days: 3,
    moods: ['food', 'culture'],
    budgetPerDay: 120,
    pace: 'balanced',
  };

  it('accepts a well-formed request', () => {
    expect(PlanRequestSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a zero-day trip', () => {
    expect(PlanRequestSchema.safeParse({ ...valid, days: 0 }).success).toBe(false);
  });

  it('rejects an empty mood set — scoring would be arbitrary', () => {
    expect(PlanRequestSchema.safeParse({ ...valid, moods: [] }).success).toBe(false);
  });

  it('rejects an unknown mood', () => {
    expect(PlanRequestSchema.safeParse({ ...valid, moods: ['shopping'] }).success).toBe(false);
  });

  it('rejects a fractional day count', () => {
    expect(PlanRequestSchema.safeParse({ ...valid, days: 2.5 }).success).toBe(false);
  });
});

describe('PlanEventSchema', () => {
  it('discriminates on type', () => {
    const status = PlanEventSchema.safeParse({
      type: 'status',
      message: 'Reading 14 venues in Lisbon…',
      progress: 0.2,
    });

    expect(status.success).toBe(true);
    if (status.success) expect(status.data.type).toBe('status');
  });

  it('rejects progress outside 0…1', () => {
    expect(PlanEventSchema.safeParse({ type: 'status', message: 'x', progress: 1.4 }).success).toBe(
      false,
    );
  });

  it('rejects an unknown event type rather than passing it through', () => {
    expect(PlanEventSchema.safeParse({ type: 'thinking', message: 'x' }).success).toBe(false);
  });

  it('rejects an error frame with an unrecognised code', () => {
    expect(PlanEventSchema.safeParse({ type: 'error', code: 'teapot', message: 'x' }).success).toBe(
      false,
    );
  });

  it('requires a non-empty highlights list on done', () => {
    expect(
      PlanEventSchema.safeParse({
        type: 'done',
        highlights: [],
        generatedAt: '2026-01-01T00:00:00.000Z',
      }).success,
    ).toBe(false);
  });
});
