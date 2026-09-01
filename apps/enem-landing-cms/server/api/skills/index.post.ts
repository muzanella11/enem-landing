import { createApiClient, handleApiError } from '../../utils/api-client.js';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  try {
    return await createApiClient(event).post('/skills', body);
  } catch (error) {
    return handleApiError(error);
  }
});
