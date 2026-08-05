import { motion } from 'framer-motion';

import { GlassPanel } from '@/features/ui';
import { fadeUp, inViewport, stagger } from '@/lib/motion';

/**
 * Testimonials.
 *
 * These are written as what the product would want to be said about it, and
 * labelled as such — a portfolio piece inventing named customers with
 * headshots is a small lie that undermines everything honest around it. The
 * section still does its job: it states the value proposition in a voice
 * other than the marketing copy's.
 */
const NOTES = [
  {
    quote:
      'The walking times are the thing. Every other planner hands you five places across a city and lets you discover at 3pm that two of them are forty minutes apart.',
    attribution: 'The problem this was built to solve',
  },
  {
    quote:
      'Watching it work — "reading 14 venues in Lisbon", "optimising walking routes" — makes the wait feel like progress instead of a loading bar lying to you.',
    attribution: 'Why generation streams',
  },
  {
    quote:
      'A plan you cannot rearrange is a suggestion. Dragging an activity and watching the whole day re-time around it is the moment it stops being a document.',
    attribution: 'Why drag-and-drop re-times',
  },
] as const;

export function Testimonials(): React.ReactElement {
  return (
    <section aria-labelledby="notes-heading" className="section-y">
      <div className="container-content">
        <p className="eyebrow">Design notes</p>
        <h2 id="notes-heading" className="mt-4 max-w-2xl text-display-2 text-primary">
          Three decisions worth defending.
        </h2>
        <p className="mt-5 max-w-prose text-body-lg text-secondary">
          No invented customers here. These are the arguments the product is actually making — which
          is what a testimonial section is trying to be a proxy for anyway.
        </p>

        <motion.ul
          variants={stagger(0.08)}
          initial="hidden"
          whileInView="visible"
          viewport={inViewport}
          className="mt-14 grid gap-5 lg:grid-cols-3"
        >
          {NOTES.map((note) => (
            <motion.li key={note.attribution} variants={fadeUp}>
              <GlassPanel radius="xl" className="flex h-full flex-col justify-between p-7">
                <blockquote className="text-body-lg leading-relaxed text-primary">
                  <p>{note.quote}</p>
                </blockquote>
                <p className="mt-6 border-t border-subtle pt-5 text-sm text-tertiary">
                  {note.attribution}
                </p>
              </GlassPanel>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
