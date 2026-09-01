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

    // Read the `r` param via the URL API rather than checking for the raw
    // percent-encoded substring in page.url() - `:` and `/` aren't in the
    // WHATWG URL Standard's query percent-encode set, so browsers are free
    // to leave them unescaped when normalizing; Firefox does, Chromium and
    // WebKit happen to preserve the original encoding. Both are spec-
    // compliant, so assert on the decoded value instead.
    await page.waitForURL(/localhost:8000\/signin\?r=/);
    const redirectParam = new URL(page.url()).searchParams.get('r');
    expect(redirectParam).toBe('http://localhost:4000/experiences');

    await page.getByLabel('Email').fill(ADMIN_EMAIL);
    await page.getByLabel('Password').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await page.waitForURL(/localhost:4000\/experiences$/);
    await expect(page.getByRole('heading', { name: 'Experiences' })).toBeVisible();
  });

  test('a plain USER role is bounced to /unauthorized after signing in', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/localhost:8000\/signin/);

    await page.getByLabel('Email').fill('user@muzanella.com');
    await page.getByLabel('Password').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await page.waitForURL(/localhost:4000\/unauthorized$/);
    await expect(page.getByText('Akses Ditolak')).toBeVisible();
  });
});
