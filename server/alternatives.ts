import { CITY_BY_ID, findCityByName } from '../src/data/cities';
import { photo, PHOTO_SIZES } from '../src/data/images';
import { getCityVenues } from '../src/data/venues';
import type { ActivityBlock, ActivityKind } from '../src/types/itinerary';

export interface AlternativesInput {
  destination: string;
  blockId: string;
  kind: ActivityKind;
  budgetPerDay: number;
}

/**
 * Alternatives for a single block.
 *
 * Prefers the same kind — a swap should offer a different museum, not a bar —
 * then falls back to anything else in the city that fits the budget. Returns
 * `null` for a destination with no catalogue, which the transports turn into a
 * 404 rather than an empty list: "no alternatives" and "no such city" are
 * different answers and the UI says different things about them.
 */
export function buildAlternatives(input: AlternativesInput): ActivityBlock[] | null {
  const { destination, kind, blockId, budgetPerDay } = input;

  const city = findCityByName(destination) ?? CITY_BY_ID.get(destination);
  const venues = city ? getCityVenues(city.id) : undefined;
  if (!city || !venues) return null;

  const sameKind = venues.venues.filter((venue) => venue.kind === kind);
  const rest = venues.venues.filter((venue) => venue.kind !== kind);
  const affordable = [...sameKind, ...rest].filter((venue) => venue.price <= budgetPerDay);

  const chosen = (affordable.length > 0 ? affordable : venues.venues).slice(0, 3);

  return chosen.map((venue, index) => ({
    id: `${blockId}-alt-${String(index)}`,
    kind: venue.kind,
    title: venue.title,
    summary: venue.summary,
    startTime: '12:00',
    durationMinutes: venue.durationMinutes,
    place: {
      name: venue.title,
      address: venue.address,
      coordinates: venue.coordinates,
      walkFromPrevious: null,
    },
    price: venue.price,
    tags: venue.tags.slice(0, 6),
    imageUrl: photo(venue.imageSeed, PHOTO_SIZES.card),
    note: venue.note ?? null,
  }));
}
