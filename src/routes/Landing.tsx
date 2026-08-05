import { lazy, Suspense, type ReactNode } from 'react';

import { Seo } from '@/app/Seo';
import { Hero } from '@/features/hero/Hero';

/**
 * The landing page.
 *
 * Only the hero is in the initial chunk. Everything below the fold is split
 * out and mounted behind `Suspense` — which is what keeps the first-load JS
 * budget achievable, because between them these sections pull in GSAP, the
 * canvas map and the streaming client, none of which are needed to paint the
 * hero.
 *
 * Each placeholder reserves a plausible height so the deferred sections do not
 * shift the page as they arrive. That is the whole reason `SectionFallback`
 * takes a height rather than rendering a spinner: the CLS budget is 0.05, and
 * eight sections popping in from zero height would blow it on their own.
 */
const HowItWorks = lazy(async () => ({
  default: (await import('@/features/landing/HowItWorks')).HowItWorks,
}));
const CityGallery = lazy(async () => ({
  default: (await import('@/features/landing/CityGallery')).CityGallery,
}));
const LiveDemo = lazy(async () => ({
  default: (await import('@/features/landing/LiveDemo')).LiveDemo,
}));
const BentoFeatures = lazy(async () => ({
  default: (await import('@/features/landing/BentoFeatures')).BentoFeatures,
}));
const Pricing = lazy(async () => ({
  default: (await import('@/features/landing/Pricing')).Pricing,
}));
const Testimonials = lazy(async () => ({
  default: (await import('@/features/landing/Testimonials')).Testimonials,
}));
const Faq = lazy(async () => ({ default: (await import('@/features/landing/Faq')).Faq }));
const CallToAction = lazy(async () => ({
  default: (await import('@/features/landing/CallToAction')).CallToAction,
}));

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

      <Deferred minHeight="70rem">
        <HowItWorks />
      </Deferred>
      <Deferred minHeight="40rem">
        <CityGallery />
      </Deferred>
      <Deferred minHeight="80rem">
        <LiveDemo />
      </Deferred>
      <Deferred minHeight="45rem">
        <BentoFeatures />
      </Deferred>
      <Deferred minHeight="50rem">
        <Pricing />
      </Deferred>
      <Deferred minHeight="35rem">
        <Testimonials />
      </Deferred>
      <Deferred minHeight="40rem">
        <Faq />
      </Deferred>
      <Deferred minHeight="30rem">
        <CallToAction />
      </Deferred>
    </>
  );
}

function Deferred({
  children,
  minHeight,
}: {
  children: ReactNode;
  minHeight: string;
}): React.ReactElement {
  return (
    <Suspense fallback={<div aria-hidden="true" style={{ minHeight }} />}>{children}</Suspense>
  );
}
