import { expect, test, type Page } from '@playwright/test';

/**
 * Picks a language the way a visitor does.
 *
 * Located structurally rather than by accessible name: the control's own label
 * is translated, so `getByLabel('Language')` stops matching the moment it
 * works. Below the `md` breakpoint it lives inside the collapsed menu, so this
 * opens it first — which exercises the mobile path rather than skipping it.
 */
async function selectLanguage(page: Page, language: string): Promise<void> {
  // `:visible` matters: the header renders the control at every width and
  // hides it with CSS below `md`, where the collapsed menu carries its own.
  // Two exist in the DOM and only one of them can be operated.
  if ((await page.locator('select:visible').count()) === 0) {
    await page.locator('[aria-controls="mobile-nav"]').click();
  }

  await page.locator('select:visible').first().selectOption(language);
}

/**
 * Localisation, end to end.
 *
 * The dictionary tests already prove the strings exist and keep their
 * placeholders. What only a browser can show is the rest of it: that the
 * language is detected, that `<html lang>` follows, that the choice survives a
 * reload, and — the part that is usually forgotten — that the *numbers* are
 * localised too, not just the words around them.
 */

test.describe('language detection', () => {
  test.describe('Azerbaijani', () => {
    test.use({ locale: 'az-AZ' });

    test('detects from the browser and marks the document', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));

      await page.goto('/plan');

      await expect(page.locator('html')).toHaveAttribute('lang', 'az');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Səfəri qur.');
      expect(errors).toEqual([]);
    });
  });

  test.describe('Russian', () => {
    test.use({ locale: 'ru-RU' });

    test('detects from the browser', async ({ page }) => {
      await page.goto('/plan');

      await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Соберите поездку.');
    });

    test('localises the figures, not only the words', async ({ page }) => {
      await page.goto('/plan');

      // Russian puts the currency symbol after the amount; English before.
      // Getting this wrong is the tell of a project that translated strings
      // and left `Intl` on a hardcoded locale.
      await expect(page.getByText(/120\s?€/)).toBeVisible();
    });
  });

  test('falls back to English for a language with no dictionary', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'de-DE' });
    const page = await context.newPage();

    await page.goto('/plan');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Build the trip.');

    await context.close();
  });
});

test.describe('language switching', () => {
  test('switches on demand and persists across a reload', async ({ page }) => {
    await page.goto('/plan');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Build the trip.');

    await selectLanguage(page, 'ru');

    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Соберите поездку.');

    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Соберите поездку.');
  });

  test('the stored choice beats the browser preference', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'ru-RU' });
    const page = await context.newPage();

    await page.goto('/plan');
    await selectLanguage(page, 'az');
    await expect(page.locator('html')).toHaveAttribute('lang', 'az');

    await page.reload();
    // The browser still says Russian; the visitor said Azerbaijani.
    await expect(page.locator('html')).toHaveAttribute('lang', 'az');

    await context.close();
  });

  test('carries the language across a client navigation', async ({ page }) => {
    await page.goto('/');
    await selectLanguage(page, 'az');

    await page.getByRole('contentinfo').getByRole('link', { name: 'Səfər planla' }).click();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Səfəri qur.');
    await expect(page.locator('html')).toHaveAttribute('lang', 'az');
  });
});

test.describe('non-English dictionaries', () => {
  test('are not in the initial payload', async ({ page }) => {
    const chunks: string[] = [];
    page.on('request', (request) => {
      if (request.resourceType() === 'script') chunks.push(request.url());
    });

    await page.goto('/plan');
    await page.waitForLoadState('networkidle');

    expect(
      chunks.filter((url) => /\/(az|ru)-[\w-]+\.js$/.test(url)),
      'a translation was downloaded before it was asked for',
    ).toEqual([]);

    // And it arrives when it is asked for.
    await selectLanguage(page, 'az');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Səfəri qur.');
    expect(chunks.some((url) => /\/az-[\w-]+\.js$/.test(url))).toBe(true);
  });
});
