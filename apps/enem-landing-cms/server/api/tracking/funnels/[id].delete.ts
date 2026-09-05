import { createApiClient, handleApiError } from '../../../utils/api-client.js';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  try {
    return await createApiClient(event).delete(`/tracking/funnels/${id}`);
  } catch (error) {
    return handleApiError(error);
  }
});
