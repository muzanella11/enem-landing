import type { BlogPost } from '@enem-landing/shared-types';
import { createApiClient, handleApiError } from '../../utils/api-client.js';
import { getPublicSettings } from '../../utils/public-settings.js';
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
    const [post, settings] = await Promise.all([
      createApiClient().get(
        `/blog-posts/${slug}`,
      ) as unknown as Promise<BlogPost>,
      // CMS switch for resized CDN images; any error leaves it off.
      getPublicSettings(),
    ]);
    const imageTransforms = settings.imageTransformsEnabled;
    return {
      ...stripPostContent(post),
      contentHtml: renderPostHtml(post.contentDelta, { imageTransforms }),
    };
  } catch (error) {
    return handleApiError(error);
  }
});
