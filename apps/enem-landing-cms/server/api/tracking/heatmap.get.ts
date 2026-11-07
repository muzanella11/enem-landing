import { createApiClient, handleApiError } from '../../utils/api-client.js';
import { getTrackingSite } from '../../utils/tracking-site.js';

export default defineEventHandler(async (event) => {
  const { path, device } = getQuery(event);
  try {
    return await createApiClient(event).get('/tracking/heatmap', {
      params: { path, device, site: getTrackingSite(event) },
    });
  } catch (error) {
    return handleApiError(error);
  }
});
