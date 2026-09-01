import { createApiClient, handleApiError } from '../../../utils/api-client.js';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  try {
    return await createApiClient(event).patch(`/contact-submissions/${id}/read`);
  } catch (error) {
    return handleApiError(error);
  }
});
