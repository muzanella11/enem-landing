/**
 * `<lastmod>` dates for the tools sitemap.
 *
 * Google only trusts `<lastmod>` when it is "consistently and verifiably
 * accurate", meaning it reflects the last *significant* change to the page's
 * main content. It used to be the build date for every URL, so every deploy
 * marked ~1,200 pages as modified and taught Google to ignore the field.
 *
 * Dates are kept here by hand (not derived from git: the Docker build uses a
 * shallow clone, and refactors or UI tweaks are not content changes).
 *
 * WHEN TO BUMP: set `CONTENT_UPDATED[<tool slug>]` to today's date when the
 * tool's main content changes in a way a reader would notice: new data
 * (tarif, UMP, harga BBM, libur), a formula or rule change, new or rewritten
 * explanatory text or FAQ, or new answer pages. Do NOT bump for styling,
 * refactors, share buttons, ads, analytics, or other site-wide UI.
 */

/** Launch of tools.muzanella.com: the content date of every page until bumped. */
export const CONTENT_BASELINE = '2026-11-07';

/**
 * Last significant content change per tool slug (or `pasang-widget` /
 * `privasi`). Tools not listed here use `CONTENT_BASELINE`.
 */
export const CONTENT_UPDATED: Readonly<Record<string, string>> = {};

/**
 * Tools whose main content genuinely changes every day (today's prayer
 * times, today's gold price), so their pages are dated today.
 */
export const DAILY_CONTENT_TOOLS: readonly string[] = [
  'jadwal-sholat',
  'harga-emas',
];

/**
 * Answer-page families that live under a different first path segment than
 * their tool: `/gaji-bersih/5000000` is generated from the gaji bersih
 * calculator's data, so it shares that tool's content date.
 */
export const ROUTE_FAMILY_TOOL: Readonly<Record<string, string>> = {
  'gaji-bersih': 'kalkulator-gaji-bersih',
  thr: 'kalkulator-thr',
  'token-listrik': 'kalkulator-token-listrik',
};

/** Tool slug (or page key) that owns a sitemap path like `/upah-minimum/aceh`. */
export const contentKeyForPath = (path: string): string => {
  const segment = path.split('/').filter(Boolean)[0] ?? '';
  return ROUTE_FAMILY_TOOL[segment] ?? segment;
};

/**
 * `<lastmod>` for a sitemap path. `today` is the current date in WIB
 * (YYYY-MM-DD), used only for daily-content tools. The homepage lists every
 * tool, so it takes the newest non-daily date among the listed pages.
 */
export const lastmodForPath = (
  path: string,
  today: string,
  listedPaths: readonly string[] = [],
): string => {
  const key = contentKeyForPath(path);
  if (key === '') {
    return listedPaths
      .filter((listed) => contentKeyForPath(listed) !== '')
      .map((listed) => contentDate(contentKeyForPath(listed)))
      .reduce(
        (newest, date) => (date > newest ? date : newest),
        CONTENT_BASELINE,
      );
  }
  return DAILY_CONTENT_TOOLS.includes(key) ? today : contentDate(key);
};

const contentDate = (key: string): string =>
  CONTENT_UPDATED[key] ?? CONTENT_BASELINE;
