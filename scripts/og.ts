import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import satori, { type SatoriOptions } from 'satori';

import { CITIES } from '../src/data/cities';

/**
 * Open Graph image generation, at build time.
 *
 * Satori lays out a subset of flexbox and renders it to SVG; resvg
 * rasterises that to PNG. Nothing runs at request time and nothing is
 * screenshotted — the cards are deterministic build artefacts, so a link
 * preview cannot break because a headless browser timed out.
 *
 * The cards are drawn from the same design decisions as the product (the ink
 * canvas, the aurora accent, tabular figures for the price) but the values are
 * literal here rather than tokens. Satori has no CSS custom-property support,
 * so `var(--accent)` would silently render as nothing; duplicating the four
 * colours it needs is the honest trade, and `PALETTE` below is the one place
 * that duplication lives.
 */

const OUT_DIR = join(process.cwd(), 'dist', 'og');
const FONT_DIR = join(process.cwd(), 'node_modules', '@fontsource', 'inter', 'files');

const WIDTH = 1200;
const HEIGHT = 630;

/**
 * Mirrors the dark theme in `styles/tokens.css`. Satori cannot read custom
 * properties or `oklch()`, so these are the sRGB equivalents.
 */
const PALETTE = {
  canvas: '#080a0d',
  surface: '#12151b',
  text: '#f7f8f9',
  muted: '#9aa1ab',
  faint: '#5b626d',
  accent: '#3ecfd5',
  accentAlt: '#9b7cf0',
  border: '#242932',
} as const;

interface Card {
  /** Output filename, without extension. */
  slug: string;
  eyebrow: string;
  title: string;
  detail: string;
  /** Bottom-row facts. Rendered as a dot-separated strip. */
  facts: string[];
}

async function loadFonts(): Promise<SatoriOptions['fonts']> {
  // `.woff` rather than `.woff2`: Satori's opentype parser reads WOFF
  // directly, and the variable build's `fvar` table crashes it outright.
  const [regular, semibold, bold] = await Promise.all([
    readFile(join(FONT_DIR, 'inter-latin-400-normal.woff')),
    readFile(join(FONT_DIR, 'inter-latin-600-normal.woff')),
    readFile(join(FONT_DIR, 'inter-latin-700-normal.woff')),
  ]);

  return [
    { name: 'Inter', data: regular, weight: 400, style: 'normal' },
    { name: 'Inter', data: semibold, weight: 600, style: 'normal' },
    { name: 'Inter', data: bold, weight: 700, style: 'normal' },
  ];
}

/**
 * The card layout.
 *
 * Written as Satori's element tree rather than JSX so this script stays a
 * plain `.ts` file — it runs under tsx in the build, and a `.tsx` build script
 * would need its own JSX configuration for a single template.
 */
