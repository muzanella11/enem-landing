export interface ClientIpSource {
  /** Value of the `CF-Connecting-IP` header set by Cloudflare's proxy. */
  cfConnectingIp?: string | null;
  /** Remote address of the TCP connection that reached this server. */
  socketAddress?: string | null;
}

const IP_PATTERN = /^[0-9a-fA-F:.]{2,45}$/;

const normalize = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed && IP_PATTERN.test(trimmed) ? trimmed : null;
};

/**
 * Resolves the visitor's real IP for a BFF server route.
 *
 * Every public host sits behind Cloudflare, which always overwrites
 * `CF-Connecting-IP` with the single address that connected to it. The
 * request's own `X-Forwarded-For` is never read: Cloudflare appends the real
 * IP to whatever value the client sent, so its first entry is
 * client-controlled and was being used to dodge per-IP rate limits.
 *
 * Without Cloudflare (local dev) the socket's remote address is used.
 */
export const resolveClientIp = ({
  cfConnectingIp,
  socketAddress,
}: ClientIpSource): string | null =>
  normalize(cfConnectingIp) ?? normalize(socketAddress);
