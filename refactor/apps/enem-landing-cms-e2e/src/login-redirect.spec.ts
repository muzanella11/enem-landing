import { expect, test } from '@playwright/test';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from './helpers/auth.js';

/**
 * Requires a seeded local MySQL/Redis (Story 03 - `migration:run` + `seed`)
 * and all four servers running (handled by playwright.config.mts's
 * `webServer` array): enem-landing-account-api, enem-landing-api,
 * enem-landing-account-web, enem-landing-cms.
 */
test.describe('login-redirect', () => {
  test('unauthenticated access redirects to account-web signin, then back to the originally-requested page', async ({
    page,
  }) => {
    await page.goto('/experiences');

    await page.waitForURL(/localhost:8000\/signin\?r=/);
    expect(page.url()).toContain(encodeURIComponent('localhost:4000/experiences'));

    await page.getByLabel('Email').fill(ADMIN_EMAIL);
    await page.getByLabel('Password').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await page.waitForURL(/localhost:4000\/experiences$/);
    await expect(page.getByRole('heading', { name: 'Experiences' })).toBeVisible();
  });

  test('a plain USER role is bounced to /unauthorized after signing in', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/localhost:8000\/signin/);

    await page.getByLabel('Email').fill('user@enem-landing.local');
    await page.getByLabel('Password').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await page.waitForURL(/localhost:4000\/unauthorized$/);
    await expect(page.getByText('Akses Ditolak')).toBeVisible();
  });
});
