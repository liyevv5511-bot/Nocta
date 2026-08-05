# Nocta

An AI travel planner that streams an hour-by-hour itinerary with real venues, computed walking
times, and a plan you can take apart.

[![CI](https://github.com/OWNER/nocta/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/nocta/actions/workflows/ci.yml)

```bash
npm install
npm run dev     # web on :5173, planner on :8787
```

`npm run verify` runs the whole gate locally: types → lint → unit tests → build → budget.

---

## What this is

Eight cities, a little over a hundred hand-researched venues, and a planning service that composes
them into a schedule against your moods, budget and pace — then streams the result back one day at
a time over Server-Sent Events.

Every venue has a real address, real coordinates, a real duration and a real reason to be on the
list. That is not decoration: it is what lets the planner promise a walking time between two stops
and mean it.

**Nothing in the itinerary is hardcoded JSX.** The plan is produced by a service, validated by a
schema, and rendered generically. Deleting `server/planner.ts` breaks the product; deleting any
component does not change what a plan _is_.

---

## Architecture decisions

### The schema is the contract, and it lives in `src/types/`

`src/types/itinerary.ts` holds one Zod schema used in three places: the server builds responses that
satisfy it, the client parses every stream frame through it, and the tests assert against it.

This is why swapping the mock planner for a real model is genuinely a one-file change. `ItinerarySchema`
becomes the structured-output contract handed to the model; `composeDay` becomes a completion call;
the SSE transport, the client parser, the store and every component stay exactly as they are.

It also means a model that hallucinates a shape cannot corrupt the UI. Frames that fail validation
are dropped and logged — one bad frame does not discard four good days.

### `fetch` + `ReadableStream`, not `EventSource`

`EventSource` cannot issue a POST. The plan request is a body, not a query string, and cramming it
into a URL would cap it at the browser's URL length and put the user's inputs into every access log.

The consequence is that SSE framing is handled manually in `plan.api.ts`. The buffer there is not
defensive padding — it is the protocol. Frames are separated by a blank line and split arbitrarily
across network chunks; a naïve `JSON.parse(chunk)` works on localhost and fails on a real network.

### `AsyncState` is a union, not a bag of booleans

`isLoading && error` is not a state this product can be in, so the type system says so. Every async
surface is forced to render the empty, loading, error and offline branches — which is the actual
requirement rather than a nicety.

`ApiError` carries a `kind`, a `retryable` flag, and a `userMessage` written for a traveller rather
than an engineer. Offline is a distinct kind from network failure, because the honest message is
different: _your saved trips are still available_.

### Itinerary logic is pure and lives outside the store

`itinerary.reducer.ts` holds the rules of the product — what happens to the clock when you drag
block 4 above block 1. It is pure, it returns new objects, and it is tested directly without
mounting a component or a store. `plan.store.ts` calls it; it does not contain it.

This is what makes drag-and-drop feel consequential rather than cosmetic: reordering re-times the
whole day, walking legs included, and the day's totals change because they were never a snapshot.

### Versioned, validated, quarantining storage

`lib/storage.ts` gives every persisted store three things most do not have: a version, a migration
chain applied in sequence, and validation _after_ migration. Storage is user-writable and
extension-writable; data coming out of it is untrusted input.

Anything that fails to migrate or validate is moved to a `.corrupt` key rather than deleted — it can
be recovered, and the user sees an empty state instead of a crash. Saved trips are on schema v2; the
v1 → v2 migration in `useTripStorage.ts` is what a returning user's data actually runs through.

### Canvas for the map, a real listbox for the map

The world map redraws on every camera frame. Sixty style recalculations a second across N absolutely
positioned DOM markers is exactly the jank you see on a mid-range phone, so it is canvas.

Canvas has no accessibility surface at all — no nodes, no roles, no focus order. Rather than bolt
ARIA onto a `<canvas>` and hope, the same dataset is rendered as a focusable listbox beside it that
drives the same camera. It is always present and always in the tab order. Keyboard and screen-reader
users get the feature, not a notice explaining that they cannot have it.

### Motion is a vocabulary, not a per-component decision

Every animation composes from `lib/motion.ts`: three durations (200/400/700ms), one house curve
(`cubic-bezier(0.16, 1, 0.3, 1)`), and a shared variant set. An inline `transition={{ duration: 0.3 }}`
is how a design system dies — one component eases differently, then two, then the whole thing feels
assembled rather than designed.

`prefers-reduced-motion` is enforced globally through Framer's `MotionConfig reducedMotion="user"`,
not by convention. A component that forgets to check still behaves correctly. Lenis is not
constructed at all — not merely configured to be fast — and GSAP contexts are never registered.
There is a Playwright suite (`e2e/reduced-motion.spec.ts`) whose job is to prove the product is
fully usable with every animation off.

### Two layers of design tokens

`styles/tokens.css` has a static `@theme` layer (type, space, radius, motion) and a semantic layer
that swaps per theme, re-exported through `@theme inline` so `bg-surface` follows the active theme
without a `dark:` variant anywhere.

Dark and light carry genuinely different glass values. The dark treatment lightens (a white veil
over dark) at 180% saturation; over pale backgrounds that same saturation reads as a colour cast, so
light drops to 130% and lower blur. Getting this wrong is what makes glassmorphism look milky and
push text below AA.

An ESLint rule (`no-restricted-syntax`) fails the build on a raw hex literal in any component.

---

## Substitutions from the brief

These are deliberate, and each one is a trade I would defend in review:

| Asked for           | Shipped                                                                                  | Why                                                                                                                                                                                                                                                                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mapbox GL JS        | Canvas map with equirectangular projection, clustering, camera flight, great-circle arcs | Mapbox needs an API token, which makes the demo unrunnable for anyone who clones it and adds a keyed dependency to the critical path. The projection, clustering and camera maths in `features/map/markers.ts` are real and tested; the basemap is a stylised graticule rather than vector tiles. `renderMap.ts` is the seam a tile basemap slots behind. |
| globe.gl (three.js) | Hand-rolled orthographic globe on canvas                                                 | The whole effect is a projection function and ~80 lines of drawing, against ~600kb of WebGL runtime for something on screen for four seconds. That trade is most of why the first-load budget is met.                                                                                                                                                     |
| react-helmet-async  | React 19 native metadata hoisting (`app/Seo.tsx`)                                        | The library does not support React 19 (its peer range stops at 18), and React 19 hoists `<title>`/`<meta>`/`<link>` natively. Fewer dependencies, same output.                                                                                                                                                                                            |
| SplitType           | `features/hero/SplitHeadline.tsx`                                                        | Splitting text into spans destroys it for screen readers. The version here renders the real sentence once in a visually-hidden node, marks the animated copy `aria-hidden`, keeps word boundaries intact so it still wraps, and splits on graphemes via `Intl.Segmenter` rather than code points.                                                         |
| Picsum photography  | —                                                                                        | Keyless and stable, so no catalogue entry can become a dead link. `data/images.ts` is the single swap point for a licensed CDN. Photos are not location-accurate, which is why `Photo` always renders a deterministic gradient underneath — it doubles as the blur-up placeholder and the failure state.                                                  |

## Not shipped

Stated plainly rather than left for you to discover:

- **Build-time prerendering** (`vite-react-ssg`) and **Satori OG image generation**. Metadata is
  correct per route at runtime and `sitemap.xml`/`robots.txt` are generated from the catalogue, but
  the initial HTML response is still a shell. This is the largest remaining gap against the brief.
- **i18n via react-i18next.** `lib/format.ts` is locale-parameterised throughout (`en`/`az`/`ru`)
  and every figure goes through `Intl`, but strings are not extracted and there is no language
  switcher.
- **PDF export via jsPDF/html2canvas.** `/trip/:id` offers print-to-PDF through the browser, which
  produces better output than a canvas rasterisation, but it is not the library asked for.
- **Multi-city route builder UI.** The great-circle arc rendering, sequencing and draw-on animation
  are implemented and `WorldMap` accepts a `route` prop; there is no interface for assembling one.
- **Magnetic cursor.**
- **Hotel/restaurant ratings.** The venue catalogue has no rating field — inventing star ratings for
  real, named businesses is the kind of fake data this project is otherwise free of.
- **Live URL and Lighthouse report.** The Lighthouse CI job and its budget assertions are configured
  in `lighthouserc.json`; nothing has been deployed.

---

## Performance

Measured, not asserted. `npm run budget` fails the build if the initial payload grows:

```
react       89.2 kB   motion  44.0 kB
index       22.1 kB   Landing  3.0 kB
TOTAL      158.4 kB  /  200 kB budget      CSS 10.9 kB / 25 kB
```

How it stays there: only the hero is in the landing chunk. Everything below the fold is
`React.lazy` behind a `Suspense` boundary with a reserved height, so the deferred sections cannot
shift the page in (the CLS budget is 0.05, and eight sections popping in from zero height would
blow it on their own). GSAP arrives with the pinned sections, the map and Zod with the live demo.

`manualChunks` splits on package path rather than entry name — `react-dom` and `react-dom/client`
are different module ids, and listing only the former silently leaves the 130kb renderer in the
entry chunk.

---

## Testing

```
111 unit tests   ·   41 E2E (desktop Chromium + mobile WebKit)
```

The unit suite covers the itinerary reducer (re-timing, reordering, cross-day moves, totals), the
Zod contract, the storage migration chain, the planner engine, and the UI primitives' keyboard and
ARIA behaviour.

Three bugs were found by writing these rather than by clicking around:

1. **Day-trip journeys were billed twice.** A Nikkō day trip put a 140km gap between the transit
   block and the first stop, which the walking model turned into a six-hour leg — and which the
   schema then rejected outright. `walkMinutes` now knows the previous block was transit.
2. **Long trips produced empty days.** Once the named-venue pool, the day trips and the districts
   were all spent, `composeDay` returned nothing. It now recycles the pool and labels the repeats as
   deliberate return visits.
3. **Two canonical links per page** — one static in `index.html`, one from `<Seo>` — which is worse
   for SEO than having none. Route metadata now lives in exactly one place.

E2E runs against the **production build**, not the dev server: a smoke suite that only exercises
Vite's dev pipeline cannot catch a broken code-split, a missing chunk, or a route that 404s under
the SPA fallback.

---

## Structure

```
src/
  app/        router, providers, layout, error boundaries, Seo
  features/
    hero/     Hero, HeroGlobe, useHeroParallax, SplitHeadline
    map/      WorldMap, CityCard, CityList, useMapCamera, markers, renderMap
    itinerary/ PlanForm, ItineraryTimeline, DayColumn, ActivityCard, SwapDialog,
               GenerationStatus, plan.api, plan.store, itinerary.reducer
    trips/    useTripStorage
    landing/  HowItWorks, CityGallery, LiveDemo, Bento, Pricing, Faq, CTA
    theme/    theme.store, ThemeToggle
    ui/       Button, Card, GlassPanel, Chip, Photo, Skeleton, Slider,
              Toggle, Accordion, Toast
  data/       cities, venues, images        ← the researched catalogue
  lib/        cn, motion, format, storage, useLenis, useGsapScroll, hooks
  types/      itinerary (the contract), city, api
  styles/     tokens.css, globals.css
server/       Express + SSE planner service
scripts/      seo.ts, check-budget.ts
e2e/          plan, smoke, reduced-motion
```

Enforced: no component over 200 lines, zero `any`, no raw hex in components, absolute imports via
`@/`, barrel exports per feature, no floating promises. `strict` and `noUncheckedIndexedAccess` are
on; `exactOptionalPropertyTypes` was tried and removed — it fights third-party types (Vite's plugin
interface, Framer's props) without catching anything real in this codebase.

---

## Deployment

`vercel.json` and `netlify.toml` are both present: SPA fallback with hashed assets matched first (so
a missing chunk 404s honestly rather than being served `index.html` with a JS content type),
immutable caching on `/assets/*`, and the usual security headers.

The planner service deploys separately; point `NOCTA_API_ORIGIN` at it.
