import { forwardRef, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

export type GlassTone = 'default' | 'strong' | 'sunken';
export type GlassRadius = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const TONES: Record<GlassTone, string> = {
  default: 'glass',
  strong: 'glass glass-strong',
  // Sunken surfaces sit *inside* glass; stacking two backdrop-filters is both
  // expensive and visually muddy, so this one is opaque by design.
  sunken: 'bg-surface-sunken border border-subtle',
};

const RADII: Record<GlassRadius, string> = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
};

export interface GlassPanelProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** Renders as any element — `section`, `form`, `article`, `aside`. */
  as?: ElementType;
  tone?: GlassTone;
  radius?: GlassRadius;
  children?: ReactNode;
}

/**
 * The glass surface primitive.
 *
 * The material itself is defined once, in `globals.css`, as the `.glass`
 * utility — blur, saturation, turbulence overlay, masked gradient border and
 * inset highlight. This component's only job is to apply it consistently and
 * to keep the radius on the element that also owns the pseudo-element border,
 * which is the detail that breaks when glass is hand-rolled per component.
 */
export const GlassPanel = forwardRef<HTMLElement, GlassPanelProps>(function GlassPanel(
  { as: Tag = 'div', tone = 'default', radius = 'lg', className, children, ...rest },
  ref,
) {
  const Component = Tag;

  return (
    <Component ref={ref} className={cn(TONES[tone], RADII[radius], className)} {...rest}>
      {children}
    </Component>
  );
});
