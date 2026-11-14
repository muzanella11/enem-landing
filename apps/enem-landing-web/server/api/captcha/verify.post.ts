import { createApiClient, handleApiError } from '../../utils/api-client.js';

/** Checks a slider answer; returns a single-use token when solved. */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  try {
    return await createApiClient(event).post('/captcha/verify', body);
  } catch (error) {
    return handleApiError(error);
  }
});
