import { expect, test } from '@playwright/test';

/**
 * Requires enem-landing-api running (handled by playwright.config.mts's
 * `webServer` array). No seeded content is assumed - `site-profile` /
 * `experiences` / `skills` all fall back to empty state gracefully when a
 * fresh DB has no rows yet, so this asserts structure (nav, sections,
 * a non-empty hero heading), not specific seeded/mutated data.
 */
test.describe('home', () => {
  test('renders navigation and all main sections', async ({ page }) => {
    await page.goto('/');

    // Hero title is whatever `site-profile`'s `heroTitle` currently holds
    // (shared singleton row, mutated by cms-e2e's site-profile.spec.ts and
    // never reset - the DB isn't reseeded between e2e suites in the same
    // job run), so assert structure - a visible, non-empty level-1
    // heading - not the specific text.
    const heroHeading = page.getByRole('heading', { level: 1 });
    await expect(heroHeading).toBeVisible();
    await expect(heroHeading).not.toBeEmpty();

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
