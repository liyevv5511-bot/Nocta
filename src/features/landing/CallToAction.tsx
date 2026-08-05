import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import { GlassPanel } from '@/features/ui';
import { fadeUp, inViewport } from '@/lib/motion';

export function CallToAction(): React.ReactElement {
  return (
    <section aria-labelledby="cta-heading" className="section-y">
      <div className="container-content">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={inViewport}>
          <GlassPanel radius="2xl" tone="strong" className="relative overflow-hidden p-10 sm:p-16">
            <div
              aria-hidden="true"
              className="aurora-field animate-drift absolute inset-0 -z-10 opacity-60"
            />

            <div className="max-w-2xl">
              <h2 id="cta-heading" className="text-display-2 text-primary">
                Pick a city. It takes about eight seconds.
              </h2>
              <p className="mt-5 text-body-lg text-secondary">
                No account, no email, no funnel. The plan appears, and then you argue with it until
                it is yours.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  to="/plan"
                  data-magnetic
                  className="inline-flex h-14 items-center rounded-lg bg-accent px-8 text-body-lg font-medium text-accent-contrast transition-colors hover:bg-accent-hover"
                >
                  Plan a trip
                </Link>
                <Link
                  to="/styleguide"
                  data-magnetic
                  className="inline-flex h-14 items-center rounded-lg border border-default px-8 text-body-lg font-medium text-primary transition-colors hover:bg-surface-hover"
                >
                  See the design system
                </Link>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </section>
  );
}
