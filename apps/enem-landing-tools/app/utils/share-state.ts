/**
 * Share links (Story 20): a tool's state travels in the URL fragment
 * (`#s=<base64url JSON>`), never in the query string. The fragment is read
 * once at startup and immediately removed from the address bar by the
 * `share-fragment` plugin, before any ad script can read the page URL.
 */
export const SHARE_FRAGMENT_PREFIX = '#s=';

const toBase64Url = (text: string): string => {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const fromBase64Url = (encoded: string): string => {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

export const encodeShareState = (toolId: string, state: unknown): string =>
  `${SHARE_FRAGMENT_PREFIX}${toBase64Url(JSON.stringify({ t: toolId, s: state }))}`;

/** Returns the decoded state when the fragment belongs to `toolId`, else null. */
export const decodeShareState = <T>(hash: string, toolId: string): T | null => {
  if (!hash.startsWith(SHARE_FRAGMENT_PREFIX)) return null;
  try {
    const parsed = JSON.parse(
      fromBase64Url(hash.slice(SHARE_FRAGMENT_PREFIX.length)),
    ) as { t?: string; s?: T };
    return parsed.t === toolId && parsed.s !== undefined ? parsed.s : null;
  } catch {
    return null;
  }
};
