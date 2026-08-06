import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';

import { toast } from '@/features/ui';
import { i18next } from '@/i18n';
import { createStore } from '@/lib/storage';
import { ItinerarySchema, type Itinerary } from '@/types/itinerary';

/**
 * Saved trips.
 *
 * Schema version 2. Version 1 stored a bare `Itinerary[]`; version 2 wraps
 * each entry with the metadata the saved-trips list needs (a user-editable
 * name, a save timestamp) without having to re-derive it from the itinerary.
 * The migration below is what a returning user's data actually runs through —
 * it is not illustrative.
 */

const SavedTripSchema = z.object({
  savedAt: z.string().datetime(),
  /** Defaults to "N days in <city>" but the user can rename it. */
  name: z.string().min(1).max(80),
  itinerary: ItinerarySchema,
});

export type SavedTrip = z.infer<typeof SavedTripSchema>;

const SavedTripsSchema = z.array(SavedTripSchema);

const STORE_VERSION = 2;

const store = createStore<SavedTrip[]>({
  key: 'nocta.trips',
  version: STORE_VERSION,
  schema: SavedTripsSchema,
  fallback: [],
  migrations: {
    /** v1 → v2: bare itineraries become named, timestamped entries. */
    1: (data) => {
      if (!Array.isArray(data)) return [];
      return data.flatMap((entry) => {
        const parsed = ItinerarySchema.safeParse(entry);
        if (!parsed.success) return [];
        return [
          {
            savedAt: parsed.data.generatedAt,
            name: defaultName(parsed.data),
            itinerary: parsed.data,
          },
        ];
      });
    },
  },
});

export function defaultName(itinerary: Itinerary): string {
  return i18next.t('saved.defaultName', {
    count: itinerary.days.length,
    city: itinerary.meta.destination,
  });
}

export interface TripStorage {
  trips: SavedTrip[];
  /** `false` when the browser refuses localStorage (private mode, policy). */
  available: boolean;
  save: (itinerary: Itinerary, name?: string) => boolean;
  remove: (tripId: string) => void;
  rename: (tripId: string, name: string) => void;
  find: (tripId: string) => SavedTrip | undefined;
  isSaved: (tripId: string) => boolean;
}

/** Cap: beyond this the list stops being browsable and quota gets tight. */
const MAX_TRIPS = 30;

export function useTripStorage(): TripStorage {
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    const result = store.read();
    setTrips(result.data);

    if (!result.ok && result.reason === 'unavailable') {
      setAvailable(false);
    }
    if (!result.ok && result.reason === 'corrupt') {
      toast.warning(i18next.t('saved.couldNotRead'), i18next.t('saved.couldNotReadBody'));
    }
    if (result.ok && result.migrated) {
      // Persist the migrated shape immediately, so the migration runs once
      // rather than on every load until something else happens to write.
      store.write(result.data);
    }
  }, []);

  const commit = useCallback((next: SavedTrip[]): boolean => {
    setTrips(next);
    const written = store.write(next);
    if (!written) {
      toast.error(i18next.t('saved.couldNotSave'), i18next.t('saved.couldNotSaveBody'));
    }
    return written;
  }, []);

  const save = useCallback<TripStorage['save']>(
    (itinerary, name) => {
      const entry: SavedTrip = {
        savedAt: new Date().toISOString(),
        name: name ?? defaultName(itinerary),
        itinerary,
      };

      const withoutDuplicate = trips.filter((trip) => trip.itinerary.id !== itinerary.id);
      return commit([entry, ...withoutDuplicate].slice(0, MAX_TRIPS));
    },
    [trips, commit],
  );

  const remove = useCallback<TripStorage['remove']>(
    (tripId) => {
      commit(trips.filter((trip) => trip.itinerary.id !== tripId));
    },
    [trips, commit],
  );

  const rename = useCallback<TripStorage['rename']>(
    (tripId, name) => {
      const trimmed = name.trim().slice(0, 80);
      if (trimmed.length === 0) return;
      commit(
        trips.map((trip) => (trip.itinerary.id === tripId ? { ...trip, name: trimmed } : trip)),
      );
    },
    [trips, commit],
  );

  const find = useCallback<TripStorage['find']>(
    (tripId) => trips.find((trip) => trip.itinerary.id === tripId),
    [trips],
  );

  const isSaved = useCallback<TripStorage['isSaved']>(
    (tripId) => trips.some((trip) => trip.itinerary.id === tripId),
    [trips],
  );

  return { trips, available, save, remove, rename, find, isSaved };
}
