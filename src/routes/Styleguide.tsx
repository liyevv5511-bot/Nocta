import { Seo } from '@/app/Seo';
import { ThemeToggle } from '@/features/theme/ThemeToggle';
import { GlassPanel } from '@/features/ui';
import { DURATION, fadeUp, scaleIn, slideInRight } from '@/lib/motion';

import { MotionSample } from './styleguide/MotionSample';
import { PrimitiveGallery } from './styleguide/PrimitiveGallery';
import { SpecRow, StyleguideSection, Swatch } from './styleguide/StyleguideSection';

const SEMANTIC_COLOURS = [
  { name: 'Canvas', variable: '--canvas' },
  { name: 'Surface', variable: '--surface' },
  { name: 'Surface sunken', variable: '--surface-sunken' },
  { name: 'Accent', variable: '--accent' },
  { name: 'Accent alt', variable: '--accent-alt' },
  { name: 'Accent warm', variable: '--accent-warm' },
  { name: 'Success', variable: '--success' },
  { name: 'Warning', variable: '--warning' },
  { name: 'Danger', variable: '--danger' },
] as const;

const TYPE_SCALE = [
  { name: 'Display 1', className: 'text-display-1' },
  { name: 'Display 2', className: 'text-display-2' },
  { name: 'Heading 1', className: 'text-h1' },
  { name: 'Heading 2', className: 'text-h2' },
  { name: 'Heading 3', className: 'text-h3' },
  { name: 'Body large', className: 'text-body-lg' },
  { name: 'Body', className: 'text-body' },
  { name: 'Small', className: 'text-sm' },
] as const;

/**
 * The design system, documented as a route rather than a README.
 *
 * Every swatch reads its value from the live custom property, so switching
 * theme with the control at the top re-renders this page as proof — if a token
 * is wrong in light mode, it is visibly wrong here first.
 */
export function Styleguide(): React.ReactElement {
  return (
    <>
      <Seo
        title="Styleguide"
        description="Every design token, UI primitive and motion variant used in Nocta, documented and live."
        path="/styleguide"
        ogImage="https://nocta.travel/og/styleguide.png"
      />

      <div className="container-content py-14 lg:py-20">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="eyebrow">Design system</p>
            <h1 className="mt-4 text-display-2 text-primary">Every token, live.</h1>
            <p className="mt-4 text-body-lg text-secondary">
              Nothing on this page is a picture of a component. Switch the theme and watch the
              swatches, the glass and the contrast all move together.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <div className="mt-6 divide-y divide-[var(--border-subtle)]">
          {/* ------------------------------------------------------ Colour */}
          <StyleguideSection
            id="colour"
            title="Colour"
            description="Two layers: raw OKLCH ramps, and a semantic layer that swaps per theme. Components only ever reference the semantic names — an ESLint rule fails the build on a raw hex literal."
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {SEMANTIC_COLOURS.map((colour) => (
                <Swatch key={colour.variable} {...colour} />
              ))}
            </div>
          </StyleguideSection>

          {/* -------------------------------------------------- Typography */}
          <StyleguideSection
            id="type"
            title="Typography"
            description="Inter Variable, fluid through clamp() between 360px and 1440px. There is no mobile type stylesheet — every step interpolates. Figures are tabular everywhere."
          >
            <div className="space-y-6">
              {TYPE_SCALE.map((step) => (
                <div key={step.name} className="border-b border-subtle pb-6">
                  <p className="font-mono text-mono-xs text-tertiary">{step.className}</p>
                  <p className={`${step.className} mt-2 text-primary`}>
                    Seven hills, Atlantic light
                  </p>
                </div>
              ))}
            </div>
          </StyleguideSection>

          {/* ------------------------------------------------------ Motion */}
          <StyleguideSection
            id="motion"
            title="Motion"
            description="Three durations, one signature curve. Every variant below is imported from lib/motion.ts — no component declares its own. Enable reduced motion at OS level and all of it collapses to zero."
          >
            <div className="space-y-1">
              <SpecRow label="Fast" value={`${String(DURATION.fast * 1000)}ms`}>
                <MotionSample variants={fadeUp} label="fadeUp" />
              </SpecRow>
              <SpecRow label="Base" value={`${String(DURATION.base * 1000)}ms`}>
                <MotionSample variants={scaleIn} label="scaleIn" />
              </SpecRow>
              <SpecRow label="Slow" value={`${String(DURATION.slow * 1000)}ms`}>
                <MotionSample variants={slideInRight} label="slideInRight" />
              </SpecRow>
              <SpecRow label="House easing" value="cubic-bezier(0.16, 1, 0.3, 1)">
                <p className="text-sm text-secondary">
                  Decisive departure, long soft settle. Nothing in the product animates on linear
                  except infinite ambient loops.
                </p>
              </SpecRow>
            </div>
          </StyleguideSection>

          {/* ------------------------------------------------------- Glass */}
          <StyleguideSection
            id="glass"
            title="Glass"
            description="Four ingredients, all required: blurred and saturated backdrop, an SVG turbulence overlay to kill the plastic look, a gradient hairline border composed with mask-composite, and an inset highlight for thickness. Dark and light carry different opacity, blur and saturation values."
          >
            <div className="aurora-field grid gap-4 rounded-xl p-8 sm:grid-cols-3">
              <GlassPanel radius="lg" className="p-5">
                <p className="font-semibold text-primary">Default</p>
                <p className="mt-1 text-sm text-secondary">24px blur, 180% saturate</p>
              </GlassPanel>
              <GlassPanel tone="strong" radius="lg" className="p-5">
                <p className="font-semibold text-primary">Strong</p>
                <p className="mt-1 text-sm text-secondary">40px blur, higher opacity</p>
              </GlassPanel>
              <GlassPanel tone="sunken" radius="lg" className="p-5">
                <p className="font-semibold text-primary">Sunken</p>
                <p className="mt-1 text-sm text-secondary">Opaque — never stack backdrops</p>
              </GlassPanel>
            </div>
          </StyleguideSection>

          <PrimitiveGallery />
        </div>
      </div>
    </>
  );
}
