import { useRef } from 'react';

import { gsap, useGsapContext } from '@/lib/useGsapScroll';

const STEPS = [
  {
    number: '01',
    title: 'Describe the trip, not the itinerary',
    body: 'A city, how many days, what you are in the mood for, and what you are willing to spend per day. Five inputs. No forms about airport preferences.',
  },
  {
    number: '02',
    title: 'Watch it get built',
    body: 'The planner streams its work back as it goes — which venues it is reading, how it is weighting your moods, where it is optimising the walking. Days arrive one at a time, not as a spinner that ends in a wall of text.',
  },
  {
    number: '03',
    title: 'Argue with it',
    body: 'Drag activities into a different order and the day re-times around them, walking legs included. Swap anything you do not like for a real alternative. Save it, share it, print it.',
  },
] as const;

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
  const root = useRef<HTMLElement>(null);

  useGsapContext(root, () => {
    const steps = gsap.utils.toArray<HTMLElement>('[data-step]');

    steps.forEach((step) => {
      gsap.fromTo(
        step,
        { opacity: 0.25, y: 40 },
        {
          opacity: 1,
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
          <p className="eyebrow">How it works</p>
          <h2 id="how-heading" className="mt-4 text-display-2 text-primary">
            Three steps, and one of them is optional.
          </h2>
          <p className="mt-5 max-w-sm text-body-lg text-secondary">
            Most planners hand you a wall of suggestions and call it an itinerary. This one commits
            to a schedule, shows its reasoning, and then lets you take it apart.
          </p>
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

          {STEPS.map((step) => (
            <li key={step.number} data-step className="lg:pl-10">
              <p className="font-mono text-mono-xs tracking-[0.09em] text-accent">{step.number}</p>
              <h3 className="mt-3 text-h1 text-primary">{step.title}</h3>
              <p className="mt-4 max-w-prose text-body-lg text-secondary">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
