import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';

import { SUPPORTED_LANGUAGES, changeLanguage, isLanguage } from './index';

/**
 * Language picker.
 *
 * A native `<select>`, not a custom menu. Three options with no icons, no
 * search and no grouping is exactly what the platform control is for: it gets
 * keyboard behaviour, the OS picker on mobile, and correct announcement for
 * free, and every custom version of it is a worse version of it.
 *
 * Each option is written in its own language — a visitor looking for Русский
 * is not looking for "Russian".
 */
export function LanguageToggle({ className }: { className?: string }): React.ReactElement {
  const { t, i18n } = useTranslation();
  const current = isLanguage(i18n.language) ? i18n.language : 'en';

  return (
    <label className={cn('relative inline-flex items-center', className)}>
      <span className="sr-only">{t('language.label')}</span>

      <select
        value={current}
        onChange={(event) => {
          const next = event.target.value;
          if (isLanguage(next)) void changeLanguage(next);
        }}
        className="h-9 cursor-pointer appearance-none rounded-pill border border-subtle bg-surface-sunken py-0 pr-8 pl-3.5 text-sm font-medium text-secondary transition-colors hover:text-primary"
      >
        {SUPPORTED_LANGUAGES.map((language) => (
          <option key={language} value={language}>
            {t(`language.${language}`)}
          </option>
        ))}
      </select>

      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="pointer-events-none absolute right-3 size-3.5 text-tertiary"
        fill="none"
        stroke="currentColor"
      >
        <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  );
}
