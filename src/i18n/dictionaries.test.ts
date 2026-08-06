import { describe, expect, it } from 'vitest';

import { az } from './az';
import { en } from './en';
import { ru } from './ru';
import { SUPPORTED_LANGUAGES } from './index';

/**
 * Dictionary integrity.
 *
 * The type system already rejects a missing key — `az` and `ru` are declared
 * as `Dictionary`. What it cannot catch is the failure mode that actually
 * ships: a key present but left in English, an interpolation placeholder
 * dropped in translation so the number never appears, or a plural form a
 * language needs and does not have.
 */

type Node = Record<string, unknown>;

/** Every leaf, as `a.b.c` → value. */
function flatten(value: unknown, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();

  if (typeof value === 'string') {
    out.set(prefix, value);
    return out;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      for (const [key, leaf] of flatten(item, `${prefix}[${String(index)}]`)) out.set(key, leaf);
    });
    return out;
  }

  if (typeof value === 'object' && value !== null) {
    for (const [key, child] of Object.entries(value as Node)) {
      for (const [path, leaf] of flatten(child, prefix ? `${prefix}.${key}` : key)) {
        out.set(path, leaf);
      }
    }
  }

  return out;
}

const PLACEHOLDER = /\{\{(\w+)(?:,[^}]*)?\}\}/g;

function placeholders(value: string): Set<string> {
  return new Set([...value.matchAll(PLACEHOLDER)].map((match) => match[1] ?? ''));
}

const ENGLISH = flatten(en);
const TRANSLATIONS = { az: flatten(az), ru: flatten(ru) };

/**
 * Strings that are correctly identical across languages: proper nouns, the
 * language names in their own script, and units.
 */
const SHARED = new Set([
  'common.brand',
  'language.en',
  'language.az',
  'language.ru',
  'notFound.eyebrow',
  'pricing.tiers.pro.name',
  'pricing.tiers.pro.cta',
]);

describe.each(Object.entries(TRANSLATIONS))('%s', (language, dictionary) => {
  it('has exactly the keys English has — no more, no fewer', () => {
    const missing = [...ENGLISH.keys()].filter((key) => !dictionary.has(key));
    const extra = [...dictionary.keys()].filter(
      (key) => !ENGLISH.has(key) && !/_(zero|one|two|few|many|other)$/.test(key),
    );

    expect(missing, `missing in ${language}`).toEqual([]);
    expect(extra, `not in English: ${language}`).toEqual([]);
  });

  it('keeps every interpolation placeholder', () => {
    const broken: string[] = [];

    for (const [key, english] of ENGLISH) {
      const translated = dictionary.get(key);
      if (translated === undefined) continue;

      const expected = placeholders(english);
      const actual = placeholders(translated);

      for (const name of expected) {
        if (!actual.has(name)) broken.push(`${key}: {{${name}}}`);
      }
    }

    expect(broken, `dropped placeholders in ${language}`).toEqual([]);
  });

  it('is actually translated, not copied', () => {
    const untouched = [...ENGLISH.entries()]
      .filter(([key, english]) => {
        if (SHARED.has(key)) return false;
        // Very short strings can legitimately coincide; longer ones cannot.
        if (english.length < 12) return false;
        return dictionary.get(key) === english;
      })
      .map(([key]) => key);

    expect(untouched, `left in English in ${language}`).toEqual([]);
  });

  it('has no empty strings', () => {
    const blank = [...dictionary.entries()]
      .filter(([, value]) => value.trim().length === 0)
      .map(([key]) => key);

    expect(blank).toEqual([]);
  });
});

describe('plural coverage', () => {
  it.each(['nights', 'days', 'stops'])('English supplies one and other for %s', (group) => {
    expect(ENGLISH.has(`common.${group}_one`)).toBe(true);
    expect(ENGLISH.has(`common.${group}_other`)).toBe(true);
  });

  it.each(['nights', 'days', 'stops'])('Russian supplies its three forms for %s', (group) => {
    // "1 ночь", "2 ночи", "5 ночей" — three different words.
    for (const form of ['one', 'few', 'many']) {
      expect(TRANSLATIONS.ru.has(`common.${group}_${form}`), `common.${group}_${form}`).toBe(true);
    }
  });
});

describe('language list', () => {
  it('matches the dictionaries that exist', () => {
    expect([...SUPPORTED_LANGUAGES].sort()).toEqual(['az', 'en', 'ru']);
  });
});
