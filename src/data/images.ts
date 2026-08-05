/**
 * Image sourcing.
 *
 * Every photo in the product resolves through `photo()`. The catalogue stores
 * *seeds*, not URLs, so switching the image backend — to a licensed CDN, to
 * Cloudinary, to locally-hosted AVIF — is a change to this file alone.
 *
 * The current backend is Picsum, chosen because it is keyless, stable, and
 * returns a real photograph for any seed (so no entry in the catalogue can
 * become a dead link). It is not location-accurate; `PhotoTile` therefore
 * always renders a deterministic gradient beneath the image, which doubles as
 * the blur-up placeholder and as the failure state.
 */

const ORIGIN = 'https://picsum.photos';

export interface PhotoOptions {
  width: number;
  height: number;
}

export function photo(seed: string, { width, height }: PhotoOptions): string {
  return `${ORIGIN}/seed/${encodeURIComponent(seed)}/${String(width)}/${String(height)}`;
}

/** Standard sizes, so `srcSet` widths stay consistent across the app. */
export const PHOTO_SIZES = {
  card: { width: 800, height: 600 },
  cardWide: { width: 1200, height: 675 },
  thumb: { width: 320, height: 240 },
  hero: { width: 1920, height: 1080 },
} as const satisfies Record<string, PhotoOptions>;

/**
 * Deterministic hue pair for a seed. Used for the gradient underlay so a card
 * has its own identity before (and if) its photo ever arrives.
 */
export function seedGradient(seed: string): { from: string; to: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  const partner = (hue + 48) % 360;
  return {
    from: `oklch(58% 0.13 ${String(hue)})`,
    to: `oklch(38% 0.11 ${String(partner)})`,
  };
}
