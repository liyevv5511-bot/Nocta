import { useState } from 'react';

import { seedGradient } from '@/data/images';
import { cn } from '@/lib/cn';

export interface PhotoProps {
  src: string;
  alt: string;
  /** Intrinsic size. Required — this is what prevents layout shift. */
  width: number;
  height: number;
  /** Stable identity used for the gradient underlay. Defaults to `src`. */
  seed?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * Image with a guaranteed non-empty visual state.
 *
 * Three states, all handled:
 *   loading → the deterministic gradient derived from the seed
 *   loaded  → the photo, cross-fading in over the gradient
 *   failed  → the gradient stays; nothing is broken, nothing is blank
 *
 * `width`/`height` are mandatory and the wrapper reserves the aspect ratio, so
 * an image arriving late cannot push content around — this is the single
 * largest contributor to CLS in an image-heavy layout.
 */
export function Photo({
  src,
  alt,
  width,
  height,
  seed,
  sizes = '(max-width: 768px) 100vw, 400px',
  priority = false,
  className,
}: PhotoProps): React.ReactElement {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const gradient = seedGradient(seed ?? src);

  return (
    <span
      className={cn('relative block overflow-hidden', className)}
      style={{ aspectRatio: `${String(width)} / ${String(height)}` }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
        }}
      />

      {failed ? null : (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={() => {
            setLoaded(true);
          }}
          onError={() => {
            setFailed(true);
          }}
          className={cn(
            'absolute inset-0 size-full object-cover',
            'transition-opacity duration-[var(--duration-slow)] ease-[var(--ease-out-expo)]',
            loaded ? 'opacity-100' : 'opacity-0',
          )}
        />
      )}
    </span>
  );
}
