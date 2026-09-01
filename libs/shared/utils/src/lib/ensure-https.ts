/**
 * Ported from mau-apps (`libs/shared/utils/src/lib/utils.ts`) verbatim.
 * Does NOT validate the target origin/domain — see the "Open-redirect"
 * note in `issues/04-enem-landing-account-web.md` for why that's an
 * intentional, disclosed choice for this project rather than an oversight.
 */
export const ensureHttps = (url: string): string => {
  const hasScheme = /^https?:\/\//i.test(url);
  return hasScheme ? url : `https://${url}`;
};
