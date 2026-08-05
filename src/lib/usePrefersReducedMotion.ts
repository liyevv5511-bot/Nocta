import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined' || !('matchMedia' in window)) return () => undefined;

  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', onChange);
  return () => {
    mql.removeEventListener('change', onChange);
  };
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined' || !('matchMedia' in window)) return false;
  return window.matchMedia(QUERY).matches;
}

/** Server/prerender assumes motion is allowed; the client corrects on hydrate. */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Live `prefers-reduced-motion`.
 *
 * `useSyncExternalStore` rather than `useEffect` + state, because the value is
 * needed during the first render — a hook that reports `false` on mount and
 * corrects afterwards would play exactly the animation it is meant to prevent.
 * It also tracks changes made while the tab is open, which matters: users flip
 * this setting mid-session when something makes them queasy.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
