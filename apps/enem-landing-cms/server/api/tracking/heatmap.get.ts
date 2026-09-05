import { createApiClient, handleApiError } from '../../utils/api-client.js';

export default defineEventHandler(async (event) => {
  const { path, device } = getQuery(event);
  try {
    return await createApiClient(event).get('/tracking/heatmap', {
      params: { path, device },
    });
  } catch (error) {
    return handleApiError(error);
  }
});
