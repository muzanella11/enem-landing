/**
 * AdSense helpers for the ads.txt routes (Story 27). Used by
 * enem-landing-tools (tools.muzanella.com/ads.txt) and enem-landing-web
 * (muzanella.com/ads.txt, which Google crawls first for every subdomain).
 * Google's certification authority id for AdSense is fixed.
 */
const GOOGLE_CERT_AUTHORITY_ID = 'f08c47fec0942fa0';

/** `ca-pub-123` -> `pub-123`; null for anything that isn't a publisher id. */
export const publisherIdFromClientId = (
  clientId: string | null | undefined,
): string | null => {
  const match = /^ca-(pub-\d{10,20})$/.exec((clientId ?? '').trim());
  return match ? match[1]! : null;
};

/**
 * The ads.txt body AdSense asks for, or null when no publisher id is set.
 * `subdomains` adds `subdomain=` lines so crawlers also read the
 * subdomains' own ads.txt (only meaningful on the root domain's file).
 */
export const buildAdsTxt = (
  clientId: string | null | undefined,
  subdomains: readonly string[] = [],
): string | null => {
  const publisherId = publisherIdFromClientId(clientId);
  if (!publisherId) return null;
  const lines = [
    `google.com, ${publisherId}, DIRECT, ${GOOGLE_CERT_AUTHORITY_ID}`,
    ...subdomains
      .map((host) => host.trim())
      .filter(Boolean)
      .map((host) => `subdomain=${host}`),
  ];
  return `${lines.join('\n')}\n`;
};
