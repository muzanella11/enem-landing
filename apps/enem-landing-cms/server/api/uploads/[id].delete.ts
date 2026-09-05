import {
  createAccountApiClient,
  handleApiError,
} from '../../utils/api-client.js';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  try {
    return await createAccountApiClient(event).delete(`/uploads/${id}`);
  } catch (error) {
    return handleApiError(error);
  }
});
