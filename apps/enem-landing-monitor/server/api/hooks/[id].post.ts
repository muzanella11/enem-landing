import { getClientIp } from '../../utils/client-ip.js';

/** 16 KB, same cap as the monitor-api side. */
const MAX_BODY_BYTES = 16 * 1024;

/**
 * Public alert webhook: `POST https://monitor.muzanella.com/api/hooks/<id>`
 * with `X-Webhook-Key`, used by mysql-backup.sh on the VPS (through
 * Cloudflare, so Traefik's cloudflare-only middleware still applies).
 * No SSO here; monitor-api checks the per-hook key and rate-limits it.
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') ?? '';
  if (!/^[a-z0-9-]{1,40}$/.test(id)) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' });
  }
  const length = Number(getHeader(event, 'content-length') ?? '0');
  if (length > MAX_BODY_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Body too large' });
  }
  const raw = (await readRawBody(event, 'utf8')) ?? '';
  if (Buffer.byteLength(raw) > MAX_BODY_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Body too large' });
  }
  // Real IP (CF-Connecting-IP), so the webhook rate limit is per caller.
  const forwardedFor = getClientIp(event);
  const response = await fetch(
    new URL(`/hooks/${id}`, useRuntimeConfig().monitorApiHost as string),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Key': getHeader(event, 'x-webhook-key') ?? '',
        ...(forwardedFor ? { 'X-Forwarded-For': forwardedFor } : {}),
      },
      body: raw || '{}',
      signal: AbortSignal.timeout(10_000),
    },
  ).catch(() => null);
  if (!response) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Monitor API is unreachable',
    });
  }
  setResponseStatus(event, response.status);
  return response.json().catch(() => ({}));
});
