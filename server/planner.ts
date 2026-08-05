import { CITY_BY_ID, findCityByName } from '../src/data/cities';
import { distanceMetres, groundTravelMinutes } from '../src/lib/geo';
import { photo, PHOTO_SIZES } from '../src/data/images';
import { getCityVenues, type DistrictSeed, type Slot, type VenueSeed } from '../src/data/venues';
import type { City } from '../src/types/city';
import type {
  ActivityBlock,
  Coordinates,
  ItineraryDay,
  ItineraryMeta,
  Mood,
  Pace,
  PlanRequest,
} from '../src/types/itinerary';

/**
 * The planner.
 *
 * This is the piece that a real model would replace. It is deliberately shaped
 * like one: it takes a `PlanRequest`, it produces days one at a time, and every
 * day it produces is a complete `ItineraryDay` that satisfies the shared Zod
 * schema. Swapping in an LLM means replacing `composeDay` with a completion
 * call and keeping everything else — including the SSE transport, the client
 * parser and the UI — untouched.
 *
 * The algorithm itself is a constraint solve, not a shuffle:
 *   • blocks per day come from pace
 *   • each day gets a slot skeleton (morning / midday / afternoon / evening)
 *   • candidates are scored on mood fit, budget fit and slot fit
 *   • selection is without replacement, so nothing repeats across the trip
 *   • when the named-venue pool thins, day trips take over, then districts
 *   • start times are laid out from real durations plus real walking time
 */

const BLOCKS_PER_DAY: Record<Pace, number> = {
  relaxed: 4,
  balanced: 5,
  intense: 6,
};

/** The shape of a day, in order. Trimmed or extended to the pace's block count. */
const SLOT_SKELETON: Slot[] = ['morning', 'morning', 'midday', 'afternoon', 'afternoon', 'evening'];

const DAY_START_MINUTES = 9 * 60;

/** Matches `ActivityBlockSchema`'s ceiling on `walkFromPrevious`. */
const MAX_LEG_MINUTES = 240;

/** Getting from the station to the first stop once a transit block has run. */
const TRANSFER_MINUTES = 12;

/* -------------------------------------------------------------------------
 * Geometry
 *
 * `distanceMetres` and the walking model live in `src/lib/geo.ts`, shared with
 * the client so a day re-timed in the browser after a drag agrees with the one
 * the planner laid out.
 * ---------------------------------------------------------------------- */

/**
 * Travel time between two consecutive stops.
 *
 * `afterTransit` matters more than it looks. On a day trip the first block is
 * the journey itself — a two-hour train to Nikko — and the block after it is
 * 140km from where that block is anchored. Measuring that gap as travel would
 * bill the user twice for the same journey and produce a six-hour "walk". When
 * the previous block was transit, the remaining leg is the transfer at the far
 * end, not the distance covered.
 */
function walkMinutes(from: Coordinates, to: Coordinates, afterTransit = false): number {
  if (afterTransit) return TRANSFER_MINUTES;
  return groundTravelMinutes(from, to, MAX_LEG_MINUTES);
}

/* -------------------------------------------------------------------------
 * Deterministic randomness
 *
 * Same request → same plan. That matters for shareable `/trip/:id` links and
 * makes the E2E suite possible to assert against.
 * ---------------------------------------------------------------------- */

