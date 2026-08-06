import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { CITIES } from '@/data/cities';

const COLUMNS = [
  {
    heading: 'footer.product',
    links: [
      { key: 'nav.plan', to: '/plan' },
      { key: 'footer.routeBuilder', to: '/route' },
      { key: 'footer.savedTrips', to: '/saved' },
      { key: 'footer.designSystem', to: '/styleguide' },
    ],
  },
  {
    heading: 'footer.destinations',
    // City names are proper nouns and are not translated; the column heading
    // above it is.
    links: [
      { label: 'Lisbon', to: '/destination/lisbon' },
      { label: 'Tokyo', to: '/destination/tokyo' },
      { label: 'Mexico City', to: '/destination/mexico-city' },
    ],
  },
] as const;

export function SiteFooter(): React.ReactElement {
  const { t } = useTranslation();

  return (
    <footer className="mt-auto border-t border-subtle">
      <div className="container-content grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="text-h3 tracking-[-0.02em] text-primary">{t('common.brand')}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-secondary">
            {t('footer.blurb')}
          </p>
          <p className="mt-6 text-xs text-tertiary">{t('footer.disclaimer')}</p>
        </div>

        {COLUMNS.map((column) => (
          <nav key={column.heading} aria-label={t(column.heading)}>
            <h2 className="eyebrow">{t(column.heading)}</h2>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-secondary underline-offset-4 transition-colors hover:text-primary hover:underline"
                  >
                    {'key' in link ? t(link.key) : link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="container-content flex flex-col gap-2 border-t border-subtle py-6 text-xs text-tertiary sm:flex-row sm:items-center sm:justify-between">
        <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        <p className="tabular">{t('footer.catalogue', { cities: CITIES.length })}</p>
      </div>
    </footer>
  );
}
