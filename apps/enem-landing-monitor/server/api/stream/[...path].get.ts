import { getAuthToken } from '../../utils/api-client.js';
import { getClientIp } from '../../utils/client-ip.js';

/** `sources/<id>/follow` or `containers/<64 hex>/follow` only. */
const FOLLOW_PATH =
  /^(sources\/[a-z0-9-]{1,40}|containers\/[a-f0-9]{64})\/follow$/;

/**
 * Live tail (Server-Sent Events) from the browser's EventSource: forwards
 * the SSO cookie as a Bearer token to monitor-api and streams its response
 * back unchanged. Closing the tab aborts the upstream request.
 */
export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path') ?? '';
  if (!FOLLOW_PATH.test(path)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid path' });
  }
  const token = getAuthToken(event);
  if (!token)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });

  const url = new URL(
    `/logs/${path}`,
    useRuntimeConfig().monitorApiHost as string,
  );
  const query = getQuery(event);
  for (const key of ['q', 'stream']) {
    const value = query[key];
    if (typeof value === 'string' && value) url.searchParams.set(key, value);
  }

  const controller = new AbortController();
  event.node.req.on('close', () => controller.abort());
  const forwardedFor = getClientIp(event);
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...(forwardedFor ? { 'X-Forwarded-For': forwardedFor } : {}),
    },
    signal: controller.signal,
  }).catch(() => null);
  if (!response) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Monitor API is unreachable',
    });
  }
  if (!response.ok || !response.body) {
    const body = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw createError({
      statusCode: response.status,
      statusMessage: body.message ?? 'Live tail failed',
    });
  }
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Accel-Buffering': 'no',
  });
  return sendStream(event, response.body);
});
