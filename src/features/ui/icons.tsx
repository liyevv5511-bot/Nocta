/**
 * Inline icon set.
 *
 * Icons live here rather than in a dependency because the product needs about
 * a dozen of them, and a dozen 24×24 paths is roughly 2kb — against 40kb+ for
 * any icon library, most of which would be tree-shaken away and the rest of
 * which would still be a version to keep current.
 *
 * All of them inherit `currentColor` and size from the `className` the caller
 * passes, and all are `aria-hidden`: an icon that carries meaning is paired
 * with a visible label or an `aria-label` on its control, never announced
 * twice.
 */

interface IconProps {
  className?: string;
}

function Icon({
  className = 'size-4',
  children,
  fill = 'none',
}: IconProps & { children: React.ReactNode; fill?: string }): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={fill}
      stroke={fill === 'none' ? 'currentColor' : 'none'}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconWalk({ className = 'size-3' }: IconProps): React.ReactElement {
  return (
    <Icon className={className}>
      <circle cx="13" cy="4.5" r="1.75" strokeWidth="1.75" />
      <path
        d="M9 21l2.5-5.5L9 12l1-4 3.5 2 2.5 1M11.5 15.5L15 21"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  );
}

export function IconGrip({ className = 'size-4' }: IconProps): React.ReactElement {
  return (
    <Icon className={className} fill="currentColor">
      <circle cx="9" cy="6" r="1.4" />
      <circle cx="15" cy="6" r="1.4" />
      <circle cx="9" cy="12" r="1.4" />
      <circle cx="15" cy="12" r="1.4" />
      <circle cx="9" cy="18" r="1.4" />
      <circle cx="15" cy="18" r="1.4" />
    </Icon>
  );
}

export function IconDots({ className = 'size-4' }: IconProps): React.ReactElement {
  return (
    <Icon className={className} fill="currentColor">
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </Icon>
  );
}

export function IconClose({ className = 'size-4' }: IconProps): React.ReactElement {
  return (
    <Icon className={className}>
      <path d="M6 6l12 12M18 6L6 18" strokeWidth="1.75" strokeLinecap="round" />
    </Icon>
  );
}

export function IconCheck({ className = 'size-4' }: IconProps): React.ReactElement {
  return (
    <Icon className={className}>
      <path d="M5 12.5l4.5 4.5L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  );
}

export function IconPlus({ className = 'size-4' }: IconProps): React.ReactElement {
  return (
    <Icon className={className}>
      <path d="M12 5v14M5 12h14" strokeWidth="1.75" strokeLinecap="round" />
    </Icon>
  );
}
