import { expect, test } from '@playwright/test';
import { acceptConsent, gotoReady, recordRequests } from './helpers';

const result = '[aria-live] .text-3xl';

test.describe('personal finance (Story 41)', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('deposito: tax and net interest', async ({ page }) => {
    const traffic = recordRequests(page);
    await gotoReady(page, '/kalkulator-deposito');
    await page.getByLabel('Nominal deposito').fill('123000000');
    await page.getByLabel('Bunga per tahun (%)').fill('4');
    await page.getByLabel('Tenor').selectOption('12');
    await page.getByRole('button', { name: 'Hitung bunga' }).click();
    // 4.920.000 gross, 20% tax.
    await expect(page.locator(result)).toHaveText('Rp3.936.000');
    expect(traffic.containing('123000000')).toEqual([]);
  });

  test('tabungan: monthly saving with zero interest', async ({ page }) => {
    await gotoReady(page, '/kalkulator-tabungan');
    await page.getByLabel('Target dana').fill('36000000');
    await page.getByLabel('Jangka waktu (tahun)').fill('3');
    await page.getByLabel('Bunga/imbal hasil per tahun (%)').fill('0');
    await page.getByRole('button', { name: 'Hitung setoran' }).click();
    await expect(page.locator(result)).toHaveText('Rp1.000.000');
    await expect(page.getByRole('note')).toContainText(
      'bukan nasihat investasi',
    );
  });

  test('investasi: chart and result', async ({ page }) => {
    await gotoReady(page, '/kalkulator-investasi');
    await page.getByLabel('Setoran per bulan').fill('1000000');
    await page.getByLabel('Imbal hasil per tahun (%)').fill('0');
    await page.getByRole('button', { name: 'Simulasikan' }).click();
    await expect(page.locator(result)).toHaveText('Rp120.000.000');
    await expect(
      page.getByRole('img', { name: /Grafik pertumbuhan/ }),
    ).toBeVisible();
  });

  test('dana darurat and pensiun', async ({ page }) => {
    await gotoReady(page, '/kalkulator-dana-darurat');
    await page.getByLabel('Pengeluaran wajib per bulan').fill('5000000');
    await page.getByLabel('Status').selectOption('anak');
    await page.getByRole('button', { name: 'Hitung dana darurat' }).click();
    await expect(page.locator(result)).toHaveText('Rp60.000.000');

    await gotoReady(page, '/kalkulator-dana-pensiun');
    await page
      .getByLabel('Pengeluaran bulanan (nilai hari ini)')
      .fill('5000000');
    await page.getByRole('button', { name: 'Hitung dana pensiun' }).click();
    await expect(page.locator(result)).toContainText('Rp');
  });
});
