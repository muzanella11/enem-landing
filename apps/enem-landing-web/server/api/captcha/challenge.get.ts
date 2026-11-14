import { createApiClient, handleApiError } from '../../utils/api-client.js';

/** A fresh slider puzzle for the contact form. */
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'cache-control', 'no-store');
  try {
    return await createApiClient(event).get('/captcha/challenge');
  } catch (error) {
    return handleApiError(error);
  }
});
