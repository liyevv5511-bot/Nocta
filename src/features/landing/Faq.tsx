import { Accordion, type AccordionItem } from '@/features/ui';

const ITEMS: AccordionItem[] = [
  {
    id: 'real-ai',
    question: 'Is this actually calling a language model?',
    answer: (
      <>
        <p>
          No — and the architecture is built so that it could, with one file changed. The planner is
          a local Express service that scores a hand-researched venue catalogue against your moods,
          budget and pace, then streams the result back over Server-Sent Events.
        </p>
        <p className="mt-3">
          Both sides share one Zod schema. Swapping in a real model means handing that schema to it
          as a structured-output contract and forwarding its days as the same stream frames. The
          client, the validation and the entire UI stay exactly as they are.
        </p>
      </>
    ),
  },
  {
    id: 'cities',
    question: 'Why only eight cities?',
    answer: (
      <p>
        Because every venue in here was written by hand with a real address, real coordinates, a
        real duration and a real reason to be on the list. Eight cities of that is worth more than
        eight hundred cities of scraped listings — and it is the only way the walking times between
        stops can be honest.
      </p>
    ),
  },
  {
    id: 'data',
    question: 'Where do my trips go?',
    answer: (
      <p>
        Into your browser’s local storage, under a versioned schema with a real migration path.
        There is no account, no server-side copy and no analytics on your itineraries. Clearing site
        data deletes them permanently, which is a trade-off stated here rather than buried.
      </p>
    ),
  },
  {
    id: 'accuracy',
    question: 'How accurate are the prices and opening hours?',
    answer: (
      <p>
        Prices are typical per-person figures at the time of writing and will drift. Opening
        constraints that genuinely change a plan — market days, Monday closures, mandatory advance
        booking — are attached to the venues they affect and surface on the card. Nothing here is a
        booking system, so always check before you rely on it.
      </p>
    ),
  },
  {
    id: 'motion',
    question: 'Can I turn the animation off?',
    answer: (
      <p>
        It is already off if your system says so. <code>prefers-reduced-motion</code> disables the
        smooth-scroll layer entirely, stops the globe, skips every scroll-triggered timeline and
        collapses component transitions to zero — enforced globally through Framer’s{' '}
        <code>MotionConfig</code>, so a component that forgets to check still behaves.
      </p>
    ),
  },
  {
    id: 'offline',
    question: 'What happens if the planner is unreachable?',
    answer: (
      <p>
        Generation fails into an explicit error state with a retry, rather than an endless spinner —
        including a distinct message for being offline. Saved trips are read from local storage and
        stay fully browsable and editable with no network at all.
      </p>
    ),
  },
];

export function Faq(): React.ReactElement {
  return (
    <section aria-labelledby="faq-heading" className="section-y">
      <div className="container-content grid gap-12 lg:grid-cols-[20rem_1fr] lg:gap-20">
        <div>
          <p className="eyebrow">FAQ</p>
          <h2 id="faq-heading" className="mt-4 text-display-2 text-primary">
            The obvious questions.
          </h2>
        </div>

        <Accordion items={ITEMS} mode="single" defaultOpenId="real-ai" />
      </div>
    </section>
  );
}
