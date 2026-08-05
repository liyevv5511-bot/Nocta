import { motion } from 'framer-motion';

import { GlassPanel } from '@/features/ui';
import { cn } from '@/lib/cn';
import { fadeUp, inViewport, stagger } from '@/lib/motion';

interface Feature {
  title: string;
  body: string;
  span: string;
  figure?: React.ReactNode;
}

const FEATURES: Feature[] = [
  {
    title: 'Walking times, computed',
    body: 'Every leg between two activities is a real haversine distance at a real walking pace. Reorder the day and they all recalculate — including the ones that quietly become a metro ride.',
    span: 'sm:col-span-2 sm:row-span-2',
    figure: <WalkFigure />,
  },
  {
    title: 'Streamed, not spun',
    body: 'Days arrive one at a time over SSE, each validated against the schema before it reaches the screen.',
    span: 'sm:col-span-2',
  },
  {
    title: 'Drag anything',
    body: 'Keyboard-operable reordering with dnd-kit. The day re-times around whatever you move.',
    span: '',
  },
  {
    title: 'Swap it',
    body: 'Every block offers real alternatives from the same city, filtered to your budget.',
    span: '',
  },
  {
    title: 'Yours, locally',
    body: 'Trips persist in your browser under a versioned schema with a real migration path. No account, no server copy.',
    span: 'sm:col-span-2',
  },
];

/**
 * Bento grid.
 *
 * Deliberately not a uniform card grid: the spans are assigned by how much
 * each feature has to say, so the layout carries a hierarchy instead of
 * flattening five unequal things into five equal boxes.
 */
export function BentoFeatures(): React.ReactElement {
  return (
    <section aria-labelledby="features-heading" className="section-y">
      <div className="container-content">
        <p className="eyebrow">What it actually does</p>
        <h2 id="features-heading" className="mt-4 max-w-2xl text-display-2 text-primary">
          The parts most planners skip.
        </h2>

        <motion.div
          variants={stagger(0.07)}
          initial="hidden"
          whileInView="visible"
          viewport={inViewport}
          className="mt-14 grid auto-rows-[minmax(11rem,auto)] gap-4 sm:grid-cols-4"
        >
          {FEATURES.map((feature) => (
            <motion.div key={feature.title} variants={fadeUp} className={cn(feature.span)}>
              <GlassPanel radius="xl" className="flex h-full flex-col justify-between p-6">
                <div>
                  <h3 className="text-h3 text-primary">{feature.title}</h3>
                  <p className="mt-3 text-body text-secondary">{feature.body}</p>
                </div>
                {feature.figure}
              </GlassPanel>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/** A small, honest diagram — three stops and the legs between them. */
function WalkFigure(): React.ReactElement {
  const stops = [
    { label: 'Miradouro da Senhora do Monte', time: '09:00' },
    { label: 'Feira da Ladra', time: '10:05', walk: '9 min' },
    { label: 'Time Out Market', time: '12:30', walk: '21 min' },
  ];

  return (
    <ol className="mt-8 space-y-0" aria-label="Example day fragment">
      {stops.map((stop, index) => (
        <li key={stop.label}>
          {stop.walk === undefined ? null : (
            <div className="ml-[3.25rem] flex items-center gap-2 py-1.5 text-mono-xs tracking-[0.09em] text-tertiary uppercase">
              <span className="h-4 w-px bg-[var(--border-default)]" />
              {stop.walk} on foot
            </div>
          )}
          <div className="flex items-center gap-3">
            <time className="tabular w-12 shrink-0 text-sm font-semibold text-primary">
              {stop.time}
            </time>
            <span
              aria-hidden="true"
              className={cn(
                'size-2 shrink-0 rounded-pill',
                index === 0 ? 'bg-accent' : 'bg-[var(--border-strong)]',
              )}
            />
            <span className="min-w-0 truncate text-sm text-secondary">{stop.label}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
