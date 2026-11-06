import { expect, test } from '@playwright/test';
import { acceptConsent, gotoReady, recordRequests } from './helpers';

test.describe('gold tools (Story 38)', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('jewelry value with a manual price', async ({ page }) => {
    await gotoReady(page, '/kalkulator-emas');
    await page
      .getByLabel('Pakai harga sendiri per gram (opsional)')
      .fill('2000000');
    await page.getByRole('button', { name: 'Perhiasan' }).click();
    await page.getByLabel('Berat perhiasan (gram)').fill('10');
    await page.getByLabel('Karat').selectOption({ label: '18K (75%)' });
    await expect(page.getByText('Rp15.000.000')).toBeVisible();
  });

  test('gold price page renders its sections', async ({ page }) => {
    await gotoReady(page, '/harga-emas');
    await expect(
      page.getByRole('heading', { name: 'Riwayat harga' }),
    ).toBeVisible();
  });

  test('gold amounts are never sent', async ({ page }) => {
    const traffic = recordRequests(page);
    await gotoReady(page, '/kalkulator-emas');
    await page
      .getByLabel('Pakai harga sendiri per gram (opsional)')
      .fill('1234567');
    await page.getByRole('button', { name: 'Perhiasan' }).click();
    await page.getByLabel('Berat perhiasan (gram)').fill('17');
    await expect(page.getByText('Rp').first()).toBeVisible();
    expect(traffic.containing('1234567')).toEqual([]);
  });
});
