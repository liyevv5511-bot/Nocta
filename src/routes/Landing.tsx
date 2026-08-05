import { Seo } from '@/app/Seo';
import { Hero } from '@/features/hero/Hero';
import { BentoFeatures } from '@/features/landing/BentoFeatures';
import { CallToAction } from '@/features/landing/CallToAction';
import { CityGallery } from '@/features/landing/CityGallery';
import { Faq } from '@/features/landing/Faq';
import { HowItWorks } from '@/features/landing/HowItWorks';
import { LiveDemo } from '@/features/landing/LiveDemo';
import { Pricing } from '@/features/landing/Pricing';
import { Testimonials } from '@/features/landing/Testimonials';

/**
 * The landing page.
 *
 * Everything here is a plain import. An earlier version wrapped each
 * below-the-fold section in `React.lazy` + `Suspense` to keep the initial
 * payload down, and that made the page impossible to prerender usefully: a
 * suspending boundary pushes React into out-of-order streaming, and the
 * resulting file needs JavaScript to assemble itself.
 *
 * The payload is still controlled, just at the right layer — the two genuinely
 * heavy dependencies are deferred with a dynamic `import()` inside an effect,
 * which never runs during a server render:
 *
 *   GSAP (≈45kB gz)     → `lib/useGsapScroll.ts`
 *   The plan client     → `landing/LiveDemo.tsx`
 *
 * That is a better split than the component-level one anyway: it defers the
 * bytes without deferring the markup.
 */

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Nocta',
  applicationCategory: 'TravelApplication',
  operatingSystem: 'Web',
  description:
    'AI travel planning with real venues, computed walking times and a fully editable itinerary.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
};

export function Landing(): React.ReactElement {
  return (
    <>
      <Seo
        title="Nocta — AI travel planning that reads like a local wrote it"
        description="Describe a city, a mood and a budget. Nocta streams back an hour-by-hour itinerary with real venues, real walking times and a map you can rearrange."
        path="/"
        jsonLd={JSON_LD}
      />

      <Hero />
      <HowItWorks />
      <CityGallery />
      <LiveDemo />
      <BentoFeatures />
      <Pricing />
      <Testimonials />
      <Faq />
      <CallToAction />
    </>
  );
}
