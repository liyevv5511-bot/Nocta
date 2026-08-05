import { useCallback, useLayoutEffect, useRef, useState } from 'react';

export interface Size {
  width: number;
  height: number;
}

/**
 * Observed element size.
 *
 * `ResizeObserver` rather than a window resize listener: the canvas is inside
 * a responsive grid, so it changes size when a sibling does, when a font
 * loads, and when a panel opens — none of which fire a window resize.
 *
 * The observer is attached via a callback ref so it survives the element
 * being replaced (route transitions remount it) without an extra effect.
 */
export function useElementSize(): [(node: HTMLElement | null) => void, Size] {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const observerRef = useRef<ResizeObserver | null>(null);

  const ref = useCallback((node: HTMLElement | null) => {
    observerRef.current?.disconnect();

    if (!node) {
      observerRef.current = null;
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      setSize((current) =>
        // Sub-pixel jitter from a scrollbar appearing would otherwise loop.
        Math.abs(current.width - width) < 1 && Math.abs(current.height - height) < 1
          ? current
          : { width, height },
      );
    });

    observer.observe(node);
    observerRef.current = observer;

    const rect = node.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });
  }, []);

  useLayoutEffect(
    () => () => {
      observerRef.current?.disconnect();
    },
    [],
  );

  return [ref, size];
}
