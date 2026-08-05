import type { Coordinates } from '@/types/itinerary';

/**
 * Distance and travel-time maths.
 *
 * One implementation, shared by the planner (which lays out a day), the
 * itinerary reducer (which re-times one after a drag) and the route builder
 * (which measures the hops between cities). It used to be two near-identical
 * copies with a comment explaining that the duplication was deliberate — the
 * reasoning being that the client must be able to re-time a day with the
 * server offline. That is true, and it is an argument for putting the function
 * somewhere both can import, not for writing it twice.
 */

const EARTH_RADIUS_METRES = 6_371_000;

/** Walking pace through a dense city centre, in metres per minute. */
const WALK_METRES_PER_MINUTE = 75;

/** Past this, nobody walks — it becomes a metro or taxi hop. */
const WALKABLE_LIMIT_METRES = 2_500;

/** Effective door-to-door pace for a short urban transit hop. */
const URBAN_TRANSIT_METRES_PER_MINUTE = 400;

/** Great-circle distance between two points, in metres. */
export function distanceMetres(from: Coordinates, to: Coordinates): number {
  const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_METRES * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Minutes between two stops on the ground.
 *
 * Short hops are walked; longer ones are modelled as urban transit rather than
 * pretended to be free. `maxMinutes` clamps the result — the itinerary schema
 * caps a leg at 240 minutes, and a value the schema would reject is a bug
 * whichever side produces it.
 */
export function groundTravelMinutes(from: Coordinates, to: Coordinates, maxMinutes = 240): number {
  const metres = distanceMetres(from, to);

  const minutes =
    metres > WALKABLE_LIMIT_METRES
      ? Math.round(metres / URBAN_TRANSIT_METRES_PER_MINUTE)
      : Math.max(1, Math.round(metres / WALK_METRES_PER_MINUTE));

  return Math.min(maxMinutes, minutes);
}

/**
 * Rough travel time between two cities, in minutes.
 *
 * Deliberately coarse and deliberately honest about being coarse: it is a
 * planning aid, not a timetable. Under 350km it assumes rail or a drive at an
 * effective 90km/h door to door; beyond that it assumes flying, and adds three
 * hours for the parts of a flight that are not the flight.
 */
export function intercityTravelMinutes(from: Coordinates, to: Coordinates): number {
  const km = distanceMetres(from, to) / 1000;

  if (km < 350) return Math.round((km / 90) * 60);

  const AIRPORT_OVERHEAD_MINUTES = 180;
  const CRUISE_KM_PER_HOUR = 750;

  return Math.round(AIRPORT_OVERHEAD_MINUTES + (km / CRUISE_KM_PER_HOUR) * 60);
}

/** How a leg between two cities is most plausibly covered. */
export type TravelMode = 'rail' | 'air';

export function travelMode(from: Coordinates, to: Coordinates): TravelMode {
  return distanceMetres(from, to) / 1000 < 350 ? 'rail' : 'air';
}
