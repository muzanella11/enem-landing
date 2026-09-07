import { expect, test } from '@playwright/test';
import { loginAsSuperAdmin } from './helpers/auth.js';

// Not just `Date.now()` - the 3 browser projects launch their workers
// (each a separate process that evaluates this module) close enough
// together that a plain timestamp can collide across them, producing two
// posts/categories/tags with the identical "unique" name and breaking
// every locator below that assumes exactly one match.
const RUN_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const CATEGORY_NAME = `E2E Category ${RUN_ID}`;
const TAG_NAME = `E2E Tag ${RUN_ID}`;
const POST_TITLE = `E2E Blog Post ${RUN_ID}`;

test.describe('blog', () => {
  test('create a category, a tag, author a post, publish it, verify it persisted, and delete everything', async ({
    page,
  }) => {
    await loginAsSuperAdmin(page, '/blog/categories');

    // Same Nuxt hydration race documented in `contact-form.spec.ts`: a
    // click landing right after a fresh page load (here, right after the
    // SSO redirect chain) can be a silent no-op if Vue's own listener
    // isn't attached yet, even though the button already looks clickable.
    // Retrying the whole open-modal+fill+save unit is safe here (unlike
    // the deletes further down) - a no-op attempt leaves nothing behind
    // to duplicate, it just didn't happen yet.
    await expect(async () => {
      await page.getByRole('button', { name: 'Add Category' }).click();
      await page.getByLabel('Name', { exact: true }).fill(CATEGORY_NAME);
      await page.getByRole('button', { name: 'Save' }).click();
      await expect(page.getByText(CATEGORY_NAME)).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 15_000 });

    // Tag
    await page.goto('/blog/tags');
    await expect(async () => {
      await page.getByRole('button', { name: 'Add Tag' }).click();
      await page.getByLabel('Name', { exact: true }).fill(TAG_NAME);
      await page.getByRole('button', { name: 'Save' }).click();
      await expect(page.getByText(TAG_NAME)).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 15_000 });

    // Create the post - the real flow only asks for a title up front, the
    // rest is filled in on the redirected-to edit page (mirrors
    // `experiences.spec.ts`'s create-then-edit pattern).
    await page.goto('/blog');
    await page.getByRole('button', { name: 'Add Post' }).click();
    await page.getByLabel('Title').fill(POST_TITLE);
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForURL(/\/blog\/[\w-]+$/);

    // Slug is auto-generated from the title and not editable - see
    // `BlogPostsService.resolveUniqueSlug`, no `slug` field even exists on
    // `UpdateBlogPostDto`.
    const slugField = page.getByLabel(/Slug/);
    await expect(slugField).toHaveAttribute('readonly', '');
    await expect(slugField).not.toHaveValue('');

    // Same Nuxt hydration race documented in `site-profile.spec.ts` - this
    // form's fields are pre-populated from `useFetch`, so an interaction
    // landing before Vue's own listeners attach is a silent no-op.
    await page.waitForTimeout(2_000);

    await page.getByLabel('Excerpt').fill('Written by an e2e test.');
    await page.locator('.ql-editor').click();
    await page.keyboard.type('Body content written by Playwright.');

    // Vuetify's `v-select` opens its menu from a click anywhere on the
    // field's root `.v-select` element, not specifically the underlying
    // `role="combobox"` input (which a `v-field__input` wrapper div sits
    // on top of - Playwright's actionability check flags it as
    // "intercepting pointer events"). Clicking the root directly avoids
    // fighting that layering with `force: true`, which opened the menu in
    // Chromium/WebKit but not Firefox.
    await page.locator('.v-select', { hasText: 'Categories' }).click();
    await page.getByRole('option', { name: CATEGORY_NAME }).click();
    await page.keyboard.press('Escape');

    await page.locator('.v-select', { hasText: 'Tags' }).click();
    await page.getByRole('option', { name: TAG_NAME }).click();
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Published' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Post saved.')).toBeVisible();

    // Verify it actually persisted, not just that the toast fired.
    await page.reload();
    await page.waitForTimeout(2_000);
    await expect(page.getByLabel('Excerpt')).toHaveValue('Written by an e2e test.');
    await expect(page.locator('.ql-editor')).toContainText('Body content written by Playwright.');
    await expect(page.getByText(CATEGORY_NAME)).toBeVisible();
    await expect(page.getByText(TAG_NAME)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Published' })).toHaveClass(/v-btn--active/);

    // Cleanup: post, then category and tag. Same hydration race documented
    // in `site-profile.spec.ts` - `goto` lands on an already-server-
    // rendered, clickable-looking row before Vue's own listeners attach,
    // so a click landing too early is a silent no-op. A delete click isn't
    // safely retriable (unlike a form fill+submit), so this waits for
    // hydration to settle once and clicks exactly once, rather than
    // retrying the click itself.
    await page.goto('/blog');
    await page.waitForTimeout(2_000);
    await page.getByRole('row', { name: POST_TITLE }).getByRole('button').last().click();
    await expect(page.getByText(POST_TITLE)).toBeHidden();

    await page.goto('/blog/categories');
    await page.waitForTimeout(2_000);
    await page.getByRole('row', { name: CATEGORY_NAME }).getByRole('button').last().click();
    await expect(page.getByText(CATEGORY_NAME)).toBeHidden();

    await page.goto('/blog/tags');
    await page.waitForTimeout(2_000);
    await page.getByRole('row', { name: TAG_NAME }).getByRole('button').last().click();
    await expect(page.getByText(TAG_NAME)).toBeHidden();
  });
});
