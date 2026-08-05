const SITE_URL = 'https://nocta.travel';
const SITE_NAME = 'Nocta';

export interface SeoProps {
  title: string;
  description: string;
  /** Path only, e.g. `/trip/lisbon-4-days`. Joined to the canonical origin. */
  path: string;
  ogImage?: string;
  /** Serialised and emitted as a JSON-LD block. */
  jsonLd?: Record<string, unknown>;
  noIndex?: boolean;
}

/**
 * Per-route document metadata.
 *
 * React 19 hoists `<title>`, `<meta>` and `<link>` out of components into
 * `<head>` natively, which is why there is no Helmet in this project: the
 * library exists to solve a problem the runtime now solves, and it does not
 * support React 19. Rendering the tags where the data lives is both simpler
 * and one fewer dependency in the critical path.
 *
 * Note this only covers crawlers that execute JavaScript. Static routes are
 * additionally pre-rendered at build time so the markup is in the initial
 * response — see `scripts/prerender.ts`.
 */
export function Seo({
  title,
  description,
  path,
  ogImage = `${SITE_URL}/og/default.png`,
  jsonLd,
  noIndex = false,
}: SeoProps): React.ReactElement {
  const canonical = `${SITE_URL}${path}`;
  const fullTitle = path === '/' ? title : `${title} · ${SITE_NAME}`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noIndex ? <meta name="robots" content="noindex, nofollow" /> : null}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLd === undefined ? null : (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </>
  );
}
