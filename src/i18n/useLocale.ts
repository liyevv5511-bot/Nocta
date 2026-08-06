import { useTranslation } from 'react-i18next';

import type { SupportedLocale } from '@/lib/format';

import { isLanguage } from './index';

/**
 * The locale to format numbers, currency and dates with.
 *
 * `lib/format.ts` has taken a locale since the day it was written, defaulting
 * to English; this is the hook that finally supplies a real one. Prices become
 * `95 €` in Russian and `€95` in English, and dates follow suit — which is
 * most of what localisation is for, and none of which happens if the strings
 * are translated but the figures are not.
 */
export function useLocale(): SupportedLocale {
  const { i18n } = useTranslation();
  return isLanguage(i18n.language) ? i18n.language : 'en';
}
