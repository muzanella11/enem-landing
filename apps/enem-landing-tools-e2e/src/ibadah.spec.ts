import { expect, test } from '@playwright/test';
import { acceptConsent, gotoReady, recordRequests } from './helpers';

test.describe('ibadah tools (Story 36)', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('find a city and open its prayer schedule', async ({ page }) => {
    await gotoReady(page, '/jadwal-sholat');
    await page.getByLabel('Cari kabupaten/kota').fill('bandung');
    await page.getByRole('link', { name: /Kota Bandung/ }).click();
    await expect(page).toHaveURL(/\/jadwal-sholat\/kota-bandung$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Jadwal Sholat Kota Bandung',
    );
    for (const label of ['Imsak', 'Subuh', 'Maghrib', 'Isya']) {
      await expect(
        page.getByText(label, { exact: true }).first(),
      ).toBeVisible();
    }
    await expect(page.locator('tbody tr').first()).toBeVisible();
  });

  test('imsakiyah lists the days of Ramadan 1448 H', async ({ page }) => {
    await gotoReady(page, '/jadwal-imsakiyah/kota-surabaya');
    expect(await page.locator('tbody tr').count()).toBeGreaterThanOrEqual(29);
    await expect(page.getByText('tanggal perkiraan')).toBeVisible();
  });

  test('qibla from Jakarta is about 295 degrees', async ({ page }) => {
    await gotoReady(page, '/arah-kiblat?kota=kota-jakarta-pusat');
    await expect(page.getByText(/^29[45]\.\d°/)).toBeVisible();
  });

  test('city pages are in the sitemap and unknown cities are 404', async ({
    page,
    request,
  }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toContain('/jadwal-sholat/kota-bandung</loc>');
    expect(sitemap).toContain('/jadwal-imsakiyah/kota-bandung</loc>');
    const response = await page.goto('/jadwal-sholat/kota-fiktif');
    expect(response?.status()).toBe(404);
  });

  test('device location never leaves the browser', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({
      latitude: -6.914744,
      longitude: 107.609811,
    });
    const traffic = recordRequests(page);
    await gotoReady(page, '/jadwal-sholat');
    await page.getByRole('button', { name: 'Pakai lokasiku' }).click();
    await expect(page).toHaveURL(/\/jadwal-sholat\/kota-bandung$/);
    expect(traffic.containing('6.914')).toEqual([]);
    expect(traffic.containing('107.609')).toEqual([]);
  });
});
