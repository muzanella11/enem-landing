import {
  createApiClient,
  handleApiError,
  TOOLS_SITE,
} from '../../utils/api-client';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  try {
    return await createApiClient(event).post('/tracking/clicks', {
      ...body,
      site: TOOLS_SITE,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
