import { useTranslation } from 'react-i18next';

import { CITIES } from '@/data/cities';
import { Accordion, type AccordionItem } from '@/features/ui';

/**
 * The FAQ.
 *
 * Answers come from the dictionary rather than JSX, which is why the first
 * question needs a second paragraph key: a translator should be handed
 * paragraphs, not asked to embed markup in a string.
 */
export function Faq(): React.ReactElement {
  const { t } = useTranslation();

  const items: AccordionItem[] = [
    {
      id: 'real-ai',
      question: t('faq.items.realAi.question'),
      answer: (
        <>
          <p>{t('faq.items.realAi.answer')}</p>
          <p className="mt-3">{t('faq.items.realAi.answerTwo')}</p>
        </>
      ),
    },
    {
      id: 'cities',
      question: t('faq.items.cities.question', { count: CITIES.length }),
      answer: <p>{t('faq.items.cities.answer')}</p>,
    },
    {
      id: 'data',
      question: t('faq.items.data.question'),
      answer: <p>{t('faq.items.data.answer')}</p>,
    },
    {
      id: 'accuracy',
      question: t('faq.items.accuracy.question'),
      answer: <p>{t('faq.items.accuracy.answer')}</p>,
    },
    {
      id: 'motion',
      question: t('faq.items.motion.question'),
      answer: <p>{t('faq.items.motion.answer')}</p>,
    },
    {
      id: 'offline',
      question: t('faq.items.offline.question'),
      answer: <p>{t('faq.items.offline.answer')}</p>,
    },
    {
      id: 'language',
      question: t('faq.items.language.question'),
      answer: <p>{t('faq.items.language.answer')}</p>,
    },
  ];

  return (
    <section aria-labelledby="faq-heading" className="section-y">
      <div className="container-content grid gap-12 lg:grid-cols-[20rem_1fr] lg:gap-20">
        <div>
          <p className="eyebrow">{t('faq.eyebrow')}</p>
          <h2 id="faq-heading" className="mt-4 text-display-2 text-primary">
            {t('faq.heading')}
          </h2>
        </div>

        <Accordion items={items} mode="single" defaultOpenId="real-ai" />
      </div>
    </section>
  );
}
