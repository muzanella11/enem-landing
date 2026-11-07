import { expect, test } from '@playwright/test';
import { acceptConsent, gotoReady, recordRequests } from './helpers';

const result = '[aria-live] .text-3xl';

test.describe('vehicle fees (Story 42)', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('SIM C renewal fee', async ({ page }) => {
    await gotoReady(page, '/biaya-sim');
    await page.getByLabel('Golongan SIM').selectOption('C');
    await expect(page.locator(result)).toHaveText('Rp75.000');
  });

  test('ganti plat mobil: STNK + TNKB', async ({ page }) => {
    await gotoReady(page, '/biaya-stnk-bpkb');
    await page.getByLabel('Kendaraan').selectOption('r4');
    await expect(page.locator(result)).toHaveText('Rp300.000');
  });

  test('PKB with opsen, never sent anywhere', async ({ page }) => {
    const traffic = recordRequests(page);
    await gotoReady(page, '/kalkulator-pajak-kendaraan');
    await page.getByLabel('NJKB (nilai jual kendaraan)').fill('20000000');
    await page.getByRole('button', { name: 'Hitung pajak' }).click();
    await expect(page.locator(result)).toHaveText('Rp433.400');
    expect(traffic.containing('20000000')).toEqual([]);
  });
});
