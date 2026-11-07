import { createApiClient, handleApiError } from '../../utils/api-client.js';

export default defineEventHandler(async () => {
  try {
    // Always the landing site's config - this BFF only serves enem-landing-web.
    return await createApiClient().get('/tracking/config', {
      params: { site: 'landing' },
    });
  } catch (error) {
    return handleApiError(error);
  }
});
