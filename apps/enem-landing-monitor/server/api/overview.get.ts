import { createMonitorApiClient, handleApiError } from '../utils/api-client.js';

export default defineEventHandler(async (event) => {
  try {
    return await createMonitorApiClient(event).get('/overview');
  } catch (error) {
    return handleApiError(error);
  }
});
