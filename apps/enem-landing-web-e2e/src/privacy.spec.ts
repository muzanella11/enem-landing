import { expect, test } from '@playwright/test';

test.describe('privacy page (Story 56)', () => {
  test('is linked from the footer and covers analytics and ads', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Privacy and cookies' }).click();
    await page.waitForURL(/\/privacy$/);

    await expect(
      page.getByRole('heading', { name: 'Privacy and cookies', level: 1 }),
    ).toBeVisible();
    for (const heading of [
      'What we record ourselves',
      'Google Analytics',
      'Advertising',
    ]) {
      await expect(
        page.getByRole('heading', { name: heading, level: 2 }),
      ).toBeVisible();
    }
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://muzanella.com/privacy',
    );
    await expect(
      page.locator('a[href="https://adssettings.google.com"]'),
    ).toBeVisible();
  });
});
