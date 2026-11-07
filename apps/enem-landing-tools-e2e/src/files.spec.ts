import { expect, test } from '@playwright/test';
import {
  acceptConsent,
  gotoReady,
  makePdf,
  recordRequests,
  TINY_PNG,
} from './helpers';

test.describe('file tools (processed in the browser)', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('gabung PDF merges two files and never uploads them', async ({
    page,
  }) => {
    const traffic = recordRequests(page);
    await gotoReady(page, '/gabung-pdf');
    await page.locator('input[type=file]').setInputFiles([
      { name: 'satu.pdf', mimeType: 'application/pdf', buffer: makePdf(2) },
      { name: 'dua.pdf', mimeType: 'application/pdf', buffer: makePdf(3) },
    ]);
    await page.getByRole('button', { name: 'Gabungkan 2 PDF' }).click();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Unduh gabungan.pdf' }).click();
    expect((await download).suggestedFilename()).toBe('gabungan.pdf');

    expect(
      traffic.requests.filter((entry) => entry.body.includes('%PDF')),
    ).toEqual([]);
  });

  test('pisah PDF reads the page count and splits a range', async ({
    page,
  }) => {
    await gotoReady(page, '/pisah-pdf');
    await page.locator('input[type=file]').setInputFiles({
      name: 'laporan.pdf',
      mimeType: 'application/pdf',
      buffer: makePdf(5),
    });
    await expect(page.getByText('5 halaman')).toBeVisible();
    await page.getByLabel('Halaman yang diambil').fill('1-2, 4');
    await page.getByRole('button', { name: 'Pisahkan' }).click();
    await expect(page.getByText('2 file siap.')).toBeVisible();
  });

  test('atur halaman shows page thumbnails', async ({ page }) => {
    await gotoReady(page, '/atur-halaman-pdf');
    await page.locator('input[type=file]').setInputFiles({
      name: 'laporan.pdf',
      mimeType: 'application/pdf',
      buffer: makePdf(3),
    });
    await expect(
      page.getByText('3 halaman. Seret untuk mengurutkan.'),
    ).toBeVisible();
    await expect(page.getByAltText('Halaman 3')).toBeVisible();
  });

  test('kompres gambar produces a JPG', async ({ page }) => {
    await gotoReady(page, '/kompres-gambar');
    await page.locator('input[type=file]').setInputFiles({
      name: 'foto.png',
      mimeType: 'image/png',
      buffer: TINY_PNG,
    });
    await page.getByRole('button', { name: /Kompres 1 foto/ }).click();
    await expect(page.getByText('1 gambar siap.')).toBeVisible();
    await expect(page.getByText('foto.jpg')).toBeVisible();
  });
});
