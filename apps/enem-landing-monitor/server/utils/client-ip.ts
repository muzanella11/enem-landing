import { resolveClientIp } from '@enem-landing/shared-utils';
import type { H3Event } from 'h3';

/**
 * The visitor's real IP: Cloudflare's `CF-Connecting-IP`, or the
 * socket address in local dev. Never the request's own `X-Forwarded-For`,
 * whose first entry is client-controlled behind Cloudflare.
 */
export const getClientIp = (event: H3Event): string | null =>
  resolveClientIp({
    cfConnectingIp: getHeader(event, 'cf-connecting-ip'),
    socketAddress: event.node.req.socket?.remoteAddress,
  });
