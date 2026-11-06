import { expect, test } from '@playwright/test';
import { acceptConsent, gotoReady } from './helpers';

test.describe('token listrik (Story 37)', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('Rp100.000 on 1.300 VA with 3% regional tax is 67,2 kWh', async ({
    page,
  }) => {
    await gotoReady(page, '/kalkulator-token-listrik');
    await expect(page.locator('[aria-live="polite"] .text-3xl')).toHaveText(
      '67,2 kWh',
    );
  });

  test('answer page per nominal', async ({ page }) => {
    await gotoReady(page, '/token-listrik/100000');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Token Listrik 100 ribu Dapat Berapa kWh?',
    );
    await expect(page.locator('table').first()).toContainText('67,2 kWh');
    expect((await page.goto('/token-listrik/123'))?.status()).toBe(404);
  });
});
