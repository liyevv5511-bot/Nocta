import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

/**
 * Performance budget, enforced.
 *
 * A budget that is not checked by CI is a wish. This script measures what a
 * first-time visitor to `/` actually downloads — the entry chunk plus the
 * vendor chunks it statically imports plus the landing chunk — and fails the
 * build if the gzipped total exceeds the limit.
 *
 * Route chunks, GSAP, the map and the schema layer are excluded because they
 * are genuinely deferred: they are fetched on navigation or on scroll, not
 * before first paint. If a refactor accidentally pulls one of them into the
 * entry graph, the total moves and this fails — which is the point.
 */

const DIST = join(process.cwd(), 'dist', 'assets');

/** Gzipped kilobytes of JavaScript loaded before the hero can paint. */
const INITIAL_JS_BUDGET_KB = 200;

/** Gzipped kilobytes of CSS. One stylesheet, so this is the whole of it. */
const CSS_BUDGET_KB = 25;

/** Chunks fetched during the initial load of `/`. */
const INITIAL_CHUNKS = [/^index-/, /^react-/, /^motion-/, /^Landing-/];

async function main(): Promise<void> {
  const files = await readdir(DIST);

  const sizes = await Promise.all(
    files.map(async (file) => {
      const contents = await readFile(join(DIST, file));
      return { file, gzip: gzipSync(contents).byteLength };
    }),
  );

  const initial = sizes.filter(
    (entry) => entry.file.endsWith('.js') && INITIAL_CHUNKS.some((rx) => rx.test(entry.file)),
  );

  const css = sizes.filter((entry) => entry.file.endsWith('.css'));

  const jsKb = toKb(initial.reduce((sum, entry) => sum + entry.gzip, 0));
  const cssKb = toKb(css.reduce((sum, entry) => sum + entry.gzip, 0));

  console.log('\nInitial JavaScript (gzip):');
  for (const entry of [...initial].sort((a, b) => b.gzip - a.gzip)) {
    console.log(`  ${entry.file.padEnd(40)} ${toKb(entry.gzip).toFixed(1).padStart(7)} kB`);
  }
  console.log(
    `  ${'TOTAL'.padEnd(40)} ${jsKb.toFixed(1).padStart(7)} kB / ${String(INITIAL_JS_BUDGET_KB)} kB`,
  );
  console.log(`\nCSS (gzip): ${cssKb.toFixed(1)} kB / ${String(CSS_BUDGET_KB)} kB\n`);

  const failures: string[] = [];

  if (initial.length !== INITIAL_CHUNKS.length) {
    failures.push(
      `Expected ${String(INITIAL_CHUNKS.length)} initial chunks, found ${String(initial.length)}. ` +
        'The chunking strategy in vite.config.ts has changed — update this budget deliberately.',
    );
  }
  if (jsKb > INITIAL_JS_BUDGET_KB) {
    failures.push(
      `Initial JS is ${jsKb.toFixed(1)} kB, over the ${String(INITIAL_JS_BUDGET_KB)} kB budget.`,
    );
  }
  if (cssKb > CSS_BUDGET_KB) {
    failures.push(`CSS is ${cssKb.toFixed(1)} kB, over the ${String(CSS_BUDGET_KB)} kB budget.`);
  }

  if (failures.length > 0) {
    for (const failure of failures) console.error(`✗ ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log('✓ Within budget.\n');
}

function toKb(bytes: number): number {
  return bytes / 1024;
}

main().catch((error: unknown) => {
  console.error('[budget] check failed', error);
  process.exitCode = 1;
});
