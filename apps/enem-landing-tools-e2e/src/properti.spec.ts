import { expect, test } from '@playwright/test';
import { acceptConsent, gotoReady, recordRequests } from './helpers';

const result = '[aria-live] .text-3xl';

test.describe('property costs (Story 47)', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('biaya bangun', async ({ page }) => {
    await gotoReady(page, '/biaya-bangun-rumah');
    await page.getByLabel('Luas lantai 1 (m²)').fill('100');
    await page.getByLabel('Biaya per m²').fill('4000000');
    await page.getByRole('button', { name: 'Hitung biaya' }).click();
    await expect(page.locator(result)).toHaveText('Rp440.000.000');
  });

  test('PBB', async ({ page }) => {
    await gotoReady(page, '/kalkulator-pbb');
    await page.getByLabel('Luas tanah (m²)').fill('100');
    await page.getByLabel('NJOP tanah per m²').fill('2000000');
    await page.getByLabel('Tarif PBB (%)').fill('0.1');
    await page.getByRole('button', { name: 'Hitung PBB' }).click();
    await expect(page.locator(result)).toHaveText('Rp190.000');
  });

  test('balik nama never sends the price', async ({ page }) => {
    const traffic = recordRequests(page);
    await gotoReady(page, '/biaya-balik-nama-rumah');
    await page.getByLabel('Harga transaksi').fill('500000000');
    await page.getByLabel('NJOP (dari SPPT PBB)').fill('400000000');
    await page.getByRole('button', { name: 'Hitung biaya' }).click();
    // BPHTB 21jt + PPAT 5jt + BPN 400rb+50rb+50rb
    await expect(page.locator(result)).toHaveText('Rp26.500.000');
    expect(traffic.containing('500000000')).toEqual([]);
  });
});
