import { createApiClient, handleApiError } from '../../../utils/api-client.js';

/** Marks a submission as spam or not spam. Never re-sends emails. */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  try {
    return await createApiClient(event).patch(
      `/contact-submissions/${id}/spam`,
      body,
    );
  } catch (error) {
    return handleApiError(error);
  }
});
