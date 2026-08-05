import { motion } from 'framer-motion';
import { useId } from 'react';

import { cn } from '@/lib/cn';
import { SPRING } from '@/lib/motion';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** Hides the visible label but keeps it as the accessible name. */
  hideLabel?: boolean;
  description?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Switch, built on a real `role="switch"` button rather than a styled
 * checkbox — screen readers announce "on/off" instead of "checked", which is
 * the correct affordance for something that takes effect immediately.
 *
 * The knob is a spring, not a transition: it is a physical object being
 * pushed from one end to the other.
 */
export function Toggle({
  checked,
  onChange,
  label,
  hideLabel = false,
  description,
  disabled = false,
  className,
}: ToggleProps): React.ReactElement {
  const labelId = useId();
  const descriptionId = useId();

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={description === undefined ? undefined : descriptionId}
        disabled={disabled}
        onClick={() => {
          onChange(!checked);
        }}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-pill p-0.5',
          'transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-expo)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-accent' : 'border border-default bg-surface-hover',
        )}
      >
        <motion.span
          layout
          transition={SPRING}
          className={cn(
            'block size-5 rounded-pill shadow-sm',
            checked ? 'bg-accent-contrast' : 'bg-secondary',
          )}
          style={{ marginLeft: checked ? 'calc(100% - 1.25rem)' : 0 }}
        />
      </button>

      <div className={cn('min-w-0', hideLabel && 'sr-only')}>
        <span id={labelId} className="block text-sm font-medium text-primary">
          {label}
        </span>
        {description === undefined ? null : (
          <span id={descriptionId} className="mt-0.5 block text-sm text-tertiary">
            {description}
          </span>
        )}
      </div>
    </div>
  );
}
