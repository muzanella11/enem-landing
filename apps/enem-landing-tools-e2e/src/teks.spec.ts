import { expect, test } from '@playwright/test';
import { acceptConsent, gotoReady, recordRequests } from './helpers';

const result = '[aria-live] .text-3xl';

test.describe('text and academic tools (Story 46)', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('word counter never sends the text', async ({ page }) => {
    const traffic = recordRequests(page);
    await gotoReady(page, '/penghitung-kata');
    await page
      .getByLabel('Teks')
      .fill('Skripsi rahasia saya tentang anak-anak. Selesai!');
    await expect(page.locator(result)).toHaveText('6');
    expect(traffic.containing('rahasia')).toEqual([]);
  });

  test('title case', async ({ page }) => {
    await gotoReady(page, '/ubah-huruf');
    await page
      .getByLabel('Teks')
      .fill('pengaruh media sosial terhadap minat baca');
    await page.getByRole('button', { name: 'Judul Bahasa Indonesia' }).click();
    await expect(page.getByLabel('Teks')).toHaveValue(
      'Pengaruh Media Sosial terhadap Minat Baca',
    );
  });

  test('daftar pustaka APA', async ({ page }) => {
    await gotoReady(page, '/buat-daftar-pustaka');
    await page.getByLabel('Penulis (satu per baris)').fill('Rina Kartika Sari');
    await page.getByLabel('Tahun').fill('2020');
    await page.getByLabel('Judul').fill('Metode riset');
    await page.getByLabel('Penerbit').fill('Alfabeta');
    await page.getByRole('button', { name: 'Tambah ke daftar' }).click();
    await expect(page.locator('[aria-live] p.font-serif')).toHaveText(
      'Sari, R. K. (2020). Metode riset. Alfabeta.',
    );
  });

  test('nilai rapor: needed UAS', async ({ page }) => {
    await gotoReady(page, '/kalkulator-nilai-rapor');
    await page.getByLabel('Nilai Tugas').fill('80');
    await page.getByLabel('Nilai UTS').fill('70');
    await page.getByLabel('Target nilai akhir').fill('80');
    await expect(page.getByText('87,5')).toBeVisible();
  });
});
