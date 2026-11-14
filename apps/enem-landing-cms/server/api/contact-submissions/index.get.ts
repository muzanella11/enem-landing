import { createApiClient, handleApiError } from '../../utils/api-client.js';

export default defineEventHandler(async (event) => {
  const { status, ipAddress, visitorId } = getQuery(event);
  try {
    return await createApiClient(event).get('/contact-submissions', {
      params: { status, ipAddress, visitorId },
    });
  } catch (error) {
    return handleApiError(error);
  }
});
