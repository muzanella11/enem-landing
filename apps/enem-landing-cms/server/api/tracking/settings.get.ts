import { createApiClient, handleApiError } from '../../utils/api-client.js';
import { getTrackingSite } from '../../utils/tracking-site.js';

export default defineEventHandler(async (event) => {
  try {
    return await createApiClient(event).get('/tracking/settings', {
      params: { site: getTrackingSite(event) },
    });
  } catch (error) {
    return handleApiError(error);
  }
});
