import {
  createAccountApiClient,
  handleApiError,
} from '../../utils/api-client.js';

export default defineEventHandler(async (event) => {
  try {
    return await createAccountApiClient(event).get('/system-settings');
  } catch (error) {
    return handleApiError(error);
  }
});
