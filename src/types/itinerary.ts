import { z } from 'zod';

/**
 * The itinerary contract.
 *
 * This module is the single source of truth for the shape of a generated plan.
 * The mock-AI server imports it to *build* responses; the client imports it to
 * *parse* them. When the mock is swapped for a real LLM, this schema becomes
 * the structured-output schema handed to the model — which is exactly why it
 * lives in `src/types` and not inside the server.
 */

export const ACTIVITY_KINDS = [
  'landmark',
  'museum',
  'food',
  'cafe',
  'nightlife',
  'nature',
  'shopping',
  'transit',
  'stay',
  'experience',
] as const;

export const ActivityKindSchema = z.enum(ACTIVITY_KINDS);
export type ActivityKind = z.infer<typeof ActivityKindSchema>;

export const MOODS = ['relax', 'adventure', 'food', 'culture', 'nightlife', 'nature'] as const;
export const MoodSchema = z.enum(MOODS);
export type Mood = z.infer<typeof MoodSchema>;

export const PACES = ['relaxed', 'balanced', 'intense'] as const;
export const PaceSchema = z.enum(PACES);
export type Pace = z.infer<typeof PaceSchema>;

export const CoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type Coordinates = z.infer<typeof CoordinatesSchema>;

export const PlaceSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  coordinates: CoordinatesSchema,
  /** Walking minutes from the previous block. `null` for the first block. */
  walkFromPrevious: z.number().int().min(0).max(240).nullable(),
});
export type Place = z.infer<typeof PlaceSchema>;

/** `HH:MM`, 24-hour. Enforced rather than trusted — times drive the timeline. */
const TimeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected a 24-hour HH:MM time');

export const ActivityBlockSchema = z.object({
  id: z.string().min(1),
  kind: ActivityKindSchema,
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(400),
  startTime: TimeOfDaySchema,
  durationMinutes: z.number().int().min(15).max(720),
  place: PlaceSchema,
  /** Per-person cost in the plan's currency. `0` means free. */
  price: z.number().min(0).max(100_000),
  tags: z.array(z.string().min(1)).max(6),
  imageUrl: z.string().url(),
  /** Set when the model wants to flag something time-sensitive. */
  note: z.string().max(240).nullable(),
});
export type ActivityBlock = z.infer<typeof ActivityBlockSchema>;

export const ItineraryDaySchema = z.object({
  id: z.string().min(1),
  dayNumber: z.number().int().min(1).max(30),
  title: z.string().min(1).max(80),
  /** One-line thesis for the day — what makes it cohere. */
  theme: z.string().min(1).max(160),
  blocks: z.array(ActivityBlockSchema).min(1).max(12),
});
export type ItineraryDay = z.infer<typeof ItineraryDaySchema>;

export const ItineraryMetaSchema = z.object({
  destination: z.string().min(1),
  countryCode: z.string().length(2),
  currency: z.string().length(3),
  pace: PaceSchema,
  moods: z.array(MoodSchema).min(1),
  budgetPerDay: z.number().int().min(0),
  coordinates: CoordinatesSchema,
});
export type ItineraryMeta = z.infer<typeof ItineraryMetaSchema>;

export const ItinerarySchema = z.object({
  id: z.string().min(1),
  meta: ItineraryMetaSchema,
  summary: z.string().min(1).max(600),
  days: z.array(ItineraryDaySchema).min(1).max(30),
  /** Model-authored, shown under the plan. Never empty. */
  highlights: z.array(z.string().min(1)).min(1).max(6),
  generatedAt: z.string().datetime(),
});
export type Itinerary = z.infer<typeof ItinerarySchema>;

/* -------------------------------------------------------------------------
 * Request
 * ---------------------------------------------------------------------- */

export const PlanRequestSchema = z.object({
  destination: z.string().min(2).max(80),
  days: z.number().int().min(1).max(14),
  moods: z.array(MoodSchema).min(1).max(4),
  budgetPerDay: z.number().int().min(20).max(1500),
  pace: PaceSchema,
});
export type PlanRequest = z.infer<typeof PlanRequestSchema>;

/* -------------------------------------------------------------------------
 * Streaming envelope
 *
 * The server emits a discriminated union over SSE. Every frame is validated
 * client-side before it reaches state — a malformed frame degrades to an
 * error toast rather than a half-rendered plan.
 * ---------------------------------------------------------------------- */

export const PlanEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('status'),
    /** Human-readable progress line, e.g. "Scanning 240 venues in Lisbon…" */
    message: z.string().min(1),
    /** 0…1, monotonic. Drives the progress ring. */
    progress: z.number().min(0).max(1),
  }),
  z.object({
    type: z.literal('meta'),
    meta: ItineraryMetaSchema,
    summary: z.string().min(1),
    id: z.string().min(1),
    totalDays: z.number().int().min(1),
  }),
  z.object({
    type: z.literal('day'),
    day: ItineraryDaySchema,
  }),
  z.object({
    type: z.literal('done'),
    highlights: z.array(z.string()).min(1),
    generatedAt: z.string().datetime(),
  }),
  z.object({
    type: z.literal('error'),
    code: z.enum(['unknown_destination', 'rate_limited', 'internal']),
    message: z.string().min(1),
  }),
]);
export type PlanEvent = z.infer<typeof PlanEventSchema>;

/** Narrowed helpers so consumers never re-declare the union members. */
export type PlanStatusEvent = Extract<PlanEvent, { type: 'status' }>;
export type PlanErrorEvent = Extract<PlanEvent, { type: 'error' }>;

/* -------------------------------------------------------------------------
 * Alternatives ("swap this")
 * ---------------------------------------------------------------------- */

export const AlternativesRequestSchema = z.object({
  destination: z.string().min(2),
  blockId: z.string().min(1),
  kind: ActivityKindSchema,
  budgetPerDay: z.number().int().min(0),
});

export const AlternativesResponseSchema = z.object({
  alternatives: z.array(ActivityBlockSchema).min(1).max(4),
});
export type AlternativesResponse = z.infer<typeof AlternativesResponseSchema>;
