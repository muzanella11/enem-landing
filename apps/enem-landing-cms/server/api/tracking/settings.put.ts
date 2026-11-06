import { createApiClient, handleApiError } from '../../utils/api-client.js';
import { getTrackingSite } from '../../utils/tracking-site.js';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  try {
    return await createApiClient(event).put('/tracking/settings', body, {
      params: { site: getTrackingSite(event) },
    });
  } catch (error) {
    return handleApiError(error);
  }
});
