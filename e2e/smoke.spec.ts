import { expect, test } from '@playwright/test';

import { resolveSiteUrl } from '../src/config/site';

/**
 * The origin the build stamped into the canonical links and the sitemap.
 *
 * Read from the same resolver the build uses rather than hardcoded: the suite
 * runs against a local build where that resolves to localhost, and against a
 * deploy preview where it resolves to the deployment's own hostname. Asserting
 * a literal domain would make the suite pass only on a machine that happened
 * to match it.
 */
const SITE_URL = resolveSiteUrl();

/**
 * Route smoke and cross-cutting guarantees.
 *
 * These are the checks that catch a bad deploy rather than a bad feature: a
 * chunk that fails to load, an SPA fallback that is not configured, a theme
 * that flashes, a page with no title.
 */

const ROUTES = [
  { path: '/', heading: /Itineraries that read like a local wrote them\./ },
  { path: '/plan', heading: /Build the trip\./ },
  { path: '/saved', heading: /Your trips\./ },
  { path: '/styleguide', heading: /Every token, live\./ },
  { path: '/destination/lisbon', heading: /^Lisbon$/ },
] as const;

test.describe('routes', () => {
  for (const route of ROUTES) {
    test(`${route.path} renders, titles itself and logs no errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });

      await page.goto(route.path);

      await expect(page.getByRole('heading', { level: 1 })).toContainText(route.heading);
      await expect(page).toHaveTitle(/Nocta/);

      // A canonical link per route — SEO for an SPA is not automatic.
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);

      expect(errors, `console errors on ${route.path}`).toEqual([]);
    });
  }

  test('an unknown path renders the 404 route, not a blank page', async ({ page }) => {
    await page.goto('/this-does-not-exist');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/wandered off the map/i);
  });

  test('a deep link is served by the SPA fallback', async ({ page }) => {
    const response = await page.goto('/trip/trip_lisbon_missing');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('theme', () => {
  test('applies the stored theme before first paint, with no flash', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.setItem('nocta.theme', 'light');
    });

    await page.reload();

    // The inline blocking script must have run before React mounted.
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    const colorScheme = await page.evaluate(() => document.documentElement.style.colorScheme);
    expect(colorScheme).toBe('light');
  });

  test('the toggle switches themes and persists the choice', async ({ page }) => {
    await page.goto('/styleguide');

    // Scoped to the page's own control rather than the header's: the
    // styleguide documents the toggle, so two exist — and the header's is
    // collapsed into the menu below the `sm` breakpoint, where this suite also
    // runs.
    await page.getByRole('main').getByRole('radio', { name: 'Dark theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});

test.describe('accessibility', () => {
  test('the skip link is the first thing a keyboard user reaches', async ({
    page,
    browserName,
  }) => {
    // WebKit does not put links in the tab order unless macOS "Full Keyboard
    // Access" is on, so Tab lands elsewhere. That is a platform default, not
    // an app defect — and the assertion is about desktop keyboard use anyway.
    test.skip(browserName === 'webkit', 'WebKit excludes links from tab order by default');

    await page.goto('/');
    await page.keyboard.press('Tab');

    const focused = page.locator(':focus');
    await expect(focused).toHaveText('Skip to content');
    await expect(focused).toBeVisible();
  });

  test('the map is operable without a pointer', async ({ page }) => {
    await page.goto('/');

    // The canvas has no accessibility surface; the listbox beside it does.
    const list = page.getByRole('listbox', { name: 'Destinations' });
    await list.scrollIntoViewIfNeeded();

    const lisbon = list.getByRole('option', { name: /Lisbon/ });
    await expect(lisbon).toBeVisible({ timeout: 20_000 });

    await lisbon.click();
    await expect(lisbon).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('link', { name: 'About Lisbon' })).toBeVisible();
  });

  test('every page has exactly one h1 and a main landmark', async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(route.path);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.getByRole('main')).toHaveCount(1);
    }
  });
});

/**
 * Prerendering.
 *
 * Asserted with JavaScript switched off, which is the only way to prove the
 * markup came from the build rather than from the client router a moment
 * later. This is what a link unfurler, a text browser, and a crawler that does
 * not execute scripts actually receive.
 */
/**
 * Client-side navigation *away from a prerendered page*.
 *
 * This is the case the suite missed for a long time: almost every other test
 * either starts with `goto` or starts on a route with no prerendered file, so
 * hydration was never followed by a navigation. Two real bugs lived in that
 * gap — deleting head nodes React had adopted, and reverting GSAP's pinned
 * layout after React had already removed the DOM. Both only ever surfaced on
 * the second page.
 */
test.describe('navigation after hydration', () => {
  for (const from of ['/', '/styleguide', '/destination/lisbon']) {
    test(`navigates from ${from} to the planner without breaking`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });

      await page.goto(from);
      // Far enough for the pinned scroll section to have restructured the DOM.
      // `window.scrollTo` rather than `mouse.wheel`: mobile WebKit has no
      // wheel, and the point is to reach the scroll position, not to emulate
      // the input that gets there.
      await page.evaluate(() => {
        window.scrollTo(0, 4000);
      });
      await page.waitForTimeout(600);

      // The footer link rather than the header's: the main nav collapses into
      // a menu below `md`, and this suite runs at both widths.
      await page.getByRole('contentinfo').getByRole('link', { name: 'Plan a trip' }).click();

      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Build the trip.');
      expect(errors, `console errors navigating from ${from}`).toEqual([]);
    });
  }

  test('metadata follows the route rather than staying on the first one', async ({ page }) => {
    await page.goto('/destination/lisbon');
    await expect(page).toHaveTitle(/Lisbon, Portugal/);

    await page.getByRole('contentinfo').getByRole('link', { name: 'Plan a trip' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Build the trip.');

    await expect(page).toHaveTitle(/Plan a trip/);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE_URL}/plan`);
  });
});

