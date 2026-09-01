import { createApiClient, handleApiError } from '../../utils/api-client.js';

export default defineEventHandler(async (event) => {
  const pageKey = getRouterParam(event, 'pageKey');
  try {
    return await createApiClient().get(`/seo-meta/${pageKey}`);
  } catch (error) {
    return handleApiError(error);
  }
});
