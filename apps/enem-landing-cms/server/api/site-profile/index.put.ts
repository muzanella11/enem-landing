import { createApiClient, handleApiError } from '../../utils/api-client.js';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  try {
    return await createApiClient(event).put('/site-profile', body);
  } catch (error) {
    return handleApiError(error);
  }
});
