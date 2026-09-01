import type { Page } from '@playwright/test';

export const ADMIN_EMAIL = 'superadmin@muzanella.com';
export const ADMIN_PASSWORD = 'letmeinfortesting';

/**
 * Drives the real cross-app redirect flow (CMS -> account-web signin ->
 * back to CMS) rather than injecting a cookie directly, so every spec that
 * needs an authenticated session also exercises the actual SSO handoff.
 * `login-redirect.spec.ts` asserts the redirect mechanics themselves in
 * more detail; this helper is for specs where auth is just setup.
 */
export const loginAsSuperAdmin = async (page: Page, targetPath = '/') => {
  await page.goto(targetPath);
  await page.waitForURL(/localhost:8000\/signin/);
  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Password').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(new RegExp(`localhost:4000${targetPath}$`));
};
