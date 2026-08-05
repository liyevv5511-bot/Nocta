import { describe, expect, it } from 'vitest';

import { CITY_BY_ID } from '@/data/cities';
import type { City } from '@/types/city';

import {
  MAX_ROUTE_CITIES,
  buildLegs,
  defaultRoute,
  parseRouteParam,
  resolveCities,
  suggestedNights,
  summariseRoute,
  toRouteParam,
} from './route.model';

function city(id: string): City {
  const found = CITY_BY_ID.get(id);
  if (!found) throw new Error(`${id} is not in the catalogue`);
  return found;
}

const NIGHTS = (): number => 3;

describe('parseRouteParam', () => {
  it('reads an ordered list of ids', () => {
    expect(parseRouteParam('lisbon,porto,tokyo')).toEqual(['lisbon', 'porto', 'tokyo']);
  });

  it('preserves the order given rather than sorting', () => {
    expect(parseRouteParam('tokyo,lisbon')).toEqual(['tokyo', 'lisbon']);
  });

  it('is empty for a missing or blank parameter', () => {
    expect(parseRouteParam(null)).toEqual([]);
    expect(parseRouteParam('   ')).toEqual([]);
  });

  it('drops ids that are not in the catalogue rather than rendering gaps', () => {
    expect(parseRouteParam('lisbon,atlantis,porto')).toEqual(['lisbon', 'porto']);
  });

  it('drops duplicates, keeping the first position', () => {
    expect(parseRouteParam('lisbon,porto,lisbon')).toEqual(['lisbon', 'porto']);
  });

  it('tolerates whitespace and casing from a hand-edited link', () => {
    expect(parseRouteParam(' Lisbon , PORTO ')).toEqual(['lisbon', 'porto']);
  });

  it('caps the route at the maximum', () => {
    const all = [...CITY_BY_ID.keys()].join(',');
    expect(parseRouteParam(all)).toHaveLength(MAX_ROUTE_CITIES);
  });

  it('round-trips through toRouteParam', () => {
    const ids = ['tokyo', 'kyoto'];
    expect(parseRouteParam(toRouteParam(ids))).toEqual(ids);
  });
});

describe('resolveCities', () => {
  it('maps ids to catalogue entries in order', () => {
    expect(resolveCities(['porto', 'lisbon']).map((c) => c.name)).toEqual(['Porto', 'Lisbon']);
  });

  it('skips unknown ids', () => {
    expect(resolveCities(['lisbon', 'nowhere'])).toHaveLength(1);
  });
});

describe('buildLegs', () => {
  it('produces one fewer leg than there are cities', () => {
    expect(buildLegs([city('lisbon'), city('porto'), city('tokyo')])).toHaveLength(2);
  });

  it('produces nothing for a single stop', () => {
    expect(buildLegs([city('lisbon')])).toEqual([]);
  });

  it('measures a short hop as rail', () => {
    const [leg] = buildLegs([city('lisbon'), city('porto')]);

    expect(leg?.mode).toBe('rail');
    expect(leg?.distanceKm).toBeGreaterThan(260);
    expect(leg?.distanceKm).toBeLessThan(285);
  });

  it('measures a long hop as a flight', () => {
    const [leg] = buildLegs([city('lisbon'), city('tokyo')]);

    expect(leg?.mode).toBe('air');
    expect(leg?.travelMinutes).toBeGreaterThan(12 * 60);
  });

  it('follows the order given — reversing the route reverses the legs', () => {
    const forward = buildLegs([city('lisbon'), city('tokyo')]);
    const backward = buildLegs([city('tokyo'), city('lisbon')]);

    expect(forward[0]?.from.id).toBe(backward[0]?.to.id);
    expect(forward[0]?.distanceKm).toBe(backward[0]?.distanceKm);
  });
});

describe('suggestedNights', () => {
  it('stays within a plausible band whatever the catalogue says', () => {
    for (const id of CITY_BY_ID.keys()) {
      const nights = suggestedNights(city(id), 0, 0);
      expect(nights).toBeGreaterThanOrEqual(2);
      expect(nights).toBeLessThanOrEqual(5);
    }
  });

  it('gives a richer city more nights than a thin one', () => {
    const rich = suggestedNights(city('tokyo'), 14, 2);
    const thin = suggestedNights(city('porto'), 6, 0);
    expect(rich).toBeGreaterThan(thin);
  });
});

describe('summariseRoute', () => {
  it('counts a travel day per leg on top of the nights', () => {
    const summary = summariseRoute([city('lisbon'), city('porto'), city('tokyo')], NIGHTS);

    expect(summary.nights).toBe(9);
    // Three stops means two legs, and a leg eats a day.
    expect(summary.days).toBe(11);
  });

  it('does not add a travel day for a single stop', () => {
    const summary = summariseRoute([city('lisbon')], NIGHTS);

    expect(summary.days).toBe(summary.nights);
    expect(summary.legs).toEqual([]);
  });

  it('prices each stop at its own daily rate', () => {
    const summary = summariseRoute([city('lisbon'), city('reykjavik')], NIGHTS);
    const expected = 3 * city('lisbon').avgDailyCost + 3 * city('reykjavik').avgDailyCost;

    expect(summary.estimatedCost).toBe(expected);
  });

  it('sums distance and travel time across the legs', () => {
    const summary = summariseRoute([city('lisbon'), city('porto'), city('copenhagen')], NIGHTS);
    const legTotal = summary.legs.reduce((sum, leg) => sum + leg.distanceKm, 0);

    expect(summary.distanceKm).toBe(legTotal);
    expect(summary.travelMinutes).toBeGreaterThan(0);
  });

  it('is empty but valid for no cities at all', () => {
    const summary = summariseRoute([], NIGHTS);

    expect(summary).toMatchObject({ nights: 0, days: 0, distanceKm: 0, estimatedCost: 0 });
    expect(summary.currency).toBe('EUR');
  });
});

describe('defaultRoute', () => {
  it('is a real, resolvable pair', () => {
    const ids = defaultRoute();

    expect(ids).toHaveLength(2);
    expect(resolveCities(ids)).toHaveLength(2);
  });
});
