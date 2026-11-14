export interface ClientKeySource {
  /** `req.ip`, already resolved through Express `trust proxy`. */
  ip?: string | null;
  /** Raw `X-Forwarded-For` header, only checked for presence. */
  forwardedFor?: string | string[] | null;
}

export interface ClientKey {
  key: string;
  /** True for a call from inside the Docker network without a visitor IP. */
  internal: boolean;
}

const stripIpv4Mapping = (ip: string): string =>
  ip.startsWith('::ffff:') ? ip.slice(7) : ip;

export const isPrivateAddress = (rawIp: string): boolean => {
  const ip = stripIpv4Mapping(rawIp.toLowerCase());
  if (ip === '::1' || ip.startsWith('127.') || ip.startsWith('10.')) {
    return true;
  }
  if (ip.startsWith('192.168.')) return true;
  const match = /^172\.(\d+)\./.exec(ip);
  if (match) {
    const second = Number(match[1]);
    return second >= 16 && second <= 31;
  }
  return ip.startsWith('fc') || ip.startsWith('fd');
};

/**
 * Who a request is counted against. The BFF forwards the
 * visitor's IP in `X-Forwarded-For`, which Express only trusts from a
 * loopback/private hop, so `req.ip` is the visitor. A private `req.ip`
 * without that header is a service-to-service call: it gets its own
 * `internal:` key instead of sharing a bucket with real visitors.
 */
export const resolveClientKey = ({
  ip,
  forwardedFor,
}: ClientKeySource): ClientKey => {
  const address = stripIpv4Mapping(ip?.trim() || 'unknown');
  const hasForwarded = Array.isArray(forwardedFor)
    ? forwardedFor.length > 0
    : Boolean(forwardedFor?.trim());

  if (!hasForwarded && address !== 'unknown' && isPrivateAddress(address)) {
    return { key: `internal:${address}`, internal: true };
  }
  return { key: `ip:${address}`, internal: false };
};

/** Shortens a client key for logs, so full visitor IPs never land there. */
export const maskClientKey = (key: string): string => {
  const [kind, ...rest] = key.split(':');
  const address = rest.join(':');
  if (address.includes('.')) {
    const parts = address.split('.');
    return `${kind}:${parts.slice(0, 2).join('.')}.x.x`;
  }
  if (address.includes(':')) {
    return `${kind}:${address.split(':').slice(0, 2).join(':')}:x`;
  }
  return key;
};
