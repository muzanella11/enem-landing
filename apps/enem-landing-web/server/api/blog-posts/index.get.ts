import { createApiClient, handleApiError } from '../../utils/api-client.js';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  try {
    return await createApiClient().get('/blog-posts', { params: query });
  } catch (error) {
    return handleApiError(error);
  }
});
