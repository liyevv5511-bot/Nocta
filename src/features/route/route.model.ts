import { CITIES, CITY_BY_ID } from '@/data/cities';
import { distanceMetres, intercityTravelMinutes, travelMode, type TravelMode } from '@/lib/geo';
import type { City } from '@/types/city';

/**
 * Multi-city route maths.
 *
 * Pure, and separate from both the store and the components, for the same
 * reason the itinerary reducer is: these are the product's rules — how long a
 * hop takes, how many nights a city is worth, what the whole thing costs — and
 * they are worth testing without mounting anything.
 */

/** Beyond this the route stops being a trip and starts being a tour. */
export const MAX_ROUTE_CITIES = 6;

export interface RouteLeg {
  from: City;
  to: City;
  distanceKm: number;
  travelMinutes: number;
  mode: TravelMode;
}

export interface RouteStop {
  city: City;
  /** Nights to spend here, derived from how much there is to do. */
  nights: number;
}

export interface RouteSummary {
  stops: RouteStop[];
  legs: RouteLeg[];
  nights: number;
  /** Nights plus a day of travel per leg. */
  days: number;
  travelMinutes: number;
  distanceKm: number;
  /** Accommodation and living, at each city's own daily rate. */
  estimatedCost: number;
  currency: string;
}

/**
 * Nights a city is worth.
 *
 * Derived from the catalogue rather than guessed: a city with more researched
 * venues and more day trips genuinely sustains a longer stay, and a route that
 * gave Reykjavík and Tokyo the same three nights would be visibly wrong to
 * anyone who has been to either.
 */
export function suggestedNights(city: City, venueCount: number, dayTripCount: number): number {
  const fromVenues = Math.round(venueCount / 5);
  const fromDayTrips = dayTripCount;
  const fromPopularity = city.popularity > 0.85 ? 1 : 0;

  return Math.max(2, Math.min(5, fromVenues + fromDayTrips + fromPopularity - 1));
}

/** Resolves ids to cities, dropping any that are not in the catalogue. */
export function resolveCities(ids: readonly string[]): City[] {
  return ids.flatMap((id) => {
    const city = CITY_BY_ID.get(id);
    return city ? [city] : [];
  });
}

export function buildLegs(cities: readonly City[]): RouteLeg[] {
  const legs: RouteLeg[] = [];

  for (let index = 0; index < cities.length - 1; index += 1) {
    const from = cities[index];
    const to = cities[index + 1];
    if (!from || !to) continue;

    legs.push({
      from,
      to,
      distanceKm: Math.round(distanceMetres(from.coordinates, to.coordinates) / 1000),
      travelMinutes: intercityTravelMinutes(from.coordinates, to.coordinates),
      mode: travelMode(from.coordinates, to.coordinates),
    });
  }

  return legs;
}

export function summariseRoute(
  cities: readonly City[],
  nightsFor: (city: City) => number,
): RouteSummary {
  const stops = cities.map((city) => ({ city, nights: nightsFor(city) }));
  const legs = buildLegs(cities);

  const nights = stops.reduce((total, stop) => total + stop.nights, 0);
  const travelMinutes = legs.reduce((total, leg) => total + leg.travelMinutes, 0);
  const distanceKm = legs.reduce((total, leg) => total + leg.distanceKm, 0);
  const estimatedCost = stops.reduce(
    (total, stop) => total + stop.nights * stop.city.avgDailyCost,
    0,
  );

  return {
    stops,
    legs,
    nights,
    // A leg eats a day even when the flight is short: you do not arrive and
    // start sightseeing. Counting nights alone is how itineraries end up
    // promising more than the calendar allows.
    days: nights + legs.length,
    travelMinutes,
    distanceKm,
    estimatedCost,
    // Every city in the catalogue prices in EUR; this reads the data rather
    // than assuming it, so adding a city with another currency surfaces here.
    currency: stops[0]?.city.currency ?? 'EUR',
  };
}

/* -------------------------------------------------------------------------
 * URL round-trip
 *
 * A route is worth sharing, and it is small enough to live in the URL — which
 * makes it shareable without an account, a database, or a link shortener.
 * ---------------------------------------------------------------------- */

export function parseRouteParam(value: string | null): string[] {
  if (value === null || value.trim().length === 0) return [];

  const seen = new Set<string>();
  const ids: string[] = [];

  for (const raw of value.split(',')) {
    const id = raw.trim().toLowerCase();
    // Unknown ids are dropped rather than rendered as gaps: a hand-edited or
    // out-of-date link should degrade to the cities it does recognise.
    if (!CITY_BY_ID.has(id) || seen.has(id)) continue;

    seen.add(id);
    ids.push(id);
  }

  return ids.slice(0, MAX_ROUTE_CITIES);
}

export function toRouteParam(ids: readonly string[]): string {
  return ids.join(',');
}

/**
 * A sensible starting route.
 *
 * The two Portuguese cities: close enough that the pairing is obviously
 * deliberate, and the shortest leg in the catalogue, so the first thing a
 * visitor sees is a route that makes sense rather than a random pair.
 */
export function defaultRoute(): string[] {
  const ids = ['lisbon', 'porto'];
  return ids.every((id) => CITY_BY_ID.has(id)) ? ids : CITIES.slice(0, 2).map((city) => city.id);
}
