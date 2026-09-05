import {
  createApiClient,
  handleApiError,
} from '../../../../utils/api-client.js';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  try {
    return await createApiClient(event).get(`/tracking/funnels/${id}/report`);
  } catch (error) {
    return handleApiError(error);
  }
});
