import { useTranslation } from 'react-i18next';

import { CITIES } from '@/data/cities';
import { GlassPanel } from '@/features/ui';

/**
 * Shown before anything has been generated.
 *
 * Deliberately not a blank panel with an arrow: it states what the planner
 * will actually produce, so the empty state sells the feature rather than
 * apologising for the absence of one.
 */
export function EmptyState(): React.ReactElement {
  const { t } = useTranslation();

  return (
    <GlassPanel radius="xl" className="p-10 text-center">
      <p className="text-h2 text-primary">{t('plan.emptyHeading')}</p>
      <p className="mx-auto mt-4 max-w-prose text-body-lg text-secondary">{t('plan.emptyBody')}</p>
      <p className="mt-6 text-sm text-tertiary">{t('plan.emptyNote', { count: CITIES.length })}</p>
    </GlassPanel>
  );
}
