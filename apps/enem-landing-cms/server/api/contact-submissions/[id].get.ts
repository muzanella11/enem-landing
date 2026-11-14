import { createApiClient, handleApiError } from '../../utils/api-client.js';

/** One submission with its sender details (admin only). */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  try {
    return await createApiClient(event).get(`/contact-submissions/${id}`);
  } catch (error) {
    return handleApiError(error);
  }
});
