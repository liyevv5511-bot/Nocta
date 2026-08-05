import { expect, test } from '@playwright/test';

// Emulated explicitly, before every navigation.
//
// `test.use({ reducedMotion })` sets the option on the browser context, and in
// this Playwright/Chromium pairing that does not reach `matchMedia` — the page
// reported `prefers-reduced-motion: no-preference` and happily installed the
// smooth-scroll layer. `emulateMedia` drives the emulation directly, and doing
// it before `goto` is what makes it true during the first render, which is the
// only render that decides whether Lenis is constructed at all.
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

/**
 * `prefers-reduced-motion` is a requirement, so it gets a test.
 *
 * The claim being verified is not "animations are shorter" — it is that the
 * product is fully usable and fully legible with every animation off. A
 * headline that only becomes visible at the end of a character-reveal, or a
 * section that only fades in on scroll, fails here and nowhere else.
 */
test.describe('reduced motion', () => {
  test('the hero headline is fully visible without animating', async ({ page }) => {
    await page.goto('/');

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Itineraries that read like a local wrote them.');

    // Characters must not be left mid-reveal at partial opacity.
    const opacity = await heading.evaluate((node) => getComputedStyle(node).opacity);
    expect(Number(opacity)).toBe(1);
  });

  test('below-the-fold sections are readable once scrolled to', async ({ page }) => {
    await page.goto('/');

    const faq = page.getByRole('heading', { name: 'The obvious questions.' });
    await faq.scrollIntoViewIfNeeded();
    await expect(faq).toBeVisible({ timeout: 20_000 });
  });

  test('smooth scrolling is not installed', async ({ page }) => {
    await page.goto('/');
    // Lenis is not constructed at all under reduced motion — not merely sped up.
    const hasLenis = await page.evaluate(() => '__lenis' in window);
    expect(hasLenis).toBe(false);
  });

  test('the planner still completes a generation', async ({ page }) => {
    await page.goto('/plan?destination=Lisbon');
    await page.getByRole('button', { name: /Build 3 days/ }).click();

    await expect(page.getByRole('heading', { name: /3 days in Lisbon/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole('article').first()).toBeVisible();
  });
});
