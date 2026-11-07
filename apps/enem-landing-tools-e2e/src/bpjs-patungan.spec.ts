import { expect, test } from '@playwright/test';
import { acceptConsent, gotoReady, recordRequests } from './helpers';

const result = '[aria-live] .text-3xl';

test.describe('BPJS mandiri and patungan (Story 44)', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('BPJS family contribution and arrears', async ({ page }) => {
    await gotoReady(page, '/iuran-bpjs-kesehatan');
    await page.getByLabel(/Anggota kelas 2/).fill('2');
    await page.getByLabel(/Anggota kelas 3/).fill('0');
    await page.getByLabel('Bulan menunggak').fill('3');
    await page.getByRole('button', { name: 'Hitung iuran' }).click();
    await expect(page.locator(result)).toHaveText('Rp200.000');
    await expect(page.getByText('Rp600.000')).toBeVisible();
  });

  test('patungan splits a shared item and keeps the total', async ({
    page,
  }) => {
    const traffic = recordRequests(page);
    await gotoReady(page, '/kalkulator-patungan');
    await page.getByLabel('Nama orang 1').fill('Sinta Rahasia');
    await page.getByLabel('Nama item 1').fill('Pizza');
    await page.getByLabel('Harga item 1').fill('100000');
    await page.getByLabel('Pajak (%)').fill('0');
    await expect(page.locator(result)).toHaveText('Rp100.000');
    await expect(page.locator('[aria-live] li')).toHaveCount(2);
    await expect(page.locator('[aria-live] li').first()).toContainText(
      'Rp50.000',
    );
    expect(traffic.containing('Sinta')).toEqual([]);
  });
});
