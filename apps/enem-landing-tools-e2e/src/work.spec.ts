import { expect, test } from '@playwright/test';
import { acceptConsent, gotoReady, recordRequests } from './helpers';

test.describe('work tools (Story 26)', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('UMP list and a province page with a prefilled salary link', async ({
    page,
  }) => {
    await gotoReady(page, '/upah-minimum');
    await expect(page.getByRole('link', { name: 'Jawa Barat' })).toBeVisible();
    await page.getByRole('link', { name: 'DKI Jakarta' }).click();
    await expect(page).toHaveURL(/\/upah-minimum\/dki-jakarta$/);
    await expect(page.getByText('Rp5.729.876').first()).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/upah-minimum\/dki-jakarta$/,
    );
    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute('content');
    expect(ogImage).toMatch(/\/og\/upah-minimum-dki-jakarta\.png$/);
    expect(
      (await page.request.get(new URL(ogImage ?? '').pathname)).status(),
    ).toBe(200);

    await page
      .locator('html[data-hydrated="true"]')
      .waitFor({ state: 'attached' });
    await page.getByRole('link', { name: 'Hitung gaji bersih' }).click();
    await expect(page).toHaveURL(/\/kalkulator-gaji-bersih$/);
    await expect(page.getByLabel('Gaji pokok per bulan')).toHaveValue(
      '5.729.876',
    );
  });

  test('unknown province returns 404', async ({ page }) => {
    const response = await page.goto('/upah-minimum/provinsi-fiktif');
    expect(response?.status()).toBe(404);
  });

  test('lembur: 3 hours on a working day at Rp30.000/hour', async ({
    page,
  }) => {
    const traffic = recordRequests(page);
    await gotoReady(page, '/kalkulator-lembur');
    await page.getByLabel('Upah pokok per bulan').fill('5190000');
    await page.getByLabel('Jam per hari').fill('3');
    await page.getByLabel('Jumlah hari').fill('1');
    await page.getByRole('button', { name: 'Hitung lembur' }).click();
    await expect(page.locator('section[aria-live] .text-3xl')).toHaveText(
      'Rp165.000',
    );
    expect(traffic.containing('5190000')).toEqual([]);
  });

  test('THR: 11 months of service is pro rata', async ({ page }) => {
    await gotoReady(page, '/kalkulator-thr');
    await page.getByLabel('Mulai kerja').fill('2026-04-10');
    await page.getByLabel('Tanggal hari raya').fill('2027-03-10');
    await page.getByLabel('Gaji pokok per bulan').fill('6000000');
    await page.getByRole('button', { name: 'Hitung THR' }).click();
    await expect(page.locator('section[aria-live] .text-3xl')).toHaveText(
      'Rp5.500.000',
    );
    await expect(page.getByText('3 Maret 2027')).toBeVisible();
  });

  test('pesangon: 10 years, efisiensi to prevent loss', async ({ page }) => {
    await gotoReady(page, '/kalkulator-pesangon');
    await page.getByLabel('Mulai kerja').fill('2016-11-01');
    await page.getByLabel('Tanggal PHK').fill('2026-11-01');
    await page.getByLabel('Upah pokok per bulan').fill('10000000');
    await page.getByRole('button', { name: 'Hitung pesangon' }).click();
    // 9 + 4 months = Rp130 jt; PPh 2,5 jt + 4,5 jt.
    await expect(page.locator('section[aria-live] .text-3xl')).toHaveText(
      'Rp123.000.000',
    );
  });
});
