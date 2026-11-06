import { expect, test } from '@playwright/test';
import { acceptConsent, gotoReady, makePdf, recordRequests } from './helpers';

const pdfFile = (pages: number) => ({
  name: 'dokumen.pdf',
  mimeType: 'application/pdf',
  buffer: makePdf(pages),
});
const noPdfUploads = (traffic: ReturnType<typeof recordRequests>) =>
  expect(
    traffic.requests.filter((entry) => entry.body.includes('%PDF')),
  ).toEqual([]);

test.describe('advanced PDF tools (Story 32)', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('PDF ke JPG renders selected pages', async ({ page }) => {
    const traffic = recordRequests(page);
    await gotoReady(page, '/pdf-ke-jpg');
    await page.locator('input[type=file]').setInputFiles(pdfFile(3));
    await expect(page.getByText('3 halaman').first()).toBeVisible();
    await page.getByLabel('Halaman tertentu').check();
    await page.getByLabel('Halaman yang dipilih').fill('1, 3');
    await page.getByRole('button', { name: 'Ubah ke gambar' }).click();
    await expect(page.getByText('2 gambar siap.')).toBeVisible();
    await expect(page.getByText('dokumen-hal-3.jpg')).toBeVisible();
    noPdfUploads(traffic);
  });

  test('kompres PDF light mode produces a download', async ({ page }) => {
    const traffic = recordRequests(page);
    await gotoReady(page, '/kompres-pdf');
    await page.locator('input[type=file]').setInputFiles(pdfFile(2));
    await page.getByRole('button', { name: 'Kompres PDF' }).click();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Unduh PDF' }).click();
    expect((await download).suggestedFilename()).toBe('dokumen-kompres.pdf');
    noPdfUploads(traffic);
  });

  test('kompres PDF strong mode rasterizes pages', async ({ page }) => {
    await gotoReady(page, '/kompres-pdf');
    await page.locator('input[type=file]').setInputFiles(pdfFile(2));
    await page.getByText('Kuat', { exact: true }).click();
    await page.getByRole('button', { name: 'Kompres PDF' }).click();
    await expect(page.getByRole('button', { name: 'Unduh PDF' })).toBeVisible();
  });

  test('watermark text is added and never uploaded', async ({ page }) => {
    const traffic = recordRequests(page);
    await gotoReady(page, '/watermark-pdf');
    await page.locator('input[type=file]').setInputFiles(pdfFile(2));
    await page.getByLabel('Teks watermark').fill('CONTOH SAJA');
    await expect(page.getByText('CONTOH SAJA')).toBeVisible();
    await page.getByRole('button', { name: 'Tambah watermark' }).click();
    await expect(page.getByRole('button', { name: 'Unduh PDF' })).toBeVisible();
    noPdfUploads(traffic);
    expect(traffic.containing('CONTOH SAJA')).toEqual([]);
  });

  test('signature drawn, placed, and saved', async ({ page }) => {
    const traffic = recordRequests(page);
    await gotoReady(page, '/tanda-tangan-pdf');
    await page.locator('input[type=file]').setInputFiles(pdfFile(1));
    const pad = page.getByLabel('Area tanda tangan');
    await pad.hover({ position: { x: 20, y: 40 } });
    await page.mouse.down();
    await pad.hover({ position: { x: 120, y: 60 } });
    await pad.hover({ position: { x: 200, y: 30 } });
    await page.mouse.up();
    await page.getByRole('button', { name: 'Pakai tanda tangan ini' }).click();
    await page.getByRole('button', { name: 'Tempel di halaman ini' }).click();
    await expect(
      page.getByAltText('Tanda tangan', { exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Simpan PDF' }).click();
    await expect(page.getByRole('button', { name: 'Unduh PDF' })).toBeVisible();
    noPdfUploads(traffic);
  });
});
