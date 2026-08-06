import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/features/ui';

/**
 * Shown while a route chunk is in flight.
 *
 * Deliberately not a spinner. A spinner communicates "waiting"; this
 * communicates "a page with a heading and content is arriving", which is both
 * more honest and stops the viewport from collapsing to zero height and back
 * — the collapse is a layout shift the Core Web Vitals budget cannot afford.
 */
export function RouteFallback(): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div
      className="container-content min-h-[70svh] py-24"
      role="status"
      aria-label={t('loading.page')}
    >
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-4/5" />
        <div className="space-y-2.5 pt-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
      <span className="sr-only">{t('loading.ellipsis')}</span>
    </div>
  );
}
