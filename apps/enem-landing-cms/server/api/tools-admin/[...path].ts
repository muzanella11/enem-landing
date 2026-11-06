import { createApiClient, handleApiError } from '../../utils/api-client.js';

/**
 * BFF for the CMS "Tools" menu (Story 25): forwards to enem-landing-api's
 * `/tools/admin/*` with the admin's token. Only these resources are
 * reachable; the API itself still enforces the admin role.
 */
const ALLOWED =
  /^(tools(\/reorder|\/[\w-]+)?|donation-options(\/[\w-]+)?|settings|stats)$/;

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path') ?? '';
  if (!ALLOWED.test(path)) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' });
  }
  const method = event.method.toLowerCase();
  const client = createApiClient(event);
  const url = `/tools/admin/${path}`;
  try {
    if (method === 'get') return await client.get(url);
    if (method === 'delete') return await client.delete(url);
    const body = await readBody(event);
    if (method === 'post') return await client.post(url, body);
    if (method === 'put') return await client.put(url, body);
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
  } catch (error) {
    return handleApiError(error);
  }
});
