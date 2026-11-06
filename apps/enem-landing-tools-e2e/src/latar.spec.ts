import { expect, test } from '@playwright/test';
import { acceptConsent, gotoReady, recordRequests, TINY_PNG } from './helpers';

test.describe('background removal (Story 48)', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('model is self-hosted and long-cached', async ({ request }) => {
    for (const file of [
      'selfie_segmentation.js',
      'selfie_segmentation.tflite',
      'selfie_segmentation_solution_simd_wasm_bin.wasm',
    ]) {
      const response = await request.get(`/mediapipe/selfie/${file}`);
      expect(response.status()).toBe(200);
      expect(response.headers()['cache-control']).toContain('max-age=31536000');
    }
  });

  test('other pages never load the model', async ({ page }) => {
    const traffic = recordRequests(page);
    await gotoReady(page, '/kompres-gambar');
    expect(traffic.requests.filter((r) => r.url.includes('mediapipe'))).toEqual(
      [],
    );
  });

  test('processes a photo locally and offers a download', async ({ page }) => {
    const traffic = recordRequests(page);
    await gotoReady(page, '/hapus-latar-foto');
    await page.locator('input[type=file]').setInputFiles({
      name: 'wajah.png',
      mimeType: 'image/png',
      buffer: TINY_PNG,
    });
    await expect(page.getByRole('button', { name: 'Unduh PNG' })).toBeVisible({
      timeout: 30_000,
    });
    expect(traffic.requests.filter((r) => r.body.includes('PNG'))).toEqual([]);
  });
});
