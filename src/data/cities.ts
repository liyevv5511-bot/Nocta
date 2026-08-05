import { CityListSchema, type City } from '@/types/city';

import { photo, PHOTO_SIZES } from './images';

/**
 * The destination catalogue.
 *
 * Real coordinates, real seasons, real cost bands. This is the data the map,
 * the globe, the route builder and the planner all read from — there is no
 * second, prettier copy of it inside a component.
 *
 * Parsed through `CityListSchema` at module load: a typo in this file fails
 * loudly at startup rather than quietly at render.
 */
const CATALOGUE: City[] = [
  {
    id: 'lisbon',
    name: 'Lisbon',
    country: 'Portugal',
    countryCode: 'PT',
    coordinates: { lat: 38.7223, lng: -9.1393 },
    tagline: 'Seven hills, Atlantic light, and the best pastries on the continent.',
    blurb:
      'Lisbon rewards walking more than planning. The city stacks itself over the Tejo in tiled terraces, and the distance between a morning viewpoint and an afternoon in Belém is short enough to improvise. Come for the light; stay because dinner starts at ten.',
    imageUrl: photo('lisbon-alfama-rooftops', PHOTO_SIZES.cardWide),
    avgDailyCost: 95,
    currency: 'EUR',
    bestSeasons: ['spring', 'autumn'],
    temperatureC: 24,
    weatherSummary: 'Warm, dry, Atlantic breeze',
    moods: ['food', 'culture', 'relax', 'nightlife'],
    highlights: [
      { title: 'Alfama at dawn', detail: 'The oldest quarter before the tram queues form.' },
      { title: 'Time Out Market', detail: 'Twenty-six kitchens, one hall, no bad decision.' },
      { title: 'Sintra day trip', detail: 'Forty minutes by train into a different climate.' },
    ],
    popularity: 0.92,
  },
  {
    id: 'porto',
    name: 'Porto',
    country: 'Portugal',
    countryCode: 'PT',
    coordinates: { lat: 41.1579, lng: -8.6291 },
    tagline: 'Granite, port wine, and a river gorge running through the middle of it.',
    blurb:
      'Porto is denser and steeper than Lisbon, and considerably less interested in impressing you. The Douro splits it in two; the good decision is to cross the bridge on foot at dusk and drink on the Gaia side looking back.',
    imageUrl: photo('porto-douro-bridge', PHOTO_SIZES.cardWide),
    avgDailyCost: 82,
    currency: 'EUR',
    bestSeasons: ['spring', 'summer', 'autumn'],
    temperatureC: 22,
    weatherSummary: 'Mild, occasional Atlantic rain',
    moods: ['food', 'culture', 'relax'],
    highlights: [
      { title: 'Ponte Luís I', detail: 'Walk the upper deck; the view does the work.' },
      { title: 'Gaia cellars', detail: 'Tawny tastings in centuries-old lodges.' },
      { title: 'Livraria Lello', detail: 'Go at opening or not at all.' },
    ],
    popularity: 0.78,
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    coordinates: { lat: 35.6762, lng: 139.6503 },
    tagline: 'Thirteen million people and somehow the quietest trains you have ridden.',
    blurb:
      'Tokyo is not one city but a chain of them strung along the Yamanote line, each with its own logic. Plan by neighbourhood, not by landmark. The best meal of your trip will cost eleven euros and be served by one person at a seven-seat counter.',
    imageUrl: photo('tokyo-shibuya-night', PHOTO_SIZES.cardWide),
    avgDailyCost: 130,
    currency: 'EUR',
    bestSeasons: ['spring', 'autumn'],
    temperatureC: 21,
    weatherSummary: 'Clear and mild, humid in summer',
    moods: ['food', 'culture', 'nightlife', 'adventure'],
    highlights: [
      { title: 'Tsukiji outer market', detail: 'Breakfast standing up, before nine.' },
      { title: 'Shimokitazawa', detail: 'Second-hand shops and coffee, no towers.' },
      { title: 'Golden Gai', detail: 'Two hundred bars in six alleys.' },
    ],
    popularity: 0.96,
  },
  {
    id: 'kyoto',
    name: 'Kyoto',
    country: 'Japan',
    countryCode: 'JP',
    coordinates: { lat: 35.0116, lng: 135.7681 },
    tagline: 'Sixteen hundred temples and a grid you can cross by bicycle.',
    blurb:
      'Kyoto asks for early mornings. The temples that are unbearable at noon are transcendent at seven, and the city empties again after the last shinkansen leaves. Two full days is the minimum; four is the right answer.',
    imageUrl: photo('kyoto-fushimi-torii', PHOTO_SIZES.cardWide),
    avgDailyCost: 115,
    currency: 'EUR',
    bestSeasons: ['spring', 'autumn'],
    temperatureC: 19,
    weatherSummary: 'Crisp mornings, mild afternoons',
    moods: ['culture', 'nature', 'relax', 'food'],
    highlights: [
      { title: 'Fushimi Inari at 6am', detail: 'The full four-kilometre loop, alone.' },
      { title: 'Nishiki Market', detail: 'Five blocks of things you cannot name.' },
      { title: 'Philosopher’s Path', detail: 'Canal walk between two temple clusters.' },
    ],
    popularity: 0.88,
  },
  {
    id: 'reykjavik',
    name: 'Reykjavík',
    country: 'Iceland',
    countryCode: 'IS',
    coordinates: { lat: 64.1466, lng: -21.9426 },
    tagline: 'A small capital that functions mostly as a basecamp for the weather.',
    blurb:
      'You do not come to Reykjavík for Reykjavík. You come because it is ninety minutes from lava fields, glacial lagoons and a coastline that changes character every twenty kilometres. Rent the car. The city is the warm room you return to.',
    imageUrl: photo('reykjavik-aurora-coast', PHOTO_SIZES.cardWide),
    avgDailyCost: 175,
    currency: 'EUR',
    bestSeasons: ['summer', 'winter'],
    temperatureC: 11,
    weatherSummary: 'Cold, windy, four seasons hourly',
    moods: ['adventure', 'nature', 'relax'],
    highlights: [
      { title: 'Reykjanes peninsula', detail: 'Steam vents and black rock, forty minutes out.' },
      { title: 'Sky Lagoon', detail: 'Geothermal water facing the North Atlantic.' },
      { title: 'Aurora window', detail: 'September to March, clear nights, away from town.' },
    ],
    popularity: 0.71,
  },
  {
    id: 'marrakesh',
    name: 'Marrakesh',
    country: 'Morocco',
    countryCode: 'MA',
    coordinates: { lat: 31.6295, lng: -7.9811 },
    tagline: 'A medina that resists maps, and courtyards that go completely silent.',
    blurb:
      'Marrakesh is loud until you step through a door, and then it is not. The contrast is the entire point. Base yourself inside the walls, accept that you will get lost in the souks, and keep the afternoons empty for a roof and a pot of tea.',
    imageUrl: photo('marrakesh-medina-souk', PHOTO_SIZES.cardWide),
    avgDailyCost: 68,
    currency: 'EUR',
    bestSeasons: ['spring', 'autumn', 'winter'],
    temperatureC: 27,
    weatherSummary: 'Hot and dry, cool evenings',
    moods: ['culture', 'food', 'adventure'],
    highlights: [
      { title: 'Jemaa el-Fnaa', detail: 'Unrecognisable between afternoon and midnight.' },
      { title: 'Le Jardin Secret', detail: 'A restored riad garden in the middle of the noise.' },
      { title: 'Atlas foothills', detail: 'Ninety minutes to Imlil and real altitude.' },
    ],
    popularity: 0.8,
  },
  {
    id: 'copenhagen',
    name: 'Copenhagen',
    country: 'Denmark',
    countryCode: 'DK',
    coordinates: { lat: 55.6761, lng: 12.5683 },
    tagline: 'The rare city where the bicycle is genuinely the fastest way across.',
    blurb:
      'Copenhagen is designed, visibly and deliberately, and it is a pleasure to move through because of it. Everything is flat, everything is close, and the harbour is clean enough to swim in. Budget accordingly — it is not a cheap week.',
    imageUrl: photo('copenhagen-nyhavn-harbour', PHOTO_SIZES.cardWide),
    avgDailyCost: 155,
    currency: 'EUR',
    bestSeasons: ['summer'],
    temperatureC: 18,
    weatherSummary: 'Cool, bright, long summer evenings',
    moods: ['food', 'culture', 'relax'],
    highlights: [
      { title: 'Reffen', detail: 'Street-food yard on a reclaimed industrial pier.' },
      { title: 'Islands Brygge', detail: 'Harbour baths, open water, in the city.' },
      { title: 'Louisiana', detail: 'Coastal art museum, thirty-five minutes north.' },
    ],
    popularity: 0.83,
  },
  {
    id: 'mexico-city',
    name: 'Mexico City',
    country: 'Mexico',
    countryCode: 'MX',
    coordinates: { lat: 19.4326, lng: -99.1332 },
    tagline: 'Altitude, archaeology, and arguably the deepest food culture on earth.',
    blurb:
      'CDMX is enormous and surprisingly walkable in the parts you will spend time in. Roma and Condesa are leafy and low-rise; the Centro is baroque and stacked on Aztec foundations. Two thousand two hundred metres up — take the first day slowly.',
    imageUrl: photo('mexico-city-roma-street', PHOTO_SIZES.cardWide),
    avgDailyCost: 78,
    currency: 'EUR',
    bestSeasons: ['spring', 'autumn', 'winter'],
    temperatureC: 23,
    weatherSummary: 'Mild year-round, afternoon rain in summer',
    moods: ['food', 'culture', 'nightlife', 'adventure'],
    highlights: [
      { title: 'Teotihuacán', detail: 'Pyramids an hour north, go at opening.' },
      { title: 'Mercado de Medellín', detail: 'Where the neighbourhood actually shops.' },
      { title: 'Xochimilco', detail: 'Canals and chinampas, a pre-Hispanic survival.' },
    ],
    popularity: 0.86,
  },
];

/** Fails at import time if the catalogue drifts from the schema. */
export const CITIES: readonly City[] = Object.freeze(CityListSchema.parse(CATALOGUE));

export const CITY_BY_ID: ReadonlyMap<string, City> = new Map(CITIES.map((city) => [city.id, city]));

/** Case- and accent-insensitive lookup used by the destination input. */
export function findCityByName(query: string): City | undefined {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return undefined;

  return CITIES.find(
    (city) => city.name.toLowerCase() === needle || city.id === needle.replace(/\s+/g, '-'),
  );
}

export function searchCities(query: string, limit = 6): readonly City[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return CITIES.slice(0, limit);

  return CITIES.filter(
    (city) =>
      city.name.toLowerCase().includes(needle) || city.country.toLowerCase().includes(needle),
  ).slice(0, limit);
}
