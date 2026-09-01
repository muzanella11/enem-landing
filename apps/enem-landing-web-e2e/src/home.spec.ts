import { expect, test } from '@playwright/test';

/**
 * Requires enem-landing-api running (handled by playwright.config.mts's
 * `webServer` array). No seeded content is assumed - `site-profile` /
 * `experiences` / `skills` all fall back to empty state gracefully when a
 * fresh DB has no rows yet, so this asserts structure (nav, sections,
 * hero fallback copy), not specific seeded data.
 */
test.describe('home', () => {
  test('renders navigation and all main sections', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Nurfirliana Muzanella', level: 1 })).toBeVisible();

    const nav = page.getByRole('navigation');
    for (const label of ['Experience', 'Portfolio', 'About', 'Contact']) {
      await expect(nav.getByRole('link', { name: label })).toBeVisible();
    }

    await expect(page.getByRole('heading', { name: 'Experience', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Portfolio', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'About', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Contact Me', level: 2 })).toBeVisible();
  });
});
