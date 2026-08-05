import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { CITIES } from '../src/data/cities';

/**
 * Generates `sitemap.xml` and `robots.txt` into the build output.
 *
 * Run after `vite build`. Generated rather than hand-written for the obvious
 * reason: a static sitemap goes stale the first time a city is added, and a
 * stale sitemap is worse than none — it tells crawlers to fetch URLs that no
 * longer exist and to ignore the ones that do.
 *
 * `/trip/:id` is deliberately absent. Trips live in the user's browser and
 * cannot be fetched by a crawler; the route also sets `noindex` for the same
 * reason.
 */

const SITE_URL = process.env.NOCTA_SITE_URL ?? 'https://nocta.travel';
const OUT_DIR = join(process.cwd(), 'dist');

interface SitemapEntry {
  path: string;
  changefreq: 'daily' | 'weekly' | 'monthly';
  priority: number;
}

const STATIC_ENTRIES: SitemapEntry[] = [
  { path: '/', changefreq: 'weekly', priority: 1 },
  { path: '/plan', changefreq: 'weekly', priority: 0.9 },
  { path: '/styleguide', changefreq: 'monthly', priority: 0.3 },
];

function buildSitemap(): string {
  const today = new Date().toISOString().slice(0, 10);

  // Each destination is a real, crawlable entry point into the planner.
  const cityEntries: SitemapEntry[] = CITIES.map((city) => ({
    path: `/plan?destination=${encodeURIComponent(city.name)}`,
    changefreq: 'monthly',
    priority: 0.7,
  }));

  const urls = [...STATIC_ENTRIES, ...cityEntries]
    .map(
      (entry) => `  <url>
    <loc>${SITE_URL}${escapeXml(entry.path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function buildRobots(): string {
  return `User-agent: *
Allow: /

# Saved trips are stored in the visitor's browser and are not fetchable.
Disallow: /trip/
Disallow: /saved

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });

  await Promise.all([
    writeFile(join(OUT_DIR, 'sitemap.xml'), buildSitemap(), 'utf8'),
    writeFile(join(OUT_DIR, 'robots.txt'), buildRobots(), 'utf8'),
  ]);

  console.log(
    `[seo] sitemap.xml (${String(STATIC_ENTRIES.length + CITIES.length)} urls) + robots.txt`,
  );
}

main().catch((error: unknown) => {
  console.error('[seo] generation failed', error);
  process.exitCode = 1;
});
