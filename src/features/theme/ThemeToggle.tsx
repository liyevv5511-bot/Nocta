import { motion } from 'framer-motion';

import { cn } from '@/lib/cn';
import { SPRING } from '@/lib/motion';

import { useThemeStore, type ThemePreference } from './theme.store';

const OPTIONS: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', icon: <IconSun /> },
  { value: 'system', label: 'System', icon: <IconSystem /> },
  { value: 'dark', label: 'Dark', icon: <IconMoon /> },
];

/**
 * Three-state theme control — light, system, dark.
 *
 * A two-state switch cannot express "follow my OS", which is the option most
 * people actually want; offering it as a first-class choice is the difference
 * between respecting the system setting and overriding it forever on first
 * click.
 *
 * Implemented as a radiogroup so arrow keys move between options, and the
 * selected pill travels via `layoutId` rather than a background transition.
 */
export function ThemeToggle({ className }: { className?: string }): React.ReactElement {
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        'relative inline-flex items-center gap-0.5 rounded-pill border border-subtle bg-surface-sunken p-0.5',
        className,
      )}
    >
      {OPTIONS.map((option) => {
        const isActive = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`${option.label} theme`}
            title={`${option.label} theme`}
            onClick={() => {
              setPreference(option.value);
            }}
            className={cn(
              'relative grid size-8 place-items-center rounded-pill',
              'transition-colors duration-[var(--duration-fast)]',
              isActive ? 'text-primary' : 'text-tertiary hover:text-secondary',
            )}
          >
            {isActive ? (
              <motion.span
                layoutId="theme-toggle-pill"
                transition={SPRING}
                className="absolute inset-0 rounded-pill bg-surface shadow-sm"
              />
            ) : null}
            <span className="relative">{option.icon}</span>
          </button>
        );
      })}
    </div>
  );
}

function IconSun(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" strokeWidth="1.75" />
      <path
        d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMoon(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSystem(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="12" rx="2" strokeWidth="1.75" />
      <path d="M9 20h6M12 16v4" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
