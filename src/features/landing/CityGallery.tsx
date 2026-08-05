import { useRef } from 'react';
import { Link } from 'react-router-dom';

import { CITIES } from '@/data/cities';
import { Photo } from '@/features/ui';
import { formatCurrency } from '@/lib/format';
import { useGsapContext } from '@/lib/useGsapScroll';

/**
 * Horizontal scroll gallery.
 *
 * The section pins for the length of the track and vertical scroll is
 * translated into horizontal movement — the one effect on this page that
 * genuinely needs ScrollTrigger's `pin`, because there is no CSS equivalent.
 *
 * The distance is computed from the track's real width rather than a magic
 * number, and recomputed on `invalidateOnRefresh`, so adding a ninth city
 * does not silently break the scroll length.
 *
 * Under reduced motion `useGsapContext` never runs, and the track falls back
 * to a normal horizontally-scrollable row — same content, same order, driven
 * by the user instead of by the page.
 */
export function CityGallery(): React.ReactElement {
  const root = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);

  useGsapContext(root, (gsap) => {
    const track = trackRef.current;
    const section = root.current;
    if (!track || !section) return;

    const distance = (): number => Math.max(0, track.scrollWidth - window.innerWidth + 96);

    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${String(distance())}`,
        pin: true,
        scrub: 0.8,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
  });

  return (
    <section ref={root} aria-labelledby="gallery-heading" className="overflow-hidden py-24">
      <div className="container-content">
        <p className="eyebrow">The catalogue</p>
        <h2 id="gallery-heading" className="mt-4 max-w-2xl text-display-2 text-primary">
          Eight cities, researched properly.
        </h2>
        <p className="mt-5 max-w-prose text-body-lg text-secondary">
          Not eight thousand scraped listings. Every venue in here has a real address, real
          coordinates and a reason to be on the list — which is why the planner can promise you a
          walking time and mean it.
        </p>
      </div>

      <ul
        ref={trackRef}
        className="no-scrollbar mt-14 flex gap-6 overflow-x-auto px-[var(--space-gutter)] pb-4 motion-safe:overflow-visible"
      >
        {CITIES.map((city) => (
          <li key={city.id} className="w-[78vw] shrink-0 sm:w-[22rem]">
            <Link
              to={`/destination/${city.id}`}
              className="group block overflow-hidden rounded-xl border border-subtle bg-surface transition-colors hover:border-default"
            >
              <Photo
                src={city.imageUrl}
                alt={`${city.name}, ${city.country}`}
                width={1200}
                height={675}
                seed={city.id}
                sizes="(max-width: 640px) 78vw, 352px"
                className="w-full transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
              />

              <div className="p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-h3 text-primary">{city.name}</h3>
                  <p className="tabular shrink-0 text-sm text-tertiary">
                    {formatCurrency(city.avgDailyCost, city.currency)}/day
                  </p>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-secondary">{city.tagline}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