export function createRng(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* -------------------------------------------------------------------------
 * Scoring
 * ---------------------------------------------------------------------- */

interface ScoringContext {
  moods: readonly Mood[];
  budgetPerDay: number;
  blocksPerDay: number;
  wantedSlot: Slot;
  rng: () => number;
}

function scoreVenue(venue: VenueSeed, ctx: ScoringContext): number {
  let score = 0;

  // Mood fit dominates: this is the lever the traveller actually pulled.
  const moodHits = venue.moods.filter((mood) => ctx.moods.includes(mood)).length;
  score += moodHits * 40;
  if (moodHits === 0) score -= 25;

  // Slot fit. `any` venues are neutral rather than penalised.
  if (venue.slot === ctx.wantedSlot) score += 30;
  else if (venue.slot === 'any') score += 10;
  else score -= 12;

  // Budget fit, measured against this block's fair share of the day.
  const share = ctx.budgetPerDay / ctx.blocksPerDay;
  if (venue.price <= share) score += 14;
  else if (venue.price <= share * 1.8) score -= 6;
  else score -= 30;

  // Jitter, so two travellers with identical inputs but different names of
  // trip do not get an identically ordered day. Small enough never to beat a
  // genuine mood or budget signal.
  score += ctx.rng() * 8;

  return score;
}

/* -------------------------------------------------------------------------
 * Block construction
 * ---------------------------------------------------------------------- */

function toBlock(
  venue: VenueSeed,
  index: number,
  dayNumber: number,
  previous: Coordinates | null,
  startMinutes: number,
  afterTransit: boolean,
): ActivityBlock {
  return {
    id: `d${String(dayNumber)}-b${String(index)}-${slugPart(venue.title)}`,
    kind: venue.kind,
    title: venue.title,
    summary: venue.summary,
    startTime: toTimeString(startMinutes),
    durationMinutes: venue.durationMinutes,
    place: {
      name: venue.title,
      address: venue.address,
      coordinates: venue.coordinates,
      walkFromPrevious:
        previous === null ? null : walkMinutes(previous, venue.coordinates, afterTransit),
    },
    price: venue.price,
    tags: venue.tags.slice(0, 6),
    imageUrl: photo(venue.imageSeed, PHOTO_SIZES.card),
    note: venue.note ?? null,
  };
}

function slugPart(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
}

function toTimeString(totalMinutes: number): string {
  const clamped = Math.min(23 * 60 + 59, Math.max(0, Math.round(totalMinutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Relabels a venue as a deliberate second visit.
 *
 * The id suffix keeps block ids unique across the trip, and the note is what
 * stops a repeat from reading as a bug: it says the repetition is intentional
 * and gives a reason to go back.
 */
function asReturnVisit(venue: VenueSeed, pass: number): VenueSeed {
  return {
    ...venue,
    imageSeed: `${venue.imageSeed}-r${String(pass)}`,
    note:
      venue.note ??
      'A second visit, at a different hour — the catalogue for this city is otherwise spent.',
  };
}

/** Turns a district into a real, specific open block — never "free time". */
function districtToVenue(district: DistrictSeed, moods: readonly Mood[]): VenueSeed {
  const shared = district.moods.filter((mood) => moods.includes(mood));
  return {
    kind: 'experience',
    title: `Unstructured hours in ${district.name}`,
    summary: `${district.reason} No fixed plan for this block — the neighbourhood is the activity.`,
    address: district.name,
    coordinates: district.coordinates,
    price: 0,
    durationMinutes: 120,
    tags: [district.name.toLowerCase(), 'unplanned', ...shared.slice(0, 2)],
    imageSeed: district.imageSeed,
    moods: district.moods,
    slot: 'afternoon',
  };
}

/* -------------------------------------------------------------------------
 * Day composition
 * ---------------------------------------------------------------------- */

interface PlannerState {
  city: City;
  request: PlanRequest;
  rng: () => number;
  /** Venues not yet used, so nothing repeats across the whole trip. */
  pool: VenueSeed[];
  dayTripIndex: number;
  districtIndex: number;
  /** How many times the venue pool has been refilled. 0 on any normal trip. */
  recycles: number;
}

export function createPlannerState(request: PlanRequest): PlannerState | null {
  const city = findCityByName(request.destination) ?? CITY_BY_ID.get(request.destination);
  if (!city) return null;

  const venues = getCityVenues(city.id);
  if (!venues) return null;

  return {
    city,
    request,
    rng: createRng(
      `${city.id}:${request.days.toString()}:${request.moods.join(',')}:${request.pace}`,
    ),
    pool: [...venues.venues],
    dayTripIndex: 0,
    districtIndex: 0,
    recycles: 0,
  };
}

/**
 * Produces one day. Called `days` times; each call mutates the shared pool so
 * later days cannot reuse earlier picks.
 */
export function composeDay(state: PlannerState, dayNumber: number): ItineraryDay {
  const { city, request } = state;
  const blocksPerDay = BLOCKS_PER_DAY[request.pace];
  const venues = getCityVenues(city.id);

  // Once the named pool can no longer fill a day, switch to a day trip. This
  // is a better plan than a thinner city day, and it is what a good human
  // planner would do at exactly this point.
  const dayTrips = venues?.dayTrips ?? [];
  if (state.pool.length < blocksPerDay && state.dayTripIndex < dayTrips.length) {
    const trip = dayTrips[state.dayTripIndex];
    state.dayTripIndex += 1;
    if (trip) return buildDayFromSeeds(trip.blocks, dayNumber, trip.title, trip.theme);
  }

  const skeleton = slotsForPace(blocksPerDay);
  const chosen: VenueSeed[] = [];

  for (const wantedSlot of skeleton) {
    const picked = takeBest(state, wantedSlot, blocksPerDay, chosen);
    if (picked) chosen.push(picked);
  }

  // Still short (very long trips): pad with real neighbourhoods.
  const districts = venues?.districts ?? [];
  while (chosen.length < blocksPerDay && state.districtIndex < districts.length) {
    const district = districts[state.districtIndex];
    state.districtIndex += 1;
    if (district) chosen.push(districtToVenue(district, request.moods));
  }

  // Last resort: the catalogue is genuinely spent. A city has a finite number
  // of things worth naming, and a fourteen-day trip will exhaust any of them.
  //
  // The alternative to recycling is emitting a short — or empty — day, and an
  // empty day is not a valid plan under the schema, let alone a useful one.
  // So the pool is refilled and reused venues are relabelled as return visits,
  // which is both honest and what people actually do on a long stay.
  if (chosen.length < blocksPerDay && venues) {
    state.recycles += 1;
    state.pool = venues.venues.map((venue) => asReturnVisit(venue, state.recycles));
    state.districtIndex = 0;

    for (const wantedSlot of slotsForPace(blocksPerDay - chosen.length)) {
      const picked = takeBest(state, wantedSlot, blocksPerDay, chosen);
      if (picked) chosen.push(picked);
    }
  }

  const ordered = orderByProximity(chosen, city.coordinates);
  return buildDayFromSeeds(
    ordered,
    dayNumber,
    titleForDay(ordered, dayNumber, city),
    themeForDay(ordered, request.moods),
  );
}

function slotsForPace(blocksPerDay: number): Slot[] {
  if (blocksPerDay >= SLOT_SKELETON.length) return [...SLOT_SKELETON];
  // Always keep one morning, one midday and one evening; drop afternoons first.
  const trimmed: Slot[] = ['morning', 'midday', 'evening'];
  const extras: Slot[] = ['afternoon', 'afternoon', 'morning'];
  while (trimmed.length < blocksPerDay) {
    const next = extras.shift();
    if (!next) break;
    trimmed.splice(trimmed.length - 1, 0, next);
  }
  return trimmed;
}

function takeBest(
  state: PlannerState,
  wantedSlot: Slot,
  blocksPerDay: number,
  alreadyChosen: readonly VenueSeed[],
): VenueSeed | null {
  if (state.pool.length === 0) return null;

  const ctx: ScoringContext = {
    moods: state.request.moods,
    budgetPerDay: state.request.budgetPerDay,
    blocksPerDay,
    wantedSlot,
    rng: state.rng,
  };

  let bestIndex = -1;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < state.pool.length; i += 1) {
    const candidate = state.pool[i];
    if (!candidate) continue;

    let score = scoreVenue(candidate, ctx);

    // Two museums back to back is a worse day than a museum and a market,
    // even if both score well in isolation.
    const sameKindToday = alreadyChosen.filter((v) => v.kind === candidate.kind).length;
    score -= sameKindToday * 22;

    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  if (bestIndex < 0) return null;
  const [taken] = state.pool.splice(bestIndex, 1);
  return taken ?? null;
}

/**
 * Nearest-neighbour walk from the city centre. Not optimal — a real TSP on
 * five points would be — but it removes the crossing paths that make a plan
 * feel machine-generated, and it keeps evening venues last where they belong.
 */
function orderByProximity(venues: readonly VenueSeed[], origin: Coordinates): VenueSeed[] {
  const evening = venues.filter((v) => v.slot === 'evening');
  const rest = venues.filter((v) => v.slot !== 'evening');

  const ordered: VenueSeed[] = [];
  const remaining = [...rest];
  let cursor: Coordinates = origin;

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearest = Number.POSITIVE_INFINITY;

    for (let i = 0; i < remaining.length; i += 1) {
      const candidate = remaining[i];
      if (!candidate) continue;
      const d = distanceMetres(cursor, candidate.coordinates);
      if (d < nearest) {
        nearest = d;
        nearestIndex = i;
      }
    }

    const [next] = remaining.splice(nearestIndex, 1);
    if (!next) break;
    ordered.push(next);
    cursor = next.coordinates;
  }

  return [...ordered, ...evening];
}

function buildDayFromSeeds(
  seeds: readonly VenueSeed[],
  dayNumber: number,
  title: string,
  theme: string,
): ItineraryDay {
  const blocks: ActivityBlock[] = [];
  let clock = DAY_START_MINUTES;
  let previous: Coordinates | null = null;

  let previousWasTransit = false;

  seeds.forEach((seed, index) => {
    const travel =
      previous === null ? 0 : walkMinutes(previous, seed.coordinates, previousWasTransit);
    clock += travel;

    // Evening blocks never start before 19:00, however efficient the day was.
    if (seed.slot === 'evening' && clock < 19 * 60) clock = 19 * 60;
    // And a midday block is lunch, not a 15:40 afterthought.
    if (seed.slot === 'midday' && clock < 12 * 60 + 30) clock = 12 * 60 + 30;

    blocks.push(toBlock(seed, index, dayNumber, previous, clock, previousWasTransit));

    clock += seed.durationMinutes + 15; // 15 min of slack between blocks.
    previous = seed.coordinates;
    previousWasTransit = seed.kind === 'transit';
  });

  return {
    id: `day-${String(dayNumber)}`,
    dayNumber,
    title,
    theme,
    blocks,
  };
}

function titleForDay(seeds: readonly VenueSeed[], dayNumber: number, city: City): string {
  const anchor = seeds.find((s) => s.kind === 'landmark' || s.kind === 'museum');
  if (anchor) return anchor.title.split(' — ')[0] ?? anchor.title;
  if (dayNumber === 1) return `Arriving in ${city.name}`;
  return seeds[0]?.title ?? `Day ${String(dayNumber)}`;
}

function themeForDay(seeds: readonly VenueSeed[], moods: readonly Mood[]): string {
  const kinds = new Set(seeds.map((s) => s.kind));
  const parts: string[] = [];

  if (kinds.has('landmark') || kinds.has('museum')) parts.push('the essential sights');
  if (kinds.has('food') || kinds.has('cafe')) parts.push('two meals worth planning around');
  if (kinds.has('nature')) parts.push('somewhere green to sit');
  if (kinds.has('nightlife')) parts.push('a late finish');
  if (kinds.has('shopping')) parts.push('time in the markets');

  const walked = seeds.reduce((sum, seed, i) => {
    const prev = seeds[i - 1];
    return prev ? sum + distanceMetres(prev.coordinates, seed.coordinates) : sum;
  }, 0);

  const lead =
    parts.length > 0
      ? parts
          .slice(0, 3)
          .join(', ')
          .replace(/, ([^,]*)$/, ' and $1')
      : `a ${moods[0] ?? 'balanced'} day`;

  // "Covered", not "on foot": a day that includes a beach 30km out is mostly
  // ground travelled, and calling that a walk would be a lie the user could
  // check against the map.
  return `${lead.charAt(0).toUpperCase()}${lead.slice(1)} — about ${(walked / 1000).toFixed(1)} km covered between stops.`;
}

/* -------------------------------------------------------------------------
 * Trip-level output
 * ---------------------------------------------------------------------- */

export function buildMeta(city: City, request: PlanRequest): ItineraryMeta {
  return {
    destination: city.name,
    countryCode: city.countryCode,
    currency: city.currency,
    pace: request.pace,
    moods: [...request.moods],
    budgetPerDay: request.budgetPerDay,
    coordinates: city.coordinates,
  };
}

export function buildSummary(city: City, request: PlanRequest): string {
  const nights = request.days === 1 ? 'a single day' : `${String(request.days)} days`;
  const moodPhrase = request.moods.join(', ').replace(/, ([^,]*)$/, ' and $1');
  const paceNote: Record<Pace, string> = {
    relaxed: 'Four anchors a day, long gaps between them, and nothing before nine.',
    balanced: 'Five blocks a day with real time to sit down in between.',
    intense: 'Six blocks a day. You will be tired, and you will have seen the city.',
  };

  return `${nights.charAt(0).toUpperCase()}${nights.slice(1)} in ${city.name}, weighted toward ${moodPhrase}, at around ${String(request.budgetPerDay)} ${city.currency} a day. ${paceNote[request.pace]}`;
}

export function buildHighlights(days: readonly ItineraryDay[], city: City): string[] {
  const allBlocks = days.flatMap((day) => day.blocks);
  const free = allBlocks.filter((b) => b.price === 0).length;
  const totalCost = allBlocks.reduce((sum, b) => sum + b.price, 0);
  const walkMinutesTotal = allBlocks.reduce((sum, b) => sum + (b.place.walkFromPrevious ?? 0), 0);

  const highlights = [
    `${String(allBlocks.length)} planned blocks across ${String(days.length)} days — no repeats.`,
    `${String(free)} of them cost nothing.`,
    `Activities total about ${String(Math.round(totalCost))} ${city.currency} per person.`,
    `Roughly ${String(Math.round(walkMinutesTotal))} minutes of walking between stops.`,
  ];

  const evening = allBlocks.find((b) => b.kind === 'nightlife');
  if (evening) highlights.push(`Latest finish: ${evening.title}.`);

  return highlights.slice(0, 6);
}

/** Status lines streamed while the plan is composed. Not decoration — each
 *  one names the step the planner is actually on. */
export function statusMessages(city: City, request: PlanRequest): string[] {
  const venueCount = getCityVenues(city.id)?.venues.length ?? 0;
  return [
    `Reading ${String(venueCount)} venues in ${city.name}…`,
    `Weighting for ${request.moods.join(' and ')}…`,
    `Fitting ${String(request.days)} days at a ${request.pace} pace…`,
    'Optimising walking routes between stops…',
    `Balancing against ${String(request.budgetPerDay)} ${city.currency} a day…`,
  ];
}
