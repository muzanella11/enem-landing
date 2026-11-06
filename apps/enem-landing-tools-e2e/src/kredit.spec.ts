import { expect, test } from '@playwright/test';
import { acceptConsent, gotoReady } from './helpers';

test.describe('loan simulators (Story 29)', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('vehicle loan with flat rate shows the effective rate', async ({
    page,
  }) => {
    await gotoReady(page, '/simulasi-kredit-kendaraan');
    await page.getByLabel('Harga OTR').fill('45000000');
    await page.getByLabel('DP persen').fill('20');
    await page.getByLabel('Bunga flat per tahun (%)').fill('6');
    await page.getByRole('button', { name: 'Hitung cicilan' }).click();
    // Pokok 36 jt / 36 + 36 jt x 6% / 12 = 1.180.000
    await expect(page.locator('section[aria-live] .text-3xl')).toHaveText(
      'Rp1.180.000',
    );
    await expect(page.getByText('11,08%').first()).toBeVisible();
  });

  test('KTA disbursed amount after provisi', async ({ page }) => {
    await gotoReady(page, '/simulasi-kta');
    await page.getByLabel('Plafon pinjaman').fill('50000000');
    await page.getByRole('button', { name: 'Hitung', exact: true }).click();
    await expect(
      page.locator('.result-row', { hasText: 'Dana yang cair' }),
    ).toContainText('Rp49.000.000');
  });
});
