import { createApiClient, handleApiError } from '../../utils/api-client.js';

export default defineEventHandler(async (event) => {
  try {
    return await createApiClient(event).get('/tracking/overview');
  } catch (error) {
    return handleApiError(error);
  }
});
