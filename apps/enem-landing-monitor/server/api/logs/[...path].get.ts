import {
  createMonitorApiClient,
  handleApiError,
} from '../../utils/api-client.js';

/** Only the monitor-api's own `/logs/**` routes are reachable through here. */
const ALLOWED_PATH = /^[a-z0-9/-]{1,120}$/;

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path') ?? '';
  if (!ALLOWED_PATH.test(path) || path.includes('..')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid path' });
  }
  try {
    return await createMonitorApiClient(event).get(`/logs/${path}`, {
      params: getQuery(event),
    });
  } catch (error) {
    return handleApiError(error);
  }
});
