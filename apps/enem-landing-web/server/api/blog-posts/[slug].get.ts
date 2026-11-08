import type { BlogPost } from '@enem-landing/shared-types';
import { createApiClient, handleApiError } from '../../utils/api-client.js';
import { renderPostHtml } from '../../utils/render-post-html.js';
import { stripPostContent } from '../../utils/strip-post-content.js';

/**
 * One published post, with its body already rendered to sanitized HTML
 * (`contentHtml`). The raw Delta is dropped from the response so it isn't
 * shipped twice in the page payload.
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug');
  try {
    const post = (await createApiClient().get(
      `/blog-posts/${slug}`,
    )) as unknown as BlogPost;
    return {
      ...stripPostContent(post),
      contentHtml: renderPostHtml(post.contentDelta),
    };
  } catch (error) {
    return handleApiError(error);
  }
});
