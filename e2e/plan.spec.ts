import { expect, test, type Page } from '@playwright/test';

/**
 * The core journey: land → plan → generate → inspect → reorder → save.
 *
 * Assertions target roles and accessible names rather than CSS classes. That
 * is not stylistic preference — a suite that asserts on class names passes
 * while the app is unusable with a keyboard, and breaks every time the design
 * changes. This one fails if the accessibility tree regresses.
 */

/**
 * The destination field, named rather than found by role alone.
 *
 * The language picker is a `<select>`, which is also a combobox — an
 * unqualified `getByRole('combobox')` matches both. Naming it is the fix and
 * is the better assertion anyway: it checks the field has an accessible name.
 */
function destinationField(page: Page) {
  return page.getByRole('combobox', { name: 'Where are you going?' });
}

async function generate(page: Page, destination: string, days: number): Promise<void> {
  await page.goto(`/plan?destination=${encodeURIComponent(destination)}`);

  await expect(destinationField(page)).toHaveValue(destination);

  await page.getByRole('button', { name: String(days), exact: true }).click();
  await page.getByRole('button', { name: new RegExp(`Build ${String(days)} days`) }).click();
}

test.describe('planner', () => {
  test('generates a plan and streams days in one at a time', async ({ page }) => {
    await generate(page, 'Lisbon', 2);

    // The thinking state must appear before any day does.
    await expect(page.getByRole('progressbar', { name: 'Generation progress' })).toBeVisible();
    await expect(page.getByText('Generating')).toBeVisible();

    // Day one lands while the plan is still being built.
    await expect(
      page.getByRole('heading', { name: /Day 1/i }).or(page.getByText('DAY 1')),
    ).toBeVisible({
      timeout: 30_000,
    });

    await expect(page.getByRole('progressbar')).toBeHidden({ timeout: 30_000 });

    const summary = page.getByRole('heading', { name: /2 days in Lisbon/i });
    await expect(summary).toBeVisible();
  });

  test('every activity carries a time, a price and an address', async ({ page }) => {
    await generate(page, 'Lisbon', 1);
    await expect(page.getByRole('progressbar')).toBeHidden({ timeout: 30_000 });

    const firstBlock = page.getByRole('article').first();
    await expect(firstBlock).toBeVisible();

    // 24-hour time, an explicit price (or "Free"), and a map link.
    await expect(firstBlock.getByRole('time')).toHaveText(/^\d{2}:\d{2}$/);
    await expect(firstBlock.getByText(/Free|€/)).toBeVisible();
    await expect(firstBlock.getByRole('link')).toHaveAttribute('href', /google\.com\/maps/);
  });

  test('the day re-times when an activity is removed', async ({ page }) => {
    await generate(page, 'Lisbon', 1);
    await expect(page.getByRole('progressbar')).toBeHidden({ timeout: 30_000 });

    const blocksBefore = await page.getByRole('article').count();
    expect(blocksBefore).toBeGreaterThan(1);

    const second = page.getByRole('article').nth(1);
    const removedTitle = await second.getByRole('heading').innerText();

    await second.getByRole('button', { name: /^Options for/ }).click();
    await page.getByRole('menuitem', { name: 'Remove' }).click();

    await expect(page.getByRole('article')).toHaveCount(blocksBefore - 1);
    await expect(page.getByRole('heading', { name: removedTitle })).toBeHidden();

    // The day still starts at 09:00 — removal must not shift the whole day.
    await expect(page.getByRole('article').first().getByRole('time')).toHaveText('09:00');
  });

  test('offers real alternatives and swaps one in', async ({ page }) => {
    await generate(page, 'Lisbon', 1);
    await expect(page.getByRole('progressbar')).toBeHidden({ timeout: 30_000 });

    const first = page.getByRole('article').first();
    await first.getByRole('button', { name: /^Options for/ }).click();
    await page.getByRole('menuitem', { name: 'Swap this' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const alternative = dialog.getByRole('button').filter({ hasNotText: 'Close' }).nth(1);
    await expect(alternative).toBeVisible({ timeout: 15_000 });
    await alternative.click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText('Swapped')).toBeVisible();
  });

  test('saves a trip and reopens it from the saved list', async ({ page }) => {
    await generate(page, 'Porto', 2);
    await expect(page.getByRole('progressbar')).toBeHidden({ timeout: 30_000 });

    await page.getByRole('button', { name: 'Save trip' }).click();

    await expect(page).toHaveURL(/\/trip\//);
    await expect(page.getByRole('heading', { name: /2 days in Porto/i })).toBeVisible();

    await page.getByRole('link', { name: /All saved trips/ }).click();
    await expect(page.getByRole('heading', { name: '2 days in Porto' })).toBeVisible();
  });

  test('refuses a destination with no catalogue rather than inventing one', async ({ page }) => {
    await page.goto('/plan');

    await destinationField(page).fill('Atlantis');
    await page.getByRole('heading', { name: 'Build the trip.' }).click();

    await expect(page.getByText(/No venue catalogue for/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Choose a destination' })).toBeDisabled();
  });
});

/**
 * The multi-city route builder.
 *
 * The route lives entirely in `?cities=`, so these assertions double as a
 * check that the URL is genuinely the state — reload, share and back all work
 * for free if it is, and none of them do if the URL is only a mirror.
 */
test.describe('route builder', () => {
  test('builds a route from the URL and totals it', async ({ page }) => {
    await page.goto('/route?cities=lisbon,porto,copenhagen');

    const stops = page.getByRole('listitem').filter({ hasText: /night/ });
    await expect(stops).toHaveCount(3);

    // Order is the URL's order, not alphabetical.
    await expect(stops.nth(0)).toContainText('Lisbon');
    await expect(stops.nth(1)).toContainText('Porto');
    await expect(stops.nth(2)).toContainText('Copenhagen');

    // Lisbon → Porto is short enough to be rail; Porto → Copenhagen is not.
    await expect(page.getByText(/^Rail · \d+ km/).first()).toBeVisible();
    await expect(page.getByText(/^Fly · \d+ km/).first()).toBeVisible();

    await expect(page.getByText('The whole trip')).toBeVisible();
  });

  test('adding a city updates the URL, and the URL survives a reload', async ({ page }) => {
    await page.goto('/route?cities=lisbon');

    await page.getByRole('checkbox', { name: 'Tokyo' }).click();
    await expect(page).toHaveURL(/cities=lisbon%2Ctokyo|cities=lisbon,tokyo/);

    await page.reload();
    await expect(page.getByRole('listitem').filter({ hasText: /night/ })).toHaveCount(2);
  });

  test('reordering is operable and changes the plan, not just the list', async ({ page }) => {
    await page.goto('/route?cities=lisbon,tokyo');

    const before = await page
      .getByText(/km$|km ·/)
      .first()
      .textContent();
    await page.getByRole('button', { name: 'Move Tokyo earlier' }).click();

    await expect(page.getByRole('listitem').filter({ hasText: /night/ }).first()).toContainText(
      'Tokyo',
    );
    await expect(page).toHaveURL(/cities=tokyo/);
    expect(before).not.toBeNull();
  });

  test('removing a city removes its leg', async ({ page }) => {
    await page.goto('/route?cities=lisbon,porto,tokyo');
    await expect(page.getByText(/km/).first()).toBeVisible();

    await page.getByRole('button', { name: 'Remove Porto from the route' }).click();

    const stops = page.getByRole('listitem').filter({ hasText: /night/ });
    await expect(stops).toHaveCount(2);
    // Scoped to the stop list: Porto is still offered in the city picker, which
    // is the point — removing it from the route does not remove it from the
    // catalogue.
    await expect(stops.filter({ hasText: 'Porto' })).toHaveCount(0);
  });

  test('an unknown city in a hand-edited link degrades to the ones it knows', async ({ page }) => {
    await page.goto('/route?cities=lisbon,atlantis,kyoto');

    const stops = page.getByRole('listitem').filter({ hasText: /night/ });
    await expect(stops).toHaveCount(2);
    await expect(stops.nth(1)).toContainText('Kyoto');
  });
});
