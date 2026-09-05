/**
 * Replaces geoip-lite (Story 11 follow-up) - its bundled ~110MB of data
 * files kept intermittently corrupting containerd's overlayfs extraction on
 * the prod VPS (`failed to Lchown .../geoip-lite/data/*.dat`), and its
 * snapshot-in-time database was going stale for newer IP ranges, leaving
 * the portfolio-list visitor map empty. ip-api.com is free, needs no API
 * key, and is always current. Ported from the same pattern used in
 * mitra-rumah's `lib/backend/geo-ip.ts`.
 */

export interface GeoLookupResult {
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

const EMPTY_GEO: GeoLookupResult = {
  country: null,
  region: null,
  city: null,
  latitude: null,
  longitude: null,
};

const LOOKUP_TIMEOUT_MS = 3000;
const FIELDS = 'status,country,region,city,lat,lon';

const PRIVATE_IP_PREFIXES = [
  '127.',
  '::1',
  '10.',
  '192.168.',
  '172.16.',
  '172.17.',
  '172.18.',
  '172.19.',
  '172.2',
  '172.3',
];

function isPrivateIp(ip: string): boolean {
  return PRIVATE_IP_PREFIXES.some((prefix) => ip.startsWith(prefix));
}

export async function lookupGeo(ip: string | null): Promise<GeoLookupResult> {
  if (!ip || isPrivateIp(ip)) return EMPTY_GEO;

  try {
    const response = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=${FIELDS}`,
      { signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS) },
    );
    if (!response.ok) return EMPTY_GEO;

    const data = (await response.json()) as {
      status: string;
      country?: string;
      region?: string;
      city?: string;
      lat?: number;
      lon?: number;
    };
    if (data.status !== 'success') return EMPTY_GEO;

    return {
      country: data.country ?? null,
      region: data.region ?? null,
      city: data.city ?? null,
      latitude: data.lat ?? null,
      longitude: data.lon ?? null,
    };
  } catch {
    // Timeout, network error, bad JSON - never let a geo lookup break
    // session creation, same as geoip-lite's `undefined` on a miss.
    return EMPTY_GEO;
  }
}
