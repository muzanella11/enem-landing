import { expect, test } from '@playwright/test';
import { acceptConsent, gotoReady, recordRequests } from './helpers';

test.describe('unit converters (Story 40)', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('land area from length x width, with local variants', async ({
    page,
  }) => {
    const traffic = recordRequests(page);
    await gotoReady(page, '/konversi-luas-tanah');
    await page.getByLabel('Panjang (m)').fill('20');
    await page.getByLabel('Lebar (m)').fill('7');
    await page.getByRole('button', { name: 'Hitung luas' }).click();
    const result = page.locator('section[aria-live]');
    await expect(result.locator('.text-3xl')).toHaveText('140 m²');
    // Tumbak shows both variants: 140 / 14 = 10 and 140 / 56 = 2,5.
    await expect(
      result.getByRole('row', { name: /Tumbak \(14 m²/ }),
    ).toContainText('10');
    await expect(
      result.getByRole('row', { name: /Tumbak \(56 m²/ }),
    ).toContainText('2,5');
    expect(traffic.containing('140')).toEqual([]);
  });

  test('per-unit answer page and unknown unit 404', async ({ page }) => {
    await gotoReady(page, '/konversi-luas-tanah/bata');
    await expect(
      page.getByRole('heading', { name: '1 Bata Berapa Meter Persegi?' }),
    ).toBeVisible();
    const response = await page.goto('/konversi-luas-tanah/satuan-fiktif');
    expect(response?.status()).toBe(404);
  });

  test('temperature', async ({ page }) => {
    await gotoReady(page, '/konversi-satuan');
    await page.getByRole('button', { name: 'Suhu' }).click();
    await page.getByLabel('Nilai').fill('100');
    await expect(page.getByRole('row', { name: /Fahrenheit/ })).toContainText(
      '212',
    );
  });
});
