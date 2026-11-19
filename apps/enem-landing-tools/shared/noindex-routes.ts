/**
 * Programmatic route families kept out of search results.
 *
 * These pages are near-identical templates (one per salary amount, token
 * nominal, or Ramadan city) and read as scaled, low-value content to Google
 * and AdSense review. They stay reachable for visitors and internal links,
 * but carry `noindex, follow` and are left out of sitemap.xml.
 *
 * `jadwal-imsakiyah` is seasonal: remove it from this list a few weeks before
 * Ramadan so the city pages can be indexed again.
 */
export const NOINDEX_ROUTE_FAMILIES = [
  'gaji-bersih',
  'thr',
  'token-listrik',
  'jadwal-imsakiyah',
] as const;

/** True for `/<family>/<param>` pages of a noindex family (not the family index). */
export function isNoindexPath(path: string): boolean {
  const [family, param] = path.replace(/^\/+/, '').split('/');
  return (
    !!param &&
    (NOINDEX_ROUTE_FAMILIES as readonly string[]).includes(family ?? '')
  );
}