test.describe('prerendered HTML', () => {
  test.use({ javaScriptEnabled: false });

  test('the landing page has its content, not an empty shell', async ({ page }) => {
    await page.goto('/');

    // Element selectors rather than roles: with scripting off there is no
    // hydration, and the question being asked is "did the build put this in
    // the response", which is a DOM question.
    await expect(page.locator('h1')).toContainText(
      'Itineraries that read like a local wrote them.',
    );

    // Below the fold, behind its own lazy boundary — the renderer waited for it.
    await expect(page.locator('#faq-heading')).toHaveText('The obvious questions.');

    // And it is actually legible: Framer's initial state is opacity 0, so
    // without the noscript stylesheet this markup would render invisible.
    await expect(page.locator('h1')).toBeVisible();
  });

  test('a destination page carries its own metadata and its city card', async ({ page }) => {
    await page.goto('/destination/reykjavik');

    await expect(page).toHaveTitle(/Reykjavík, Iceland/);
    await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${SITE_URL}/destination/reykjavik`,
    );
    await expect(page.locator('head meta[property="og:image"]')).toHaveAttribute(
      'content',
      `${SITE_URL}/og/city-reykjavik.png`,
    );
    await expect(page.locator('h1')).toHaveText('Reykjavík');
  });

  test('every destination page describes itself distinctly', async ({ page }) => {
    const seen = new Set<string>();

    for (const city of ['lisbon', 'tokyo', 'marrakesh']) {
      await page.goto(`/destination/${city}`);
      const description = await page
        .locator('head meta[name="description"]')
        .getAttribute('content');

      expect(description, `${city} has a description`).toBeTruthy();
      expect(seen.has(description ?? ''), `${city} description is unique`).toBe(false);
      seen.add(description ?? '');
    }
  });

  test('structured data is emitted for a destination', async ({ page }) => {
    await page.goto('/destination/kyoto');

    const blocks = await page.locator('head script[type="application/ld+json"]').allTextContents();
    const parsed = blocks.map((block) => JSON.parse(block) as { '@type'?: string; name?: string });

    const destination = parsed.find((entry) => entry['@type'] === 'TouristDestination');
    expect(destination?.name).toBe('Kyoto');
  });

  test('the Open Graph card is a real image', async ({ request }) => {
    const response = await request.get('/og/city-tokyo.png');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
    // A blank or failed render would be a few hundred bytes.
    expect((await response.body()).byteLength).toBeGreaterThan(20_000);
  });

  test('the sitemap lists the destination paths', async ({ request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text();

    expect(sitemap).toContain(`<loc>${SITE_URL}/destination/lisbon</loc>`);
    expect(sitemap).not.toContain('?destination=');
  });
});
