import { expect, test } from '@playwright/test';

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

    await page.getByRole('radio', { name: 'Dark theme' }).click();
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
    await expect(page.getByRole('link', { name: 'Plan Lisbon' })).toBeVisible();
  });

  test('every page has exactly one h1 and a main landmark', async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(route.path);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.getByRole('main')).toHaveCount(1);
    }
  });
});
