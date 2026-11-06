import { expect, test } from '@playwright/test';
import { acceptConsent, gotoReady, recordRequests } from './helpers';

test.describe('letter generator (Story 33)', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('hub lists letter types; unknown type is 404', async ({ page }) => {
    await gotoReady(page, '/buat-surat');
    await page.getByRole('link', { name: /Surat Kuasa/ }).click();
    await expect(page).toHaveURL(/\/buat-surat\/surat-kuasa$/);
    const response = await page.goto('/buat-surat/surat-fiktif');
    expect(response?.status()).toBe(404);
  });

  test('server-rendered example letter is in the HTML', async ({ request }) => {
    const html = await (await request.get('/buat-surat/lamaran-kerja')).text();
    expect(html).toContain('Lamaran Pekerjaan sebagai Staf Administrasi');
  });

  test('fills, survives reload, downloads, never uploads, and clears', async ({
    page,
  }) => {
    const traffic = recordRequests(page);
    await gotoReady(page, '/buat-surat/pengunduran-diri');
    await page.getByLabel('Nama lengkap').fill('Sekar Ayu Lestari');
    await page.getByLabel('Jabatan').fill('Analis Data');
    await page.getByLabel('Nama perusahaan').fill('PT Contoh Rahasia');
    const preview = page.locator('article.surat').first();
    await expect(preview).toContainText('Sekar Ayu Lestari');
    await expect(preview).toContainText('[Ditujukan kepada]');

    await page.reload();
    await page
      .locator('html[data-hydrated="true"]')
      .waitFor({ state: 'attached' });
    await expect(page.getByLabel('Nama lengkap')).toHaveValue(
      'Sekar Ayu Lestari',
    );

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Unduh PDF' }).click();
    expect((await download).suggestedFilename()).toBe(
      'pengunduran-diri-Sekar-Ayu-Lestari.pdf',
    );
    expect(traffic.containing('PT Contoh Rahasia')).toEqual([]);
    expect(traffic.containing('Sekar')).toEqual([]);

    await page.getByRole('button', { name: 'Hapus data tersimpan' }).click();
    await expect(page.getByLabel('Nama lengkap')).toHaveValue('');
    await page.reload();
    await page
      .locator('html[data-hydrated="true"]')
      .waitFor({ state: 'attached' });
    await expect(page.getByLabel('Nama lengkap')).toHaveValue('');
  });

  test('shared fields carry over to another letter type', async ({ page }) => {
    await gotoReady(page, '/buat-surat/surat-pernyataan');
    await page.getByLabel('Nama lengkap').fill('Dewi Anggraini');
    await gotoReady(page, '/buat-surat/lamaran-kerja');
    await expect(page.getByLabel('Nama lengkap')).toHaveValue('Dewi Anggraini');
  });
});
