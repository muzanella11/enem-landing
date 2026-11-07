import { expect, test } from '@playwright/test';
import { acceptConsent, gotoReady, recordRequests } from './helpers';

const result = '[aria-live] .text-3xl';

test.describe('tax tools (Story 55)', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('PPN non-luxury is 11% of the price', async ({ page }) => {
    await gotoReady(page, '/kalkulator-ppn');
    await page.getByLabel('Harga', { exact: true }).fill('1000000');
    await expect(page.locator(result)).toHaveText('Rp110.000');
  });

  test('PPh 23 without NPWP and rent tax', async ({ page }) => {
    await gotoReady(page, '/kalkulator-pph-23');
    await page.getByLabel('Jumlah bruto').fill('10000000');
    await page.getByLabel('Penerima punya NPWP').uncheck();
    await expect(page.locator(result)).toHaveText('Rp400.000');
    await gotoReady(page, '/kalkulator-pph-sewa');
    await page.getByLabel('Nilai sewa').fill('50000000');
    await expect(page.locator(result)).toHaveText('Rp5.000.000');
  });

  test('SPT with two employers is kurang bayar, inputs never sent', async ({
    page,
  }) => {
    const traffic = recordRequests(page);
    await gotoReady(page, '/simulasi-spt-tahunan');
    await page.getByLabel('Penghasilan neto bukti potong 1').fill('120000000');
    await page.getByLabel('PPh 21 dipotong bukti potong 1').fill('3300000');
    await page
      .getByRole('button', { name: '+ Bukti potong pemberi kerja lain' })
      .click();
    await page.getByLabel('Penghasilan neto bukti potong 2').fill('120000000');
    await page.getByLabel('PPh 21 dipotong bukti potong 2').fill('3300000');
    // PKP 186jt: 3jt + 18,9jt = 21,9jt - 6,6jt
    await expect(page.locator(result)).toHaveText('Kurang bayar Rp15.300.000');
    expect(traffic.containing('120000000')).toEqual([]);
  });
});
