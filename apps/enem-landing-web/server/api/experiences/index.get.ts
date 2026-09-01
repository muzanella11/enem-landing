import { createApiClient, handleApiError } from '../../utils/api-client.js';

export default defineEventHandler(async () => {
  try {
    return await createApiClient().get('/experiences');
  } catch (error) {
    return handleApiError(error);
  }
});
