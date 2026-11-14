import { createApiClient, handleApiError } from '../../utils/api-client.js';

export default defineEventHandler(async (event) => {
  try {
    return await createApiClient(event).get('/experiences');
  } catch (error) {
    return handleApiError(error);
  }
});
