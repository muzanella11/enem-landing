import { expect, test } from '@playwright/test';

/**
 * Requires a seeded local MySQL/Redis (Story 03 — `migration:run` + `seed`)
 * and both `enem-landing-account` and `enem-landing-account-web` running
 * (handled by playwright.config.mts's `webServer` array).
 */
const ADMIN_EMAIL = 'superadmin@enem-landing.local';
const ADMIN_PASSWORD = 'letmeinfortesting';
const REDIRECT_TARGET = 'http://localhost:3000/health';

test.describe('signin', () => {
  test('valid credentials set the cookie and redirect to r', async ({ page, context }) => {
    await page.goto(`/signin?r=${encodeURIComponent(REDIRECT_TARGET)}`);
    await page.getByLabel('Email').fill(ADMIN_EMAIL);
    await page.getByLabel('Password').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await page.waitForURL(REDIRECT_TARGET);

    const cookies = await context.cookies();
    expect(cookies.some((c) => c.name === 'ENEM_LANDING_AUTH_TOKEN')).toBe(true);
  });

  test('invalid credentials show an error and do not redirect', async ({ page }) => {
    await page.goto(`/signin?r=${encodeURIComponent(REDIRECT_TARGET)}`);
    await page.getByLabel('Email').fill(ADMIN_EMAIL);
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.locator('p.text-red-600')).toBeVisible();
    expect(page.url()).toContain('/signin');
  });

  test('an already-valid session bounces straight to r without showing the form', async ({
    page,
  }) => {
    // Establish a valid session first (needs its own `r` — without one,
    // a successful signin falls back to `/`, which redirects to `/signin`
    // with no `r` either, bouncing forever).
    await page.goto(`/signin?r=${encodeURIComponent(REDIRECT_TARGET)}`);
    await page.getByLabel('Email').fill(ADMIN_EMAIL);
    await page.getByLabel('Password').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(REDIRECT_TARGET);

    // Landing on /signin again with a still-valid cookie should bounce
    // immediately (useMauAuthBounceBack equivalent) rather than show the form.
    await page.goto(`/signin?r=${encodeURIComponent(REDIRECT_TARGET)}`);
    await page.waitForURL(REDIRECT_TARGET);
  });
});
