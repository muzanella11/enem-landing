import { expect, test } from '@playwright/test';
import { acceptConsent, gotoReady, recordRequests } from './helpers';

test.describe('calculators', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('gaji bersih: TK/0 Rp10 juta without BPJS takes home Rp9.800.000, and the salary never leaves the browser', async ({
    page,
  }) => {
    const traffic = recordRequests(page);
    await gotoReady(page, '/kalkulator-gaji-bersih');
    await page.getByLabel('Gaji pokok per bulan').fill('10000000');
    await page.getByLabel('Ikut BPJS Kesehatan').uncheck();
    await page.getByLabel('Ikut BPJS Ketenagakerjaan').uncheck();
    await page.getByLabel('Bulan', { exact: true }).selectOption('1');
    await page.getByRole('button', { name: 'Hitung gaji bersih' }).click();

    await expect(page.locator('section[aria-live] .text-3xl')).toHaveText(
      'Rp9.800.000',
    );
    await expect(page.getByText('TER kategori A tarif 2%')).toBeVisible();

    await page.getByRole('button', { name: 'Setahun' }).click();
    await expect(
      page.locator('summary', { hasText: 'Rekonsiliasi Desember' }),
    ).toBeVisible();

    expect(traffic.containing('10000000')).toEqual([]);
    expect(traffic.containing('10.000.000')).toEqual([]);
  });

  test('simulasi KPR shows installments per rate period and an amortization table', async ({
    page,
  }) => {
    await gotoReady(page, '/simulasi-kpr');
    await page.getByLabel('Harga properti').fill('600000000');
    await page.getByRole('button', { name: 'Hitung cicilan' }).click();
    await expect(
      page.locator('.result-row', { hasText: 'Plafon pinjaman' }),
    ).toContainText('Rp480.000.000');
    await expect(
      page.getByRole('heading', { name: 'Tabel amortisasi' }),
    ).toBeVisible();
  });

  test('zakat penghasilan with a manual gold price', async ({ page }) => {
    await gotoReady(page, '/kalkulator-zakat');
    await page
      .getByLabel('Pakai harga emas sendiri (opsional)')
      .fill('2000000');
    await page.getByLabel('Penghasilan per bulan').fill('20000000');
    await page.getByRole('button', { name: 'Hitung zakat' }).click();
    await expect(page.locator('section[aria-live] .text-3xl')).toHaveText(
      'Rp500.000',
    );
  });

  test('terbilang', async ({ page }) => {
    await gotoReady(page, '/terbilang');
    await page.getByLabel('Angka').fill('1250000');
    await expect(page.locator('[aria-live=polite]')).toContainText(
      'satu juta dua ratus lima puluh ribu rupiah',
    );
  });
});
