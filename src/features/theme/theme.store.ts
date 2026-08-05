import { create } from 'zustand';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'nocta.theme';

interface ThemeState {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
  /** Called by the media-query listener when the OS setting changes. */
  syncSystem: () => void;
}

function systemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || !('matchMedia' in window)) return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function readPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // Storage unavailable — fall through to the system preference.
  }
  return 'system';
}

function resolve(preference: ThemePreference): ResolvedTheme {
  return preference === 'system' ? systemTheme() : preference;
}

/**
 * Applies the theme to the document.
 *
 * Two attributes, both required:
 *   `data-theme`   — what the CSS token layer switches on.
 *   `color-scheme` — what the *browser* switches on, for form controls,
 *                    scrollbars and the address bar. Setting only the first
 *                    gives you a dark page with light-mode native widgets.
 */
function applyTheme(resolved: ResolvedTheme): void {
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;

  // Read the canvas token back out rather than duplicating its value here —
  // otherwise the browser chrome drifts the moment the palette is retuned.
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) {
    const canvas = getComputedStyle(root).getPropertyValue('--canvas').trim();
    if (canvas.length > 0) meta.content = canvas;
  }
}

const initialPreference: ThemePreference =
  typeof window === 'undefined' ? 'system' : readPreference();

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: initialPreference,
  resolved: typeof window === 'undefined' ? 'dark' : resolve(initialPreference),

  setPreference: (preference) => {
    const resolved = resolve(preference);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      // A user who blocks storage still gets the theme for this session.
    }
    applyTheme(resolved);
    set({ preference, resolved });
  },

  syncSystem: () => {
    if (get().preference !== 'system') return;
    const resolved = systemTheme();
    applyTheme(resolved);
    set({ resolved });
  },
}));

/** Subscribes to OS changes. Called once, from the app provider. */
export function watchSystemTheme(): () => void {
  if (typeof window === 'undefined' || !('matchMedia' in window)) return () => undefined;

  const mql = window.matchMedia('(prefers-color-scheme: light)');
  const handler = (): void => {
    useThemeStore.getState().syncSystem();
  };

  mql.addEventListener('change', handler);
  return () => {
    mql.removeEventListener('change', handler);
  };
}
