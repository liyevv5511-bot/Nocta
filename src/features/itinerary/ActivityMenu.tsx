import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { IconDots } from '@/features/ui/icons';

export interface ActivityMenuProps {
  /** Used in the trigger's accessible name — "Options for Time Out Market". */
  label: string;
  onSwap: () => void;
  onRemove: () => void;
}

/**
 * The per-activity overflow menu.
 *
 * Split out of `ActivityCard` because it owns state and two effects that have
 * nothing to do with rendering an activity: dismissing on an outside click and
 * dismissing on Escape. Both are required — a menu that only closes by picking
 * something is a trap, and one that ignores Escape is a trap for keyboard users
 * specifically.
 *
 * Focus returns to the trigger on close, so dismissing the menu does not drop
 * the user back at the top of the document.
 */
export function ActivityMenu({ label, onSwap, onRemove }: ActivityMenuProps): React.ReactElement {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const close = (): void => {
      setOpen(false);
      triggerRef.current?.focus();
    };

    const handlePointerDown = (event: PointerEvent): void => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-label={t('itinerary.options', { title: label })}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => {
          setOpen((current) => !current);
        }}
        className="rounded-xs p-1.5 text-tertiary opacity-0 transition-opacity group-hover:opacity-100 hover:text-primary focus-visible:opacity-100"
      >
        <IconDots />
      </button>

      {open ? (
        <div
          role="menu"
          className="glass absolute top-9 right-0 z-20 w-44 overflow-hidden rounded-md py-1"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSwap();
            }}
            className="block w-full px-3.5 py-2 text-left text-sm text-secondary transition-colors hover:bg-surface-hover hover:text-primary"
          >
            {t('itinerary.swap')}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onRemove();
            }}
            className="block w-full px-3.5 py-2 text-left text-sm text-danger transition-colors hover:bg-surface-hover"
          >
            {t('itinerary.remove')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
