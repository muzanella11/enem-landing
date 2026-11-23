import { expect, type Page } from '@playwright/test';

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

/** Vue has mounted (hydrated) the page, so clicks are handled. */
export const waitForHydration = (page: Page) =>
  page.waitForFunction(() =>
    Boolean(
      (document.querySelector('#__nuxt') as { __vue_app__?: unknown } | null)
        ?.__vue_app__,
    ),
  );

/**
 * Clicks a tab until it is actually selected. `waitForHydration` only
 * proves the Vue app exists; a page's tabs can still be mid-hydration, and
 * Chromium/WebKit sometimes click before then and the click is lost.
 */
export const selectTab = async (
  page: Page,
  name: string,
  options: { exact?: boolean } = {},
) => {
  const tab = page.getByRole('tab', { name, ...options });
  await expect(async () => {
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true', {
      timeout: 1_000,
    });
  }).toPass();
};

export const loginAsSuperAdmin = async (page: Page, targetPath = '/') => {
  await signIn(page, SUPER_ADMIN_EMAIL, targetPath);
  // Deep links carry a query string the page may normalize: match the path.
  const path = targetPath.split('?')[0];
  await page.waitForURL(
    (url) => url.host === 'localhost:4003' && url.pathname === path,
  );
  await waitForHydration(page);
};
