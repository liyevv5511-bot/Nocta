import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { SPRING } from '@/lib/motion';

export interface ChipProps {
  children: ReactNode;
  /** Present ⇒ the chip is a toggle. Absent ⇒ it is a static label. */
  selected?: boolean;
  onToggle?: (next: boolean) => void;
  icon?: ReactNode;
  size?: 'sm' | 'md';
  className?: string;
  disabled?: boolean;
}

/**
 * Chip — used both as a selectable filter (the mood picker) and as a static
 * tag (activity tags on cards). The interactive form gets a `checkbox` role
 * with `aria-checked`, because that is what it behaves like; the static form
 * renders a plain `span` and stays out of the tab order entirely.
 *
 * The selected background is a `layoutId`-free spring on scale rather than a
 * colour crossfade, so a rapid multi-select feels responsive rather than laggy.
 */
export function Chip({
  children,
  selected,
  onToggle,
  icon,
  size = 'md',
  className,
  disabled = false,
}: ChipProps): React.ReactElement {
  const base = cn(
    'inline-flex items-center gap-1.5 rounded-pill border font-medium whitespace-nowrap',
    'transition-[background-color,border-color,color] duration-[var(--duration-fast)] ease-[var(--ease-out-expo)]',
    size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-9 px-4 text-sm',
    className,
  );

  if (onToggle === undefined) {
    return (
      <span className={cn(base, 'border-subtle bg-surface-sunken text-tertiary')}>
        {icon}
        {children}
      </span>
    );
  }

  const isSelected = selected === true;

  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={isSelected}
      disabled={disabled}
      onClick={() => {
        onToggle(!isSelected);
      }}
      whileTap={{ scale: 0.95 }}
      transition={SPRING}
      className={cn(
        base,
        'cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
        isSelected
          ? 'border-accent bg-accent-muted text-accent'
          : 'border-default bg-transparent text-secondary hover:border-strong hover:text-primary',
      )}
    >
      {icon}
      {children}
    </motion.button>
  );
}
