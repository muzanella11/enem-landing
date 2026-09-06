import {
  createAccountApiClient,
  handleApiError,
} from '../../utils/api-client.js';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  try {
    return await createAccountApiClient(event).post('/email/test', body);
  } catch (error) {
    return handleApiError(error);
  }
});
