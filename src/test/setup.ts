import '@testing-library/jest-dom/vitest';

/**
 * jsdom shims.
 *
 * jsdom implements neither of these, and both are load-bearing for the
 * components under test rather than incidental:
 *
 *  - `PointerEvent` is dispatched by Framer Motion's keyboard press handling,
 *    so its absence turns every keyboard-activation test into an unhandled
 *    exception.
 *  - `matchMedia` is read by `usePrefersReducedMotion` during the first
 *    render, via `useSyncExternalStore`.
 *
 * The default reduced-motion answer is `false`, matching a normal browser;
 * a test that needs the opposite overrides `window.matchMedia` itself.
 */

if (!('PointerEvent' in window)) {
  class PointerEventPolyfill extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    readonly isPrimary: boolean;

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
      this.pointerType = params.pointerType ?? 'mouse';
      this.isPrimary = params.isPrimary ?? true;
    }
  }

  Object.defineProperty(window, 'PointerEvent', {
    writable: true,
    configurable: true,
    value: PointerEventPolyfill,
  });
}

if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

if (typeof window.ResizeObserver !== 'function') {
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: class {
      observe(): void {
        // Sizes never change in jsdom; components read the initial rect.
      }
      unobserve(): void {
        // No-op: nothing was ever observed.
      }
      disconnect(): void {
        // No-op: nothing was ever observed.
      }
    },
  });
}

/**
 * `localStorage`.
 *
 * This jsdom build does not expose Storage on the window, so the persistence
 * layer would have nothing to run against. The shim below is a faithful
 * in-memory Storage: string coercion, `length`, `key()`, and a real prototype
 * so `vi.spyOn(Storage.prototype, 'setItem')` still intercepts writes — which
 * is how the quota-exceeded and private-mode paths are exercised.
 */
if (typeof window.localStorage === 'undefined') {
  class MemoryStorage implements Storage {
    #entries = new Map<string, string>();

    get length(): number {
      return this.#entries.size;
    }

    key(index: number): string | null {
      return [...this.#entries.keys()][index] ?? null;
    }

    getItem(key: string): string | null {
      return this.#entries.get(key) ?? null;
    }

    setItem(key: string, value: string): void {
      this.#entries.set(key, value);
    }

    removeItem(key: string): void {
      this.#entries.delete(key);
    }

    clear(): void {
      this.#entries.clear();
    }
  }

  Object.defineProperty(window, 'Storage', {
    writable: true,
    configurable: true,
    value: MemoryStorage,
  });
  Object.defineProperty(window, 'localStorage', {
    writable: true,
    configurable: true,
    value: new MemoryStorage(),
  });
}
