import { expect, test } from '@playwright/test';
import { acceptConsent, gotoReady, recordRequests } from './helpers';

const result = '[aria-live] .text-3xl';

test.describe('vehicle insurance (Story 51)', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('car: Rp250 juta in Jakarta, comprehensive range', async ({ page }) => {
    const traffic = recordRequests(page);
    await gotoReady(page, '/simulasi-asuransi-mobil');
    await page
      .getByLabel('Harga mobil (nilai pertanggungan)')
      .fill('250000000');
    // kategori 3 wilayah 2: 2,08% - 2,29%
    await expect(page.locator(result)).toHaveText('Rp5.200.000 - Rp5.725.000');
    expect(traffic.containing('250000000')).toEqual([]);
  });

  test('motor: TLO in Jawa Timur', async ({ page }) => {
    await gotoReady(page, '/simulasi-asuransi-motor');
    await page.getByLabel('Provinsi plat nomor').selectOption('Jawa Timur');
    await page.getByLabel('Harga motor (nilai pertanggungan)').fill('20000000');
    await page.getByLabel('Total Loss Only (TLO)').check();
    await expect(page.locator(result)).toHaveText('Rp134.000 - Rp160.000');
  });
});
