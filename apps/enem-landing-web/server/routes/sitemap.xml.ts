import type { PaginatedBlogPosts } from '@enem-landing/shared-types';
import { createApiClient } from '../utils/api-client';
import { buildSitemap, collectPublishedPosts } from '../utils/build-sitemap';

/**
 * Root-domain /sitemap.xml, generated from the published blog posts so new
 * articles are listed as soon as they go live (it used to be a hand-written
 * static file that only listed the homepage). On an API error it returns
 * 503 rather than a sitemap without posts: Google keeps the last good copy
 * and retries, instead of seeing every article disappear.
 */
export default defineEventHandler(async (event) => {
  const client = createApiClient(event);
  let posts;
  try {
    posts = await collectPublishedPosts(
      (page, pageSize) =>
        client.get('/blog-posts', {
          params: { page, pageSize },
        }) as unknown as Promise<PaginatedBlogPosts>,
    );
  } catch {
    throw createError({
      statusCode: 503,
      statusMessage: 'Sitemap temporarily unavailable',
    });
  }
  setHeader(event, 'content-type', 'application/xml; charset=utf-8');
  return buildSitemap(posts);
});
