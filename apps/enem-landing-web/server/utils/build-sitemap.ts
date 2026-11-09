import type { BlogPost, PaginatedBlogPosts } from '@enem-landing/shared-types';

export const SITE_URL = 'https://muzanella.com';

/** Largest page requested from the API while collecting every post. */
export const SITEMAP_PAGE_SIZE = 100;

/** Indexable pages that exist regardless of blog content. */
const STATIC_PATHS = ['/', '/blog', '/privacy'];

type SitemapPost = Pick<BlogPost, 'slug' | 'publishedAt' | 'updatedAt'>;

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/** `YYYY-MM-DD` from an ISO timestamp, or null when it can't be parsed. */
const toLastmod = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
};

const urlEntry = (path: string, lastmod: string | null): string => {
  const loc = `  <url><loc>${escapeXml(`${SITE_URL}${path}`)}</loc>`;
  return lastmod ? `${loc}<lastmod>${lastmod}</lastmod></url>` : `${loc}</url>`;
};

/**
 * Builds the root-domain sitemap: the static pages plus every published
 * blog post, each post dated by its last update so Google re-crawls edits.
 */
export const buildSitemap = (posts: SitemapPost[]): string => {
  const entries = [
    ...STATIC_PATHS.map((path) => urlEntry(path, null)),
    ...posts.map((post) =>
      urlEntry(
        `/blog/${encodeURIComponent(post.slug)}`,
        toLastmod(post.updatedAt) ?? toLastmod(post.publishedAt),
      ),
    ),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;
};

/**
 * Walks the paginated published-posts endpoint until every post is
 * collected. `fetchPage` throws on API errors so callers can fail loudly
 * instead of serving a sitemap that silently drops posts.
 */
export const collectPublishedPosts = async (
  fetchPage: (page: number, pageSize: number) => Promise<PaginatedBlogPosts>,
): Promise<SitemapPost[]> => {
  const posts: SitemapPost[] = [];
  for (let page = 1; ; page += 1) {
    const result = await fetchPage(page, SITEMAP_PAGE_SIZE);
    posts.push(...result.items);
    if (result.items.length === 0 || posts.length >= result.total) break;
  }
  return posts;
};
