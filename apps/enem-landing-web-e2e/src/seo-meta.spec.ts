import { expect, test } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

/**
 * `enem-landing-api` isn't reseeded per e2e run - a `seo-meta` row for
 * "home" may or may not exist depending on what's been created via
 * enem-landing-cms in this environment. Rather than assuming either state,
 * this reads the same BFF response the page itself renders from
 * (`GET /api/seo-meta/home`) and asserts the rendered tags match it - or,
 * on a 404 (no row yet), match `index.vue`'s hardcoded `DEFAULT_SEO`.
 */
const DEFAULT_SEO = {
  title: 'Nurfirliana Muzanella',
  description:
    "Hello, I'm Frontend Engineer. Combine the art of design with the art of programming.",
};

const getExpectedSeo = async (request: APIRequestContext) => {
  const seoResponse = await request.get('/api/seo-meta/home');
  if (!seoResponse.ok()) return DEFAULT_SEO;
  return (await seoResponse.json()) as { title: string; description: string };
};

test.describe('seo-meta', () => {
  test('renders title, description and og tags for the home page', async ({ page, request }) => {
    const expected = await getExpectedSeo(request);

    await page.goto('/');

    await expect(page).toHaveTitle(expected.title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      expected.description,
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      expected.title,
    );
  });
});
