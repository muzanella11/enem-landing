import { expect, test } from '@playwright/test';
import { acceptConsent, gotoReady, recordRequests } from './helpers';

const result = '[aria-live] .text-3xl';

test.describe('stocks and mutual funds (Story 54)', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('profit after fees and 0,1% tax', async ({ page }) => {
    const traffic = recordRequests(page);
    await gotoReady(page, '/kalkulator-saham');
    await page.getByLabel('Harga beli per lembar').fill('1000');
    await page.getByLabel('Jumlah lot').fill('10');
    await page.getByLabel('Harga jual per lembar').fill('1100');
    await expect(page.locator(result)).toHaveText('Rp94.650');
    await expect(page.locator('[aria-live]')).toContainText(
      'Harga impas: Rp1.010',
    );
    await expect(page.getByRole('note')).toContainText('bukan rekomendasi');
    expect(traffic.containing('1100')).toEqual([]);
  });

  test('average down', async ({ page }) => {
    await gotoReady(page, '/kalkulator-average-saham');
    await page.getByLabel('Harga beli 1').fill('1000');
    await page.locator('#avg-lot-0').fill('10');
    await page.getByLabel('Harga beli 2').fill('800');
    await page.locator('#avg-lot-1').fill('10');
    await expect(page.locator(result)).toHaveText('Rp900');
  });

  test('dividend and mutual fund', async ({ page }) => {
    await gotoReady(page, '/kalkulator-dividen');
    await page.getByLabel('Dividen per lembar').fill('50');
    await page.getByLabel('Jumlah lot').fill('10');
    await expect(page.locator(result)).toHaveText('Rp45.000');

    await gotoReady(page, '/simulasi-reksa-dana');
    await page.getByLabel('Investasi awal').fill('1000000');
    await page.getByLabel('NAB per unit saat beli').fill('1250');
    await page.getByLabel('Biaya pembelian (%)').fill('1');
    await expect(page.locator(result)).toHaveText('792 unit');
  });
});
