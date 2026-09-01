import { createApiClient, handleApiError } from '../../utils/api-client.js';

export default defineEventHandler(async (event) => {
  try {
    return await createApiClient(event).get('/site-profile');
  } catch (error) {
    return handleApiError(error);
  }
});
