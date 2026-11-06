/**
 * AdSense helpers shared by the ads.txt route and the page head (Story 27).
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

/** The ads.txt line AdSense asks for, or null when no publisher id is set. */
export const buildAdsTxt = (
  clientId: string | null | undefined,
): string | null => {
  const publisherId = publisherIdFromClientId(clientId);
  return publisherId
    ? `google.com, ${publisherId}, DIRECT, ${GOOGLE_CERT_AUTHORITY_ID}\n`
    : null;
};
