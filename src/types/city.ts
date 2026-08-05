import { z } from 'zod';

import { CoordinatesSchema, MoodSchema } from './itinerary';

/** Northern-hemisphere-agnostic season labels used by `bestSeason`. */
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
export const SeasonSchema = z.enum(SEASONS);
export type Season = z.infer<typeof SeasonSchema>;

export const CityHighlightSchema = z.object({
  title: z.string().min(1),
  detail: z.string().min(1),
});
export type CityHighlight = z.infer<typeof CityHighlightSchema>;

export const CitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  country: z.string().min(1),
  countryCode: z.string().length(2),
  coordinates: CoordinatesSchema,
  /** One sentence of why you would go. Shown on the map hover preview. */
  tagline: z.string().min(1).max(120),
  blurb: z.string().min(1).max(400),
  imageUrl: z.string().url(),
  /** Average all-in daily spend for one traveller, in `currency`. */
  avgDailyCost: z.number().int().min(0),
  currency: z.string().length(3),
  bestSeasons: z.array(SeasonSchema).min(1).max(4),
  /** Typical daytime high, °C, for the current month band. */
  temperatureC: z.number().min(-40).max(55),
  weatherSummary: z.string().min(1).max(60),
  moods: z.array(MoodSchema).min(1),
  highlights: z.array(CityHighlightSchema).length(3),
  /** Used to size markers and to break ties when clustering. */
  popularity: z.number().min(0).max(1),
});
export type City = z.infer<typeof CitySchema>;

export const CityListSchema = z.array(CitySchema);
