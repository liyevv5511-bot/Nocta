import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

import { ThemeToggle } from '@/features/theme/ThemeToggle';
import { cn } from '@/lib/cn';
import { transition } from '@/lib/motion';

const NAV = [
  { to: '/plan', label: 'Plan a trip' },
  { to: '/route', label: 'Route' },
  { to: '/saved', label: 'Saved' },
  { to: '/styleguide', label: 'Styleguide' },
] as const;

/**
 * Site header.
 *
 * Transparent over the hero and glass once scrolled — the switch is driven by
 * a `useScroll` subscription rather than a scroll listener with `setState`,
 * so it does not re-render on every frame. Only the crossing of the threshold
 * commits to React state.
 */
export function SiteHeader(): React.ReactElement {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useMotionValueEvent(scrollY, 'change', (value) => {
    const next = value > 24;
    setScrolled((current) => (current === next ? current : next));
  });

  return (
    <header
      className={cn(
        'sticky top-0 w-full transition-[background-color,border-color,backdrop-filter]',
        'duration-[var(--duration-base)] ease-[var(--ease-out-expo)]',
        scrolled ? 'glass border-b border-subtle' : 'border-b border-transparent bg-transparent',
      )}
      style={{ zIndex: 'var(--z-header)' }}
    >
      <div className="container-content flex h-16 items-center justify-between gap-6">
        <Link to="/" className="group flex items-center gap-2.5" aria-label="Nocta — home">
          <Wordmark />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'relative rounded-sm px-3.5 py-2 text-sm font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-secondary hover:text-primary',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive ? (
                    <motion.span
                      layoutId="nav-underline"
                      transition={transition.base}
                      className="absolute inset-x-3.5 -bottom-px h-px bg-accent"
                    />
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <ThemeToggle className="hidden sm:inline-flex" />
          <Link
            to="/plan"
            className="hidden h-9 items-center rounded-sm bg-accent px-3.5 text-sm font-medium text-accent-contrast transition-colors hover:bg-accent-hover sm:inline-flex"
          >
            Start planning
          </Link>

          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => {
              setMenuOpen((open) => !open);
            }}
            className="grid size-10 place-items-center rounded-sm text-secondary md:hidden"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" strokeWidth="1.75" strokeLinecap="round" />
              ) : (
                <path d="M4 8h16M4 16h16" strokeWidth="1.75" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            id="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transition.base}
            className="overflow-hidden border-t border-subtle bg-canvas md:hidden"
          >
            <nav aria-label="Mobile" className="container-content flex flex-col gap-1 py-4">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => {
                    setMenuOpen(false);
                  }}
                  className={({ isActive }) =>
                    cn(
                      'rounded-sm px-3 py-3 text-body font-medium',
                      isActive ? 'bg-surface-hover text-primary' : 'text-secondary',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="mt-3 flex items-center justify-between border-t border-subtle pt-4">
                <span className="text-sm text-tertiary">Theme</span>
                <ThemeToggle />
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Route-change announcement for assistive tech. */}
      <span aria-live="polite" className="sr-only">
        {location.pathname}
      </span>
    </header>
  );
}

function Wordmark(): React.ReactElement {
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true">
        <rect width="32" height="32" rx="8" className="fill-[var(--surface-hover)]" />
        <path
          d="M10 22V10l12 12V10"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-body-lg font-semibold tracking-[-0.03em] text-primary">Nocta</span>
    </span>
  );
}
