import type { Dictionary } from './en';

/**
 * Types `t()` against the English dictionary.
 *
 * Without this, `t('plan.headnig')` is a valid call that renders the key back
 * to the user. With it, it does not compile — which is the difference between
 * having translation keys and having them checked.
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: Dictionary };
    returnNull: false;
  }
}
