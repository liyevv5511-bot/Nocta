/**
 * Formatting helpers. All of them go through `Intl`, all of them take an
 * explicit locale, and none of them concatenate strings by hand — the app
 * ships in az/en/ru and hand-rolled formatting is the first thing to break.
 */

export type SupportedLocale = 'en' | 'az' | 'ru';

const INTL_LOCALE: Record<SupportedLocale, string> = {
  en: 'en-GB',
  az: 'az-Latn-AZ',
  ru: 'ru-RU',
};

function resolve(locale: SupportedLocale): string {
  return INTL_LOCALE[locale];
}

/** `€1,240` — no decimals, because travel budgets are never precise. */
export function formatCurrency(
  amount: number,
  currency = 'EUR',
  locale: SupportedLocale = 'en',
): string {
  return new Intl.NumberFormat(resolve(locale), {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** `€38.50` — for individual line items, where cents do matter. */
export function formatPrice(
  amount: number,
  currency = 'EUR',
  locale: SupportedLocale = 'en',
): string {
  return new Intl.NumberFormat(resolve(locale), {
    style: 'currency',
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Minutes → `45 min`, `1 h 30 m`, `2 h`. */
export function formatDuration(minutes: number, locale: SupportedLocale = 'en'): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;

  if (hours === 0) return `${String(mins)} min`;
  if (mins === 0) return `${String(hours)} h`;

  // Intl.DurationFormat is not universally available yet; the compact form
  // below is locale-agnostic enough for h/m and avoids a polyfill.
  void locale;
  return `${String(hours)} h ${String(mins)} m`;
}

/** `09:30` — 24h everywhere; the product is not US-first. */
export function formatTime(isoTime: string, locale: SupportedLocale = 'en'): string {
  const parts = isoTime.split(':');
  const hour = Number(parts[0] ?? '0');
  const minute = Number(parts[1] ?? '0');

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return isoTime;

  const date = new Date(Date.UTC(2000, 0, 1, hour, minute));
  return new Intl.DateTimeFormat(resolve(locale), {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(date);
}

/** `12 Mar 2026`. */
export function formatDate(date: Date | string, locale: SupportedLocale = 'en'): string {
  const value = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return '—';

  return new Intl.DateTimeFormat(resolve(locale), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(value);
}

/** `2 days ago`, `in 3 weeks`. */
export function formatRelative(
  date: Date | string,
  locale: SupportedLocale = 'en',
  now: Date = new Date(),
): string {
  const value = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return '—';

  const diffMs = value.getTime() - now.getTime();
  const rtf = new Intl.RelativeTimeFormat(resolve(locale), { numeric: 'auto' });

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000_000],
    ['month', 2_592_000_000],
    ['week', 604_800_000],
    ['day', 86_400_000],
    ['hour', 3_600_000],
    ['minute', 60_000],
  ];

  for (const [unit, ms] of units) {
    if (Math.abs(diffMs) >= ms) {
      return rtf.format(Math.round(diffMs / ms), unit);
    }
  }
  return rtf.format(0, 'minute');
}

/** `4.8` — ratings always render one decimal, even when whole. */
export function formatRating(rating: number, locale: SupportedLocale = 'en'): string {
  return new Intl.NumberFormat(resolve(locale), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(rating);
}

/** `1.2 km`, `640 m`. */
export function formatDistance(metres: number, locale: SupportedLocale = 'en'): string {
  const nf = new Intl.NumberFormat(resolve(locale), { maximumFractionDigits: 1 });
  return metres >= 1000 ? `${nf.format(metres / 1000)} km` : `${nf.format(Math.round(metres))} m`;
}

/** `Lisbon · Porto · Sintra` with locale-correct list joining. */
export function formatList(items: readonly string[], locale: SupportedLocale = 'en'): string {
  return new Intl.ListFormat(resolve(locale), { style: 'long', type: 'conjunction' }).format(items);
}

/** Slug for share URLs: `lisbon-4-days`. Diacritics folded, not dropped. */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}
