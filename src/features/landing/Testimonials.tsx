import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

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

export function Testimonials(): React.ReactElement {
  const { t } = useTranslation();
  const notes = t('notes.items', { returnObjects: true });

  return (
    <section aria-labelledby="notes-heading" className="section-y">
      <div className="container-content">
        <p className="eyebrow">{t('notes.eyebrow')}</p>
        <h2 id="notes-heading" className="mt-4 max-w-2xl text-display-2 text-primary">
          {t('notes.heading')}
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
          {notes.map((note) => (
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
