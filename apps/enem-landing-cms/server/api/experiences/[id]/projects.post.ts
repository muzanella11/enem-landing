import { createApiClient, handleApiError } from '../../../utils/api-client.js';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  try {
    return await createApiClient(event).post(
      `/experiences/${id}/projects`,
      body,
    );
  } catch (error) {
    return handleApiError(error);
  }
});
