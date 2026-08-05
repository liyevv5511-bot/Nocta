import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { createStore, isStorageAvailable } from './storage';

const Schema = z.array(z.object({ id: z.string(), label: z.string() }));
type Data = z.infer<typeof Schema>;

const KEY = 'nocta.test';

function makeStore(version = 2) {
  return createStore<Data>({
    key: KEY,
    version,
    schema: Schema,
    fallback: [],
    migrations: {
      // v1 stored bare strings; v2 wraps them as objects.
      1: (data) => {
        if (!Array.isArray(data)) return [];
        return data.map((value, index) => ({ id: String(index), label: String(value) }));
      },
    },
  });
}

/**
 * Reads and asserts the result was a failure, returning its reason.
 *
 * `StorageResult` is a discriminated union on purpose — the success branch has
 * no `reason` — so the tests narrow through this helper rather than reaching
 * for a non-null assertion at every call site.
 */
function readFailureReason(store: ReturnType<typeof makeStore>): string {
  const result = store.read();
  if (result.ok) throw new Error('expected the read to fail, but it succeeded');
  return result.reason;
}

function write(version: number, data: unknown): void {
  window.localStorage.setItem(
    KEY,
    JSON.stringify({ version, data, updatedAt: '2026-01-01T00:00:00.000Z' }),
  );
}

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('isStorageAvailable', () => {
  it('is true in a normal browser environment', () => {
    expect(isStorageAvailable()).toBe(true);
  });

  it('is false when setItem throws, as in private mode', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    expect(isStorageAvailable()).toBe(false);
  });
});

describe('read', () => {
  it('reports empty for a key that was never written', () => {
    const result = makeStore().read();
    expect(result).toEqual({ ok: false, reason: 'empty', data: [] });
  });

  it('returns current-version data without migrating', () => {
    write(2, [{ id: '1', label: 'Lisbon' }]);
    const result = makeStore().read();

    expect(result.ok).toBe(true);
    expect(result.data).toEqual([{ id: '1', label: 'Lisbon' }]);
    if (result.ok) expect(result.migrated).toBe(false);
  });

  it('migrates v1 data forward and flags it', () => {
    write(1, ['Lisbon', 'Porto']);
    const result = makeStore().read();

    expect(result.ok).toBe(true);
    expect(result.data).toEqual([
      { id: '0', label: 'Lisbon' },
      { id: '1', label: 'Porto' },
    ]);
    if (result.ok) expect(result.migrated).toBe(true);
  });

  it('applies migrations in sequence across several versions', () => {
    const store = createStore<Data>({
      key: KEY,
      version: 3,
      schema: Schema,
      fallback: [],
      migrations: {
        1: (data) => (Array.isArray(data) ? data.map((v) => ({ id: '0', label: String(v) })) : []),
        2: (data) =>
          Array.isArray(data)
            ? (data as Data).map((entry) => ({ ...entry, label: entry.label.toUpperCase() }))
            : [],
      },
    });

    write(1, ['lisbon']);
    expect(store.read().data).toEqual([{ id: '0', label: 'LISBON' }]);
  });

  it('quarantines data written by a newer build instead of downgrading it', () => {
    write(99, [{ id: '1', label: 'From the future' }]);
    const result = makeStore().read();

    expect(result).toEqual({ ok: false, reason: 'corrupt', data: [] });
    expect(window.localStorage.getItem(`${KEY}.corrupt`)).not.toBeNull();
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it('quarantines data with no migration path', () => {
    // No migration registered from 0.
    write(0, ['orphan']);
    expect(readFailureReason(makeStore())).toBe('corrupt');
    expect(window.localStorage.getItem(`${KEY}.corrupt`)).not.toBeNull();
  });

  it('quarantines data that migrates but fails validation', () => {
    write(2, [{ id: 1, label: false }]);
    expect(readFailureReason(makeStore())).toBe('corrupt');
  });

  it('quarantines unparseable JSON', () => {
    window.localStorage.setItem(KEY, '{not json');
    expect(readFailureReason(makeStore())).toBe('corrupt');
  });

  it('quarantines a payload that is not an envelope', () => {
    window.localStorage.setItem(KEY, JSON.stringify([{ id: '1', label: 'bare array' }]));
    expect(readFailureReason(makeStore())).toBe('corrupt');
  });

  it('reports unavailable rather than corrupt when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('SecurityError');
    });
    expect(readFailureReason(makeStore())).toBe('unavailable');
  });
});

describe('write', () => {
  it('round-trips through read', () => {
    const store = makeStore();
    expect(store.write([{ id: '1', label: 'Kyoto' }])).toBe(true);
    expect(store.read().data).toEqual([{ id: '1', label: 'Kyoto' }]);
  });

  it('stamps the current version and a timestamp', () => {
    makeStore().write([{ id: '1', label: 'Kyoto' }]);
    const raw = window.localStorage.getItem(KEY);
    const envelope = JSON.parse(raw ?? '{}') as { version: number; updatedAt: string };

    expect(envelope.version).toBe(2);
    expect(Number.isNaN(Date.parse(envelope.updatedAt))).toBe(false);
  });

  it('returns false rather than throwing when the quota is exceeded', () => {
    const store = makeStore();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    expect(store.write([{ id: '1', label: 'Kyoto' }])).toBe(false);
  });
});

describe('clear', () => {
  it('removes the key', () => {
    const store = makeStore();
    store.write([{ id: '1', label: 'Kyoto' }]);
    store.clear();
    expect(readFailureReason(store)).toBe('empty');
  });
});
