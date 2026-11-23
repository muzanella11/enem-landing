import {
  createMonitorApiClient,
  handleApiError,
} from '../../utils/api-client.js';

/**
 * Proxy for the monitor-api routes added after the Logs menu. Only these
 * top-level paths and methods are reachable; the API checks the role.
 */
const ALLOWED: Record<string, RegExp> = {
  GET: /^(alerts(\/(overview|rules))?|metrics\/(host|containers|history)|uptime|security\/(summary|known-ips)|db\/(stats|sizes|slow-patterns)|redis\/stats|cache|deploy)$/,
  PUT: /^(alerts\/rules\/[a-z-]{1,40}|security\/known-ips\/[0-9a-fA-F.:]{2,45})$/,
  DELETE: /^(cache|security\/known-ips\/[0-9a-fA-F.:]{2,45})$/,
  POST: /^uptime\/tls\/refresh$/,
};

export default defineEventHandler(async (event) => {
  const method = event.method.toUpperCase();
  const path = getRouterParam(event, 'path') ?? '';
  if (!ALLOWED[method]?.test(path)) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' });
  }
  const client = createMonitorApiClient(event);
  const params = getQuery(event);
  try {
    switch (method) {
      case 'PUT':
        return await client.put(`/${path}`, await readBody(event), { params });
      case 'DELETE':
        return await client.delete(`/${path}`, { params });
      case 'POST':
        return await client.post(`/${path}`, {}, { params });
      default:
        return await client.get(`/${path}`, { params });
    }
  } catch (error) {
    return handleApiError(error);
  }
});
