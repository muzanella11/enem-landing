import type { BlogPost, PaginatedBlogPosts } from '@enem-landing/shared-types';
import {
  buildSitemap,
  collectPublishedPosts,
  SITEMAP_PAGE_SIZE,
} from './build-sitemap';

const post = (
  slug: string,
  updatedAt: string,
  publishedAt: string | null = null,
) => ({ slug, updatedAt, publishedAt }) as BlogPost;

describe('buildSitemap', () => {
  it('lists the static pages and every post with its lastmod', () => {
    const xml = buildSitemap([
      post('cara-kompres-pdf', '2026-10-05T08:30:00.000Z'),
      post('simulasi-kpr', '2026-11-01T00:00:00.000Z'),
    ]);

    expect(xml).toContain('<loc>https://muzanella.com/</loc>');
    expect(xml).toContain('<loc>https://muzanella.com/blog</loc>');
    expect(xml).toContain('<loc>https://muzanella.com/privacy</loc>');
    expect(xml).toContain(
      '<loc>https://muzanella.com/blog/cara-kompres-pdf</loc><lastmod>2026-10-05</lastmod>',
    );
    expect(xml).toContain(
      '<loc>https://muzanella.com/blog/simulasi-kpr</loc><lastmod>2026-11-01</lastmod>',
    );
    expect(xml.match(/<url>/g)).toHaveLength(5);
  });

  it('falls back to publishedAt and omits lastmod when no date parses', () => {
    const xml = buildSitemap([
      post('a', 'not-a-date', '2026-09-01T00:00:00.000Z'),
      post('b', '', null),
    ]);

    expect(xml).toContain('/blog/a</loc><lastmod>2026-09-01</lastmod>');
    expect(xml).toContain('/blog/b</loc></url>');
  });

  it('escapes and encodes unsafe slug characters', () => {
    const xml = buildSitemap([post('a&b', '2026-01-01T00:00:00.000Z')]);

    expect(xml).toContain('/blog/a%26b</loc>');
    expect(xml).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;)/);
  });
});

describe('collectPublishedPosts', () => {
  const pages = (total: number) => {
    const all = Array.from({ length: total }, (_, i) =>
      post(`p${i}`, '2026-01-01T00:00:00.000Z'),
    );
    return vi.fn(
      async (page: number, pageSize: number): Promise<PaginatedBlogPosts> => ({
        items: all.slice((page - 1) * pageSize, page * pageSize),
        total,
        page,
        pageSize,
      }),
    );
  };

  it('walks every page until all posts are collected', async () => {
    const fetchPage = pages(SITEMAP_PAGE_SIZE * 2 + 5);

    const posts = await collectPublishedPosts(fetchPage);

    expect(posts).toHaveLength(SITEMAP_PAGE_SIZE * 2 + 5);
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });

  it('makes a single request when there are no posts', async () => {
    const fetchPage = pages(0);

    expect(await collectPublishedPosts(fetchPage)).toEqual([]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('stops on an empty page even if total overstates the count', async () => {
    const fetchPage = vi.fn(async () => ({
      items: [],
      total: 50,
      page: 1,
      pageSize: SITEMAP_PAGE_SIZE,
    }));

    expect(await collectPublishedPosts(fetchPage)).toEqual([]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('propagates API errors', async () => {
    const fetchPage = vi.fn(async () => {
      throw new Error('down');
    });

    await expect(collectPublishedPosts(fetchPage)).rejects.toThrow('down');
  });
});
