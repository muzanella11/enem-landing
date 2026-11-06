import { expect, test } from '@playwright/test';
import { acceptConsent, gotoReady } from './helpers';

test.describe('holiday tools (Story 30)', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('2026 list comes from the BI calendar and 2027 waits for it', async ({
    page,
  }) => {
    await gotoReady(page, '/libur-nasional');
    await expect(
      page.getByText('Tahun Baru 2026 Masehi').first(),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Bank Indonesia/ }).first(),
    ).toBeVisible();
    await page.getByRole('button', { name: '2027', exact: true }).click();
    await expect(
      page.getByText(/Menunggu publikasi kalender Bank Indonesia 2027/),
    ).toBeVisible();
  });

  test('ics download', async ({ page }) => {
    await gotoReady(page, '/libur-nasional');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: /Unduh ke kalender/ }).click();
    expect((await download).suggestedFilename()).toBe(
      'libur-nasional-2026.ics',
    );
  });

  test('working days across Lebaran 2026', async ({ page }) => {
    await gotoReady(page, '/hitung-hari-kerja');
    await page.getByLabel('Tanggal mulai').fill('2026-03-16');
    await page.getByLabel('Tanggal selesai').fill('2026-03-27');
    await page.getByRole('button', { name: 'Hitung', exact: true }).click();
    await expect(page.locator('section[aria-live] .text-3xl')).toHaveText(
      '5 hari',
    );
  });
});
