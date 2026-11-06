import { expect, test } from '@playwright/test';
import { acceptConsent, gotoReady, recordRequests } from './helpers';

const result = '[aria-live] .text-3xl';

test.describe('gold pawn (Story 53)', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('KCA redemption after 30 days', async ({ page }) => {
    const traffic = recordRequests(page);
    await gotoReady(page, '/simulasi-gadai-emas');
    await page
      .getByLabel('Pinjaman yang diambil (kosongkan untuk maksimal)')
      .fill('10000000');
    await page.getByLabel('Berat emas (gram)').fill('10');
    await page.getByLabel('Harga taksiran per gram (24K)').fill('2000000');
    await page
      .getByLabel('Kadar')
      .selectOption({ label: '24K (emas murni, 99,9%)' });
    await expect(page.locator(result)).toHaveText('Rp10.240.000');
    expect(traffic.containing('10000000')).toEqual([]);
  });

  test('Krasida instalment, flat like Pegadaian', async ({ page }) => {
    await gotoReady(page, '/simulasi-gadai-emas');
    await page.getByLabel('Gadai emas angsuran (bulanan)').check();
    await page.getByLabel('Berat emas (gram)').fill('20');
    await page.getByLabel('Harga taksiran per gram (24K)').fill('2000000');
    await page
      .getByLabel('Kadar')
      .selectOption({ label: '24K (emas murni, 99,9%)' });
    await page
      .getByLabel('Pinjaman yang diambil (kosongkan untuk maksimal)')
      .fill('20000000');
    await page.getByLabel('Tenor').selectOption('24');
    await expect(page.locator(result)).toHaveText('Rp1.083.333');
  });

  test('cicil emas', async ({ page }) => {
    await gotoReady(page, '/simulasi-cicil-emas');
    await page.getByLabel('Harga per gram').fill('2000000');
    await page.getByLabel('Uang muka (%)').fill('20');
    await page.getByLabel('Margin per bulan (%)').fill('1');
    await expect(page.locator(result)).toHaveText('Rp1.493.333');
  });
});
