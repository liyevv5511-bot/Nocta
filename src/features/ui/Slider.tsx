import { useId, useMemo } from 'react';

import { cn } from '@/lib/cn';

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  /** Rendered next to the label — e.g. the formatted currency amount. */
  displayValue: string;
  /** Optional tick captions under the track (min / mid / max). */
  scale?: readonly string[];
  disabled?: boolean;
  className?: string;
}

/**
 * Range input.
 *
 * Built on a native `<input type="range">`, styled rather than replaced. A
 * div-based slider has to reimplement keyboard stepping, page-up/down, RTL,
 * and the drag model, and gets at least one of them wrong. The only visual
 * work here is painting the filled portion of the track from a CSS variable
 * the component keeps in sync with the value.
 */
export function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  displayValue,
  scale,
  disabled = false,
  className,
}: SliderProps): React.ReactElement {
  const id = useId();
  const percent = useMemo(() => {
    if (max === min) return 0;
    return ((value - min) / (max - min)) * 100;
  }, [value, min, max]);

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm font-medium text-secondary">
          {label}
        </label>
        <output htmlFor={id} className="tabular text-body font-semibold text-primary">
          {displayValue}
        </output>
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          onChange(Number(event.target.value));
        }}
        style={{ '--slider-fill': `${String(percent)}%` } as React.CSSProperties}
        className={cn(
          'h-6 w-full cursor-grab appearance-none bg-transparent active:cursor-grabbing',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Track
          '[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-pill',
          '[&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,var(--accent)_var(--slider-fill),var(--surface-hover)_var(--slider-fill))]',
          '[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-pill [&::-moz-range-track]:bg-surface-hover',
          '[&::-moz-range-progress]:h-1.5 [&::-moz-range-progress]:rounded-pill [&::-moz-range-progress]:bg-accent',
          // Thumb
          '[&::-webkit-slider-thumb]:-mt-[0.3125rem] [&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:rounded-pill',
          '[&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md',
          '[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-[var(--duration-fast)]',
          'hover:[&::-webkit-slider-thumb]:scale-115 active:[&::-webkit-slider-thumb]:scale-95',
          '[&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-pill [&::-moz-range-thumb]:border-0',
          '[&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-md',
        )}
      />

      {scale === undefined ? null : (
        <div className="tabular mt-1.5 flex justify-between text-xs text-tertiary">
          {scale.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
      )}
    </div>
  );
}
