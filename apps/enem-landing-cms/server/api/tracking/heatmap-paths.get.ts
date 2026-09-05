import { createApiClient, handleApiError } from '../../utils/api-client.js';

export default defineEventHandler(async (event) => {
  try {
    return await createApiClient(event).get('/tracking/heatmap/paths');
  } catch (error) {
    return handleApiError(error);
  }
});
