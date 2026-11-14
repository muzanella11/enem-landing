import { createApiClient, handleApiError } from '../../utils/api-client.js';

export default defineEventHandler(async (event) => {
  try {
    // Always the landing site's config - this BFF only serves enem-landing-web.
    return await createApiClient(event).get('/tracking/config', {
      params: { site: 'landing' },
    });
  } catch (error) {
    return handleApiError(error);
  }
});
