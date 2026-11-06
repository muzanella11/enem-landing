import { expect, test } from '@playwright/test';
import { acceptConsent, gotoReady, recordRequests } from './helpers';

test.describe('date tools (Story 31)', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('weton of 17 Agustus 1945 is Jumat Legi', async ({ page }) => {
    await gotoReady(page, '/hitung-weton');
    await page.getByLabel('Tanggal lahir', { exact: true }).fill('1945-08-17');
    await expect(page.locator('[aria-live] .text-3xl')).toHaveText(
      'Jumat Legi',
    );
  });

  test('age and date difference', async ({ page }) => {
    await gotoReady(page, '/hitung-umur');
    await page.getByLabel('Tanggal lahir').fill('1990-05-20');
    await page.getByLabel('Pada tanggal').fill('2026-11-06');
    await expect(page.getByText('36 tahun 5 bulan 17 hari')).toBeVisible();

    await gotoReady(page, '/selisih-tanggal');
    await page.getByLabel('Dari tanggal').fill('2026-01-01');
    await page.getByLabel('Sampai tanggal').fill('2026-12-31');
    await expect(page.getByText('364 hari')).toBeVisible();
  });

  test('Hijri conversion page renders both directions', async ({ page }) => {
    await gotoReady(page, '/konversi-hijriah');
    await page.getByLabel('Tanggal Masehi').fill('2026-11-06');
    await expect(page.getByText(/1448 H/)).toBeVisible();
  });

  test('birth dates are never sent', async ({ page }) => {
    const traffic = recordRequests(page);
    await gotoReady(page, '/hitung-umur');
    await page.getByLabel('Tanggal lahir').fill('1987-03-19');
    await page.getByLabel('Pada tanggal').fill('2026-11-06');
    expect(traffic.containing('1987-03-19')).toEqual([]);
    expect(traffic.containing('1987')).toEqual([]);
  });
});
