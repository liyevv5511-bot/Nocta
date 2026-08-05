import type { z } from 'zod';

/**
 * Versioned, validated localStorage.
 *
 * Three things every persisted store needs and most do not have:
 *
 *   1. **A version.** Shipping a schema change without one corrupts the data
 *      of every existing user, silently, on their next visit.
 *   2. **A migration chain.** `1 → 2 → 3`, applied in order, so a user who has
 *      not opened the app in a year still lands on the current shape.
 *   3. **Validation after migration.** Storage is user-writable and
 *      extension-writable. Data coming out of it is untrusted input.
 *
 * Anything that fails to migrate or validate is quarantined under a
 * `.corrupt` key rather than deleted — it can be recovered by support, and
 * the user sees an empty state rather than a crash.
 */

export interface VersionedEnvelope<T> {
  version: number;
  data: T;
  updatedAt: string;
}

/** Migrates the shape at `version` to the shape at `version + 1`. */
export type Migration = (data: unknown) => unknown;

export interface StoreConfig<T> {
  key: string;
  version: number;
  schema: z.ZodType<T>;
  /** Keyed by the version being migrated *from*. */
  migrations?: Record<number, Migration>;
  fallback: T;
}

export type StorageResult<T> =
  | { ok: true; data: T; migrated: boolean }
  | { ok: false; reason: 'empty' | 'unavailable' | 'corrupt'; data: T };

/**
 * Feature-detect rather than assume. Safari in private mode, and any browser
 * with storage disabled by policy, throws on `setItem` — not on access.
 */
export function isStorageAvailable(): boolean {
  try {
    const probe = '__nocta_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function createStore<T>(config: StoreConfig<T>) {
  const { key, version, schema, migrations = {}, fallback } = config;

  function read(): StorageResult<T> {
    if (!isStorageAvailable()) {
      return { ok: false, reason: 'unavailable', data: fallback };
    }

    const raw = window.localStorage.getItem(key);
    if (raw === null) {
      return { ok: false, reason: 'empty', data: fallback };
    }

    try {
      const envelope = JSON.parse(raw) as unknown;

      if (
        typeof envelope !== 'object' ||
        envelope === null ||
        !('version' in envelope) ||
        !('data' in envelope)
      ) {
        return quarantine(raw);
      }

      const { version: storedVersion, data } = envelope as VersionedEnvelope<unknown>;

      if (typeof storedVersion !== 'number' || storedVersion > version) {
        // Data written by a newer build. Do not attempt to downgrade — that
        // is how you lose a user's trips when they roll back a tab.
        return quarantine(raw);
      }

      let current: unknown = data;
      let migrated = false;

      for (let v = storedVersion; v < version; v += 1) {
        const migrate = migrations[v];
        if (!migrate) return quarantine(raw);
        current = migrate(current);
        migrated = true;
      }

      const parsed = schema.safeParse(current);
      if (!parsed.success) return quarantine(raw);

      return { ok: true, data: parsed.data, migrated };
    } catch {
      return quarantine(raw);
    }
  }

  function quarantine(raw: string): StorageResult<T> {
    try {
      window.localStorage.setItem(`${key}.corrupt`, raw);
      window.localStorage.removeItem(key);
    } catch {
      // Quarantine is best-effort; failing it must not fail the read.
    }
    return { ok: false, reason: 'corrupt', data: fallback };
  }

  function write(data: T): boolean {
    if (!isStorageAvailable()) return false;

    const envelope: VersionedEnvelope<T> = {
      version,
      data,
      updatedAt: new Date().toISOString(),
    };

    try {
      window.localStorage.setItem(key, JSON.stringify(envelope));
      return true;
    } catch {
      // Almost always QuotaExceededError. The caller decides whether to warn.
      return false;
    }
  }

  function clear(): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Nothing useful to do — the data is already unreachable.
    }
  }

  return { read, write, clear, key, version };
}
