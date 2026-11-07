import { createApiClient, handleApiError } from '../../utils/api-client.js';

// Forwards `?published=true` (blog filter: only entries used by a published post).
export default defineEventHandler(async (event) => {
  const { published } = getQuery(event);
  try {
    return await createApiClient().get('/blog-tags', {
      params: published === 'true' ? { published: 'true' } : {},
    });
  } catch (error) {
    return handleApiError(error);
  }
});
