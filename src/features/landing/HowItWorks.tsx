import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useGsapContext } from '@/lib/useGsapScroll';

/**
 * Pinned scroll section.
 *
 * The heading column pins while the steps scroll past it, and each step
 * brightens as it enters the band. This is the one place in the product where
 * scroll drives a timeline rather than a trigger — the effect is worth the
 * complexity precisely once.
 *
 * Everything is built inside a `gsap.context` scoped to the section root, so
 * teardown is total. Nothing here is registered globally.
 */
export function HowItWorks(): React.ReactElement {
  const { t } = useTranslation();
  const root = useRef<HTMLElement>(null);
  const steps = t('howItWorks.steps', { returnObjects: true });

  useGsapContext(root, (gsap) => {
    const steps = gsap.utils.toArray<HTMLElement>('[data-step]');

    steps.forEach((step) => {
      // Position only, no opacity.
      //
      // Contrast is computed on the *composited* colour, so a paragraph at 55%
      // opacity over a light canvas measures 2.6:1 however good the token is —
      // a real failure, not a scoring quirk, and one a reader who never
      // scrolls that far never recovers from. Sliding into place reads as a
      // reveal without ever making the text harder to read.
      gsap.fromTo(
        step,
        { y: 40 },
        {
          y: 0,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: step,
            start: 'top 78%',
            end: 'top 45%',
            scrub: 0.6,
          },
        },
      );
    });

    // The progress rail fills with scroll through the whole section.
    gsap.fromTo(
      '[data-rail-fill]',
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top 60%',
          end: 'bottom 80%',
          scrub: true,
        },
      },
    );
  });

  return (
    <section
      ref={root}
      id="how-it-works"
      aria-labelledby="how-heading"
      className="section-y scroll-mt-20"
    >
      <div className="container-content grid gap-12 lg:grid-cols-[22rem_1fr] lg:gap-20">
        <div data-pin className="lg:sticky lg:top-32 lg:h-fit">
          <p className="eyebrow">{t('howItWorks.eyebrow')}</p>
          <h2 id="how-heading" className="mt-4 text-display-2 text-primary">
            {t('howItWorks.heading')}
          </h2>
          <p className="mt-5 max-w-sm text-body-lg text-secondary">{t('howItWorks.body')}</p>
        </div>

        <ol className="relative space-y-16 lg:space-y-28">
          <span
            aria-hidden="true"
            className="absolute top-2 left-0 hidden h-full w-px bg-[var(--border-subtle)] lg:block"
          >
            <span
              data-rail-fill
              className="absolute inset-0 origin-top bg-accent"
              style={{ transform: 'scaleY(0)' }}
            />
          </span>

          {steps.map((step, index) => (
            <li key={step.title} data-step className="lg:pl-10">
              <p className="font-mono text-mono-xs tracking-[0.09em] text-accent">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h3 className="mt-3 text-h1 text-primary">{step.title}</h3>
              <p className="mt-4 max-w-prose text-body-lg text-secondary">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
