import { createApiClient, handleApiError } from '../../utils/api-client.js';

export default defineEventHandler(async (event) => {
  const { key } = getQuery(event);
  try {
    return await createApiClient(event).delete('/cache', { params: { key } });
  } catch (error) {
    return handleApiError(error);
  }
});
