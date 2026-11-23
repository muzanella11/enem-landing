import type { Page } from '@playwright/test';

export const SUPER_ADMIN_EMAIL = 'superadmin@muzanella.com';
export const USER_EMAIL = 'user@muzanella.com';
export const PASSWORD = 'letmeinfortesting';

/** Real SSO handoff: monitor -> account-web signin -> back to monitor. */
export const signIn = async (page: Page, email: string, targetPath = '/') => {
  await page.goto(targetPath);
  await page.waitForURL(/localhost:8000\/signin/);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
};

export const loginAsSuperAdmin = async (page: Page, targetPath = '/') => {
  await signIn(page, SUPER_ADMIN_EMAIL, targetPath);
  await page.waitForURL(new RegExp(`localhost:4003${targetPath}$`));
};
