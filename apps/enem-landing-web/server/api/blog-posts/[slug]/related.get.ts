import type { BlogPost } from '@enem-landing/shared-types';
import { createApiClient, handleApiError } from '../../../utils/api-client.js';
import { stripPostContent } from '../../../utils/strip-post-content.js';

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug');
  try {
    const posts = (await createApiClient().get(
      `/blog-posts/${slug}/related`,
    )) as unknown as BlogPost[];
    return posts.map(stripPostContent);
  } catch (error) {
    return handleApiError(error);
  }
});
