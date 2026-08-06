import i18next, { type i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import type { SupportedLocale } from '@/lib/format';

import { en, type Dictionary } from './en';

/**
 * Runtime i18n.
 *
 * Three decisions shape this file:
 *
 * **English is bundled; the others are fetched.** Three full dictionaries in
 * the entry chunk would be most of the first-load budget spent on text nobody
 * has asked for yet. `az` and `ru` are dynamic imports, loaded when a visitor
 * selects them or when detection picks them.
 *
 * **Detection is explicit, not a plugin.** The order that matters here is
 * short — a stored choice, then the browser's languages, then English — and
 * writing it out is smaller than the detector package and easier to reason
 * about than its configuration.
 *
 * **The language is a document property, not just state.** `<html lang>` is
 * what a screen reader reads pronunciation rules from and what a translation
 * tool keys off; keeping it in step is not optional.
 */

export const SUPPORTED_LANGUAGES = ['en', 'az', 'ru'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'en';
export const LANGUAGE_STORAGE_KEY = 'nocta.language';

const LOADERS: Record<Exclude<Language, 'en'>, () => Promise<Dictionary>> = {
  az: async () => (await import('./az')).az,
  ru: async () => (await import('./ru')).ru,
};

export function isLanguage(value: string | null | undefined): value is Language {
  return value !== null && value !== undefined && SUPPORTED_LANGUAGES.includes(value as Language);
}

/** A stored choice, then the browser's preference, then English. */
export function detectLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isLanguage(stored)) return stored;
  } catch {
    // Storage blocked; fall through to the browser's own preference.
  }

  for (const candidate of navigator.languages) {
    // `az-Latn-AZ` and `ru-RU` both matter here, so match on the base tag.
    const base = candidate.split('-')[0]?.toLowerCase();
    if (isLanguage(base)) return base;
  }

  return DEFAULT_LANGUAGE;
}

/** Loads a language's resources if they are not already registered. */
export async function loadLanguage(language: Language): Promise<void> {
  if (language === 'en' || i18next.hasResourceBundle(language, 'translation')) return;

  const resources = await LOADERS[language]();
  i18next.addResourceBundle(language, 'translation', resources, true, true);
}

export async function changeLanguage(language: Language): Promise<void> {
  await loadLanguage(language);
  await i18next.changeLanguage(language);

  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // A visitor who blocks storage still gets the language for this session.
  }
}

/** Keeps `<html lang>` in step with the active language. */
function syncDocumentLanguage(language: string): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = language;
}

/**
 * The locale used for numbers, currency and dates.
 *
 * `lib/format.ts` was written locale-parameterised from the start; this is the
 * wire that finally connects it to a real choice.
 */
export function toLocale(language: Language): SupportedLocale {
  return language;
}

export async function initI18n(language: Language = detectLanguage()): Promise<I18nInstance> {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({
      lng: DEFAULT_LANGUAGE,
      fallbackLng: DEFAULT_LANGUAGE,
      supportedLngs: [...SUPPORTED_LANGUAGES],
      resources: { en: { translation: en } },
      defaultNS: 'translation',
      // React escapes for us; i18next doing it again turns an apostrophe into
      // `&#39;` in the middle of a sentence.
      interpolation: { escapeValue: false },
      returnNull: false,
    });

    i18next.on('languageChanged', syncDocumentLanguage);
  }

  if (language !== i18next.language) await changeLanguage(language);
  syncDocumentLanguage(i18next.language);

  return i18next;
}

export { i18next };
