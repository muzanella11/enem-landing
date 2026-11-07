import { expect, test } from '@playwright/test';
import { acceptConsent, gotoReady, recordRequests } from './helpers';

test.describe('IPK and SKD (Story 35)', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('IPK computes, persists, and clears', async ({ page }) => {
    const traffic = recordRequests(page);
    await gotoReady(page, '/kalkulator-ipk');
    await page.getByLabel('Mata kuliah 1 Semester 1').fill('Kalkulus Lanjut');
    await page.getByLabel('SKS 1 Semester 1').fill('3');
    await page.getByLabel('Nilai 1 Semester 1').selectOption({ label: 'AB' });
    await page.getByRole('button', { name: '+ Mata kuliah' }).click();
    await page.getByLabel('SKS 2 Semester 1').fill('2');
    await page.getByLabel('Nilai 2 Semester 1').selectOption({ label: 'A' });
    // (10.5 + 8) / 5 = 3.70
    await expect(page.locator('section[aria-live] .text-3xl')).toHaveText(
      '3,70',
    );
    await expect(page.getByText('Pujian (cumlaude)')).toBeVisible();
    expect(traffic.containing('Kalkulus Lanjut')).toEqual([]);

    await page.reload();
    await page
      .locator('html[data-hydrated="true"]')
      .waitFor({ state: 'attached' });
    await expect(page.getByLabel('Mata kuliah 1 Semester 1')).toHaveValue(
      'Kalkulus Lanjut',
    );
    await page.getByRole('button', { name: 'Hapus data tersimpan' }).click();
    await expect(page.getByLabel('Mata kuliah 1 Semester 1')).toHaveValue('');
  });

  test('SKD shows per-subtest gaps and the rule year', async ({ page }) => {
    await gotoReady(page, '/simulasi-nilai-skd');
    await expect(page.getByText('seleksi CPNS 2024').first()).toBeVisible();
    await page.getByLabel('Benar TWK (dari 30)').fill('12');
    await page.getByLabel('Benar TIU (dari 35)').fill('20');
    await page.getByLabel('Skor TKP (maks 225)').fill('170');
    await page.getByRole('button', { name: 'Cek nilai' }).click();
    const result = page.locator('section[aria-live]');
    await expect(result.locator('.text-3xl')).toHaveText(
      'Belum memenuhi ambang batas',
    );
    await expect(result.getByRole('row', { name: /TWK/ })).toContainText('-5');
  });
});
