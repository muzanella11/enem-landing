import { createApiClient, handleApiError } from '../../utils/api-client.js';

export default defineEventHandler(async () => {
  try {
    return await createApiClient().get('/site-profile');
  } catch (error) {
    return handleApiError(error);
  }
});
