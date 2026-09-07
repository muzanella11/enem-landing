import { createApiClient, handleApiError } from '../../utils/api-client.js';

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug');
  try {
    return await createApiClient().get(`/blog-posts/${slug}`);
  } catch (error) {
    return handleApiError(error);
  }
});
