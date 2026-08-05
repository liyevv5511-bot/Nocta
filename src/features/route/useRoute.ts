import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { getCityVenues } from '@/data/venues';
import type { City } from '@/types/city';

import {
  MAX_ROUTE_CITIES,
  defaultRoute,
  parseRouteParam,
  resolveCities,
  suggestedNights,
  summariseRoute,
  toRouteParam,
  type RouteSummary,
} from './route.model';

export interface RouteController {
  cities: City[];
  summary: RouteSummary;
  isFull: boolean;
  add: (cityId: string) => void;
  remove: (cityId: string) => void;
  move: (cityId: string, direction: -1 | 1) => void;
  reset: () => void;
  contains: (cityId: string) => boolean;
}

/**
 * The route lives in the URL.
 *
 * `?cities=lisbon,porto,copenhagen` is the whole state. That is not a shortcut
 * around a store — it is the feature: a route someone assembles is worth
 * sending to the person they are travelling with, and putting it in the
 * address bar makes it shareable with no account, no database and no
 * link-shortening service. Back and forward work for free, and a reload keeps
 * what you built.
 *
 * `replace` rather than `push` on every edit, so reordering a five-city route
 * does not bury the previous page under twenty history entries.
 */
export function useRoute(): RouteController {
  const [params, setParams] = useSearchParams();

  const ids = useMemo(() => {
    const parsed = parseRouteParam(params.get('cities'));
    return parsed.length > 0 ? parsed : defaultRoute();
  }, [params]);

  const cities = useMemo(() => resolveCities(ids), [ids]);

  const summary = useMemo(
    () =>
      summariseRoute(cities, (city) => {
        const venues = getCityVenues(city.id);
        return suggestedNights(city, venues?.venues.length ?? 0, venues?.dayTrips.length ?? 0);
      }),
    [cities],
  );

  const commit = useCallback(
    (next: readonly string[]) => {
      setParams(
        (current) => {
          const updated = new URLSearchParams(current);
          if (next.length > 0) updated.set('cities', toRouteParam(next));
          else updated.delete('cities');
          return updated;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const add = useCallback(
    (cityId: string) => {
      if (ids.includes(cityId) || ids.length >= MAX_ROUTE_CITIES) return;
      commit([...ids, cityId]);
    },
    [ids, commit],
  );

  const remove = useCallback(
    (cityId: string) => {
      // A route needs two cities to be a route; removing the second-to-last
      // leaves a single stop, which the map and the summary both handle.
      commit(ids.filter((id) => id !== cityId));
    },
    [ids, commit],
  );

  const move = useCallback(
    (cityId: string, direction: -1 | 1) => {
      const index = ids.indexOf(cityId);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= ids.length) return;

      const next = [...ids];
      const [moved] = next.splice(index, 1);
      if (moved === undefined) return;

      next.splice(target, 0, moved);
      commit(next);
    },
    [ids, commit],
  );

  const reset = useCallback(() => {
    commit(defaultRoute());
  }, [commit]);

  const contains = useCallback((cityId: string) => ids.includes(cityId), [ids]);

  return {
    cities,
    summary,
    isFull: ids.length >= MAX_ROUTE_CITIES,
    add,
    remove,
    move,
    reset,
    contains,
  };
}
