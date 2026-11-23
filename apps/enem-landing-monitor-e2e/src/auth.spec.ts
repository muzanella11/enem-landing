import { expect, test } from '@playwright/test';
import { loginAsSuperAdmin, signIn, USER_EMAIL } from './helpers/auth.js';

test.describe('access', () => {
  test('an unauthenticated visitor goes to account-web signin and comes back', async ({
    page,
  }) => {
    await page.goto('/server');
    await page.waitForURL(/localhost:8000\/signin\?r=/);
    expect(new URL(page.url()).searchParams.get('r')).toBe(
      'http://localhost:4003/server',
    );

    await loginAsSuperAdmin(page, '/server');
    await expect(page.getByRole('heading', { name: 'Server' })).toBeVisible();
  });

  test('a non super admin is sent to /unauthorized', async ({ page }) => {
    await signIn(page, USER_EMAIL);
    await page.waitForURL(/localhost:4003\/unauthorized$/);
    await expect(page.getByText('Akses Ditolak')).toBeVisible();
  });

  test('monitor-api rejects calls without a token', async ({ request }) => {
    const response = await request.get('http://localhost:3003/overview');
    expect(response.status()).toBe(401);
    const logs = await request.get('http://localhost:3003/logs/containers');
    expect(logs.status()).toBe(401);
  });
});

test.describe('not a public site', () => {
  test('sends noindex and anti-framing headers, robots.txt disallows all', async ({
    request,
  }) => {
    // No redirect following: the 302 to account-web must carry the headers too.
    const page = await request.get('/', { maxRedirects: 0 });
    expect(page.headers()['x-robots-tag']).toBe('noindex, nofollow');
    expect(page.headers()['x-frame-options']).toBe('DENY');
    expect(page.headers()['referrer-policy']).toBe('no-referrer');

    const robots = await request.get('/robots.txt');
    expect(await robots.text()).toContain('Disallow: /');
    expect(robots.headers()['x-robots-tag']).toBe('noindex, nofollow');
  });

  test('loads no tracking, analytics or ad scripts', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (req) => {
      const host = new URL(req.url()).hostname;
      if (host !== 'localhost') external.push(req.url());
    });
    await loginAsSuperAdmin(page);
    await expect(page.getByTestId('overview')).toBeVisible();
    expect(
      external.filter((url) =>
        /google|doubleclick|analytics|adsbygoogle/.test(url),
      ),
    ).toEqual([]);
    expect(
      await page
        .locator('script[src*="googletagmanager"], script[src*="adsbygoogle"]')
        .count(),
    ).toBe(0);
  });
});
