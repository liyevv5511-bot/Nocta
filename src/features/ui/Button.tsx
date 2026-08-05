import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';

import { cn } from '@/lib/cn';
import { pressable, transition } from '@/lib/motion';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'glass' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-accent-contrast shadow-md hover:bg-accent-hover disabled:hover:bg-accent',
  secondary:
    'bg-surface text-primary border border-default hover:bg-surface-hover disabled:hover:bg-surface',
  ghost: 'bg-transparent text-secondary hover:bg-surface-hover hover:text-primary',
  glass: 'glass rounded-[inherit] text-primary hover:bg-[var(--glass-bg-strong)]',
  danger: 'bg-danger text-inverse hover:opacity-90',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5 rounded-sm',
  md: 'h-11 px-5 text-body gap-2 rounded-md',
  lg: 'h-14 px-7 text-body-lg gap-2.5 rounded-lg',
};

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders a spinner and blocks interaction without changing layout width. */
  loading?: boolean;
  iconStart?: React.ReactNode;
  iconEnd?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

/**
 * The button.
 *
 * Notes on the details that are easy to get wrong:
 *  - `loading` keeps the label mounted at `opacity-0` so the button does not
 *    resize mid-interaction, which is what causes layout shift in a form.
 *  - `aria-busy` and `aria-disabled` are set instead of only `disabled`, so a
 *    screen reader announces *why* the control stopped responding.
 *  - focus ring comes from the global `:focus-visible` rule; it is not
 *    re-declared per variant, which is how rings end up inconsistent.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    iconStart,
    iconEnd,
    fullWidth = false,
    className,
    children,
    disabled,
    ...props
  },
  ref,
) {
  const isDisabled = disabled === true || loading;

  return (
    <motion.button
      ref={ref}
      type="button"
      disabled={isDisabled}
      aria-busy={loading}
      aria-disabled={isDisabled}
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden select-none',
        'font-medium tracking-[-0.01em] whitespace-nowrap',
        'transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out-expo)]',
        'disabled:cursor-not-allowed disabled:opacity-55',
        SIZES[size],
        VARIANTS[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...(isDisabled ? {} : pressable)}
      transition={transition.fast}
      {...props}
    >
      <span
        className={cn(
          'inline-flex items-center gap-[inherit]',
          loading && 'pointer-events-none opacity-0',
        )}
      >
        {iconStart}
        {children}
        {iconEnd}
      </span>

      {loading ? (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner />
        </span>
      ) : null}
    </motion.button>
  );
});

function Spinner(): React.ReactElement {
  return (
    <svg
      className="size-[1.15em] animate-spin motion-reduce:animate-none"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
