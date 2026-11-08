import type { PaginatedBlogPosts } from '@enem-landing/shared-types';
import { createApiClient, handleApiError } from '../../utils/api-client.js';
import { stripPostContent } from '../../utils/strip-post-content.js';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  try {
    const page = (await createApiClient().get('/blog-posts', {
      params: query,
    })) as unknown as PaginatedBlogPosts;
    return { ...page, items: page.items.map(stripPostContent) };
  } catch (error) {
    return handleApiError(error);
  }
});
