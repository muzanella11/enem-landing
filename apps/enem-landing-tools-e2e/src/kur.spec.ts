import { expect, test } from '@playwright/test';
import { acceptConsent, gotoReady, recordRequests } from './helpers';

test.describe('KUR (Story 52)', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('Rp100 juta, 12 months, 6%: matches the BNI table', async ({ page }) => {
    const traffic = recordRequests(page);
    await gotoReady(page, '/simulasi-kur');
    await page.getByLabel('Plafon pinjaman').fill('100000000');
    await page.getByLabel('Tenor (bulan)').selectOption('12');
    await expect(page.locator('[aria-live] .text-3xl')).toHaveText(
      /Rp8\.606\.64[34]/,
    );
    await page.getByLabel('Sektor usaha').selectOption('perdagangan');
    await page.getByLabel('Pinjaman KUR ke-').fill('3');
    await expect(page.locator('[aria-live]')).toContainText('bunga 8% efektif');
    expect(traffic.containing('100000000')).toEqual([]);
  });
});
