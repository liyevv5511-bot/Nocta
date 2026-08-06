import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Seo } from '@/app/Seo';

export function NotFound(): React.ReactElement {
  const { t } = useTranslation();

  return (
    <>
      <Seo title="Page not found" description="That page does not exist." path="/404" noIndex />

      <div className="container-content grid min-h-[70svh] place-items-center py-20">
        <div className="max-w-lg text-center">
          <p className="eyebrow">{t('notFound.eyebrow')}</p>
          <h1 className="mt-3 text-display-2 text-primary">{t('notFound.heading')}</h1>
          <p className="mt-4 text-body-lg text-secondary">{t('notFound.body')}</p>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              to="/"
              className="inline-flex h-12 items-center rounded-md bg-accent px-6 font-medium text-accent-contrast transition-colors hover:bg-accent-hover"
            >
              {t('common.backHome')}
            </Link>
            <Link
              to="/plan"
              className="inline-flex h-12 items-center rounded-md border border-default px-6 font-medium text-primary transition-colors hover:bg-surface-hover"
            >
              {t('nav.plan')}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
