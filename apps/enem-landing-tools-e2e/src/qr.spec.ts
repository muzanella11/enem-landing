import { expect, test } from '@playwright/test';
import { acceptConsent, gotoReady, recordRequests } from './helpers';

test.describe('WhatsApp link and QR (Story 39)', () => {
  test.beforeEach(async ({ page }) => acceptConsent(page));

  test('builds a wa.me link and a QR image', async ({ page }) => {
    await gotoReady(page, '/link-whatsapp');
    await page.getByLabel('Nomor WhatsApp').fill('0812 3456 7890');
    await page.getByLabel('Pesan otomatis').fill('Halo');
    await expect(
      page.getByText('https://wa.me/6281234567890?text=Halo'),
    ).toBeVisible();
    await expect(page.getByAltText('Pratinjau QR code')).toBeVisible();
  });

  test('WiFi QR never sends the password', async ({ page }) => {
    const traffic = recordRequests(page);
    await gotoReady(page, '/buat-qr-code');
    await page.getByRole('button', { name: 'WiFi' }).click();
    await page.getByLabel('Nama WiFi (SSID)').fill('RumahKu');
    await page.getByLabel('Password').fill('rahasia-sekali-123');
    await expect(page.getByAltText('Pratinjau QR code')).toBeVisible();
    expect(traffic.containing('rahasia-sekali-123')).toEqual([]);
  });
});
