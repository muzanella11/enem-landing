import { expect, test } from '@playwright/test';
import { acceptConsent, gotoReady, recordRequests } from './helpers';

const result = '[aria-live] .text-3xl';

test.describe('UMKM tools (Story 43)', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('HPP and harga jual', async ({ page }) => {
    await gotoReady(page, '/kalkulator-hpp');
    await page.getByLabel('Bahan baku per batch').fill('500000');
    await page.getByLabel('Tenaga kerja per batch').fill('200000');
    await page.getByLabel('Overhead per batch').fill('100000');
    await page.getByRole('button', { name: 'Hitung HPP' }).click();
    await expect(page.locator(result)).toHaveText('Rp8.000');

    await gotoReady(page, '/kalkulator-harga-jual');
    await page.getByLabel('HPP per unit').fill('8000');
    await page.getByLabel('Persentase (%)').fill('20');
    await page.getByRole('button', { name: 'Hitung harga jual' }).click();
    await expect(page.locator(result)).toHaveText('Rp10.000');
  });

  test('BEP', async ({ page }) => {
    await gotoReady(page, '/kalkulator-bep');
    await page.getByLabel('Biaya tetap per bulan').fill('5000000');
    await page.getByLabel('Harga jual per unit').fill('25000');
    await page.getByLabel('Biaya variabel per unit').fill('15000');
    await page.getByRole('button', { name: 'Hitung BEP' }).click();
    await expect(page.locator(result)).toHaveText('500 unit');
  });

  test('fee marketplace', async ({ page }) => {
    await gotoReady(page, '/kalkulator-fee-marketplace');
    await page.getByLabel('Harga jual').fill('100000');
    await page.getByLabel('HPP/modal per unit').fill('60000');
    await page.getByLabel('Biaya admin (%)').fill('10');
    await page.getByRole('button', { name: 'Hitung', exact: true }).click();
    await expect(page.locator(result)).toHaveText('Rp30.000');
  });

  test('PPh UMKM crossing Rp500 juta', async ({ page }) => {
    const traffic = recordRequests(page);
    await gotoReady(page, '/kalkulator-pph-umkm');
    await page.getByLabel('Omzet bulan ini').fill('100000000');
    await page.getByLabel('Omzet Januari s.d. bulan lalu').fill('450000000');
    await page.getByRole('button', { name: 'Hitung PPh' }).click();
    await expect(page.locator(result)).toHaveText('Rp250.000');
    expect(traffic.containing('450000000')).toEqual([]);
  });
});
