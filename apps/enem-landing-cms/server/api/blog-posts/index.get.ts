import { createApiClient, handleApiError } from '../../utils/api-client.js';

/** CMS list page always needs every status (draft + published), so this proxies to the admin listing rather than the public `/blog-posts` endpoint. */
export default defineEventHandler(async (event) => {
  try {
    return await createApiClient(event).get('/blog-posts/admin');
  } catch (error) {
    return handleApiError(error);
  }
});
