import { useEffect } from 'react';

const SITE_URL = 'https://nocta.travel';
const SITE_NAME = 'Nocta';

/**
 * Rendered on the server, applied imperatively on the client.
 *
 * React 19 hoists `<title>`/`<meta>`/`<link>` into `<head>` — but only on some
 * engines. Chromium moves the node; WebKit leaves it where the component sat,
 * inside `#root`. That difference produced a document with the canonical link
 * in the head *and* in a div, a stale title after client navigation on Safari,
 * and a dedupe pass that could not tell which node React owned.
 *
 * So the two paths are separated explicitly rather than left to the runtime:
 *
 *   **Server** — the tags are rendered into the markup, where
 *   `scripts/prerender.tsx` lifts them into `<head>` and strips them from the
 *   body. A crawler that never runs JavaScript reads them there.
 *
 *   **Client** — the component renders nothing, and an effect writes the same
 *   tags into `<head>` directly, replacing whatever the previous route left.
 *   One copy, in the right place, updated on every navigation, identical on
 *   every engine.
 *
 * The server/client split is safe precisely because the prerenderer strips the
 * body copies: both sides render nothing there, so hydration matches.
 */

const IS_SERVER = typeof window === 'undefined';

/** Marks the nodes this module owns, so it only ever replaces its own. */
const OWNED = 'data-nocta-seo';

export interface SeoProps {
  title: string;
  description: string;
  /** Path only, e.g. `/destination/lisbon`. Joined to the canonical origin. */
  path: string;
  ogImage?: string;
  /** Serialised and emitted as a JSON-LD block. */
  jsonLd?: Record<string, unknown>;
  noIndex?: boolean;
}

interface Resolved {
  fullTitle: string;
  canonical: string;
  metas: { key: string; attribute: 'name' | 'property'; content: string }[];
  jsonLd: string | null;
  noIndex: boolean;
}

function resolve({
  title,
  description,
  path,
  ogImage = `${SITE_URL}/og/default.png`,
  jsonLd,
  noIndex = false,
}: SeoProps): Resolved {
  const canonical = `${SITE_URL}${path}`;
  const fullTitle = path === '/' ? title : `${title} · ${SITE_NAME}`;

  return {
    fullTitle,
    canonical,
    noIndex,
    jsonLd: jsonLd === undefined ? null : JSON.stringify(jsonLd),
    metas: [
      { key: 'description', attribute: 'name', content: description },
      { key: 'og:type', attribute: 'property', content: 'website' },
      { key: 'og:site_name', attribute: 'property', content: SITE_NAME },
      { key: 'og:title', attribute: 'property', content: fullTitle },
      { key: 'og:description', attribute: 'property', content: description },
      { key: 'og:url', attribute: 'property', content: canonical },
      { key: 'og:image', attribute: 'property', content: ogImage },
      { key: 'twitter:card', attribute: 'name', content: 'summary_large_image' },
      { key: 'twitter:title', attribute: 'name', content: fullTitle },
      { key: 'twitter:description', attribute: 'name', content: description },
      { key: 'twitter:image', attribute: 'name', content: ogImage },
    ],
  };
}

export function Seo(props: SeoProps): React.ReactElement | null {
  const resolved = resolve(props);
  const { fullTitle, canonical, metas, jsonLd, noIndex } = resolved;

  useEffect(() => {
    if (IS_SERVER) return;
    applyToHead(resolved);
    // `resolved` is derived from the props below; listing them keeps the
    // effect honest without re-running on a new object identity each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullTitle, canonical, jsonLd, noIndex, props.description, props.ogImage]);

  if (!IS_SERVER) return null;

  return (
    <>
      <title>{fullTitle}</title>
      <link rel="canonical" href={canonical} />
      {noIndex ? <meta name="robots" content="noindex, nofollow" /> : null}

      {metas.map((meta) =>
        meta.attribute === 'name' ? (
          <meta key={meta.key} name={meta.key} content={meta.content} />
        ) : (
          <meta key={meta.key} property={meta.key} content={meta.content} />
        ),
      )}

      {jsonLd === null ? null : <script type="application/ld+json">{jsonLd}</script>}
    </>
  );
}

/**
 * Writes the resolved metadata into `<head>`.
 *
 * Upserts by key so the nodes survive across routes rather than being torn
 * down and rebuilt, and removes only tags this module created — the
 * prerendered copies are indistinguishable in shape, so ownership is tracked
 * with an attribute rather than inferred.
 */
function applyToHead(resolved: Resolved): void {
  const { head } = document;

  document.title = resolved.fullTitle;

  upsert(head, `link[rel="canonical"]`, () => {
    const link = document.createElement('link');
    link.rel = 'canonical';
    return link;
  }).setAttribute('href', resolved.canonical);

  for (const meta of resolved.metas) {
    const selector = `meta[${meta.attribute}="${meta.key}"]`;
    upsert(head, selector, () => {
      const element = document.createElement('meta');
      element.setAttribute(meta.attribute, meta.key);
      return element;
    }).setAttribute('content', meta.content);
  }

  const robots = head.querySelector('meta[name="robots"]');
  if (resolved.noIndex) {
    upsert(head, 'meta[name="robots"]', () => {
      const element = document.createElement('meta');
      element.name = 'robots';
      return element;
    }).setAttribute('content', 'noindex, nofollow');
  } else {
    robots?.remove();
  }

  // Route-level structured data. The site-level block in `index.html` is not
  // marked and is therefore never touched.
  const existing = head.querySelector(`script[type="application/ld+json"][${OWNED}]`);
  existing?.remove();

  if (resolved.jsonLd !== null) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute(OWNED, '');
    script.textContent = resolved.jsonLd;
    head.append(script);
  }
}

function upsert(head: HTMLHeadElement, selector: string, create: () => HTMLElement): HTMLElement {
  const existing = head.querySelector<HTMLElement>(selector);
  if (existing) return existing;

  const element = create();
  element.setAttribute(OWNED, '');
  head.append(element);
  return element;
}