function card({ eyebrow, title, detail, facts }: Card): React.ReactNode {
  const node = (
    type: string,
    style: Record<string, unknown>,
    children?: unknown,
  ): Record<string, unknown> => ({
    type,
    props: children === undefined ? { style } : { style, children },
  });

  return node(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: WIDTH,
      height: HEIGHT,
      padding: 72,
      backgroundColor: PALETTE.canvas,
      // The aurora field, flattened to two radial gradients.
      backgroundImage: `radial-gradient(900px 520px at 88% 8%, ${PALETTE.accentAlt}26, transparent 70%), radial-gradient(760px 460px at 8% 92%, ${PALETTE.accent}1f, transparent 68%)`,
      fontFamily: 'Inter',
      color: PALETTE.text,
    },
    [
      // ---------------------------------------------------------- Wordmark
      node('div', { display: 'flex', alignItems: 'center', gap: 16 }, [
        node(
          'div',
          {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: PALETTE.surface,
            border: `1px solid ${PALETTE.border}`,
            color: PALETTE.accent,
            fontSize: 28,
            fontWeight: 700,
          },
          'N',
        ),
        node('div', { fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em' }, 'Nocta'),
      ]),

      // ------------------------------------------------------------- Body
      node('div', { display: 'flex', flexDirection: 'column' }, [
        node(
          'div',
          {
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: PALETTE.accent,
            marginBottom: 20,
          },
          eyebrow,
        ),
        node(
          'div',
          {
            fontSize: title.length > 44 ? 62 : 76,
            fontWeight: 700,
            letterSpacing: '-0.035em',
            lineHeight: 1.05,
            maxWidth: 940,
          },
          title,
        ),
        node(
          'div',
          {
            fontSize: 28,
            lineHeight: 1.45,
            color: PALETTE.muted,
            marginTop: 24,
            maxWidth: 860,
          },
          detail,
        ),
      ]),

      // ------------------------------------------------------------ Facts
      node(
        'div',
        {
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          paddingTop: 28,
          borderTop: `1px solid ${PALETTE.border}`,
          fontSize: 22,
          color: PALETTE.faint,
        },
        facts.flatMap((fact, index) =>
          index === 0
            ? [node('div', { display: 'flex' }, fact)]
            : [
                node('div', { display: 'flex', color: PALETTE.border }, '·'),
                node('div', { display: 'flex' }, fact),
              ],
        ),
      ),
    ],
  ) as unknown as React.ReactNode;
}

async function render(spec: Card, fonts: SatoriOptions['fonts']): Promise<void> {
  const svg = await satori(card(spec), { width: WIDTH, height: HEIGHT, fonts });

  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH },
    // No remote fetching: every glyph is embedded and there are no images.
    font: { loadSystemFonts: false },
  })
    .render()
    .asPng();

  await writeFile(join(OUT_DIR, `${spec.slug}.png`), png);
}

function buildCards(): Card[] {
  const cards: Card[] = [
    {
      slug: 'default',
      eyebrow: 'AI travel planning',
      title: 'Itineraries that read like a local wrote them.',
      detail:
        'A city, a mood and a budget. Nocta streams back an hour-by-hour plan with real venues and real walking times.',
      facts: [`${String(CITIES.length)} cities`, '100+ venues', 'No account'],
    },
    {
      slug: 'plan',
      eyebrow: 'Planner',
      title: 'Build the trip in five inputs.',
      detail:
        'Watch the planner reason as it works, then drag the result into a shape you actually like.',
      facts: ['Streamed generation', 'Drag to reorder', 'Free'],
    },
    {
      slug: 'route',
      eyebrow: 'Route builder',
      title: 'One trip, several cities.',
      detail:
        'Chain up to six. Nocta measures every hop, works out how long each city is worth, and totals the whole thing.',
      facts: ['Great-circle distances', 'Shareable as a link', 'Up to 6 stops'],
    },
    {
      slug: 'styleguide',
      eyebrow: 'Design system',
      title: 'Every token, live.',
      detail:
        'Colour, type, motion, glass and every UI primitive — documented as a route rather than a README.',
      facts: ['OKLCH tokens', 'Dark and light', 'WCAG AA'],
    },
  ];

  // One card per destination, so a shared "Plan Lisbon" link previews as Lisbon.
  for (const city of CITIES) {
    cards.push({
      slug: `city-${city.id}`,
      eyebrow: city.country,
      title: city.name,
      detail: city.tagline,
      facts: [
        `${String(city.avgDailyCost)} ${city.currency} a day`,
        `${String(Math.round(city.temperatureC))}°C`,
        `Best in ${city.bestSeasons[0] ?? 'spring'}`,
      ],
    });
  }

  return cards;
}

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });

  const fonts = await loadFonts();
  const cards = buildCards();

  // Sequential rather than parallel: resvg is CPU-bound and eleven concurrent
  // rasterisations on a two-core CI runner is slower than doing them in turn.
  for (const spec of cards) {
    await render(spec, fonts);
  }

  console.log(`[og] rendered ${String(cards.length)} cards to dist/og`);
}

main().catch((error: unknown) => {
  console.error('[og] generation failed', error);
  process.exitCode = 1;
});
