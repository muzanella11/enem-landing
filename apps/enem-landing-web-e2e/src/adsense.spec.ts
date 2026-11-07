import { expect, test } from '@playwright/test';

/**
 * The publisher id comes from the tools settings in the CMS, which may or
 * may not be set in this environment, so the page is checked against the
 * same BFF response it renders from.
 */
test.describe('adsense verification', () => {
  test('meta tag and ads.txt follow the configured publisher id', async ({
    page,
    request,
  }) => {
    const { clientId } = (await (
      await request.get('/api/adsense-account')
    ).json()) as { clientId: string | null };

    await page.goto('/');
    const meta = page.locator('meta[name="google-adsense-account"]');
    const adsTxt = await request.get('/ads.txt');

    if (clientId) {
      await expect(meta).toHaveAttribute('content', clientId);
      expect(adsTxt.status()).toBe(200);
      const body = await adsTxt.text();
      expect(body).toContain(clientId.replace(/^ca-/, ''));
      expect(body).toContain('subdomain=tools.muzanella.com');
    } else {
      await expect(meta).toHaveCount(0);
      expect(adsTxt.status()).toBe(404);
    }
    // The main site never loads the ad script itself.
    await expect(page.locator('script[src*="adsbygoogle.js"]')).toHaveCount(0);
  });
});
