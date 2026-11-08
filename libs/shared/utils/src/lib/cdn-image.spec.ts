import { describe, expect, it } from 'vitest';
import { cdnImageSrcset, cdnImageUrl, rewriteCdnImages } from './cdn-image.js';

const COVER =
  'https://cdn.muzanella.com/enem-landing-cms/blog-post-cover/a.png';

describe('cdn-image', () => {
  it('builds a same-origin transformation URL when enabled', () => {
    expect(cdnImageUrl(COVER, 800, true)).toBe(
      `/cdn-cgi/image/width=800,quality=80,format=auto,fit=scale-down/${COVER}`,
    );
  });

  it('leaves URLs alone when disabled or not on the CDN', () => {
    expect(cdnImageUrl(COVER, 800, false)).toBe(COVER);
    expect(cdnImageUrl('/img/image-not-available.svg', 800, true)).toBe(
      '/img/image-not-available.svg',
    );
    expect(
      cdnImageUrl('https://evil.example/cdn.muzanella.com/x.png', 800, true),
    ).toBe('https://evil.example/cdn.muzanella.com/x.png');
    expect(cdnImageUrl(null, 800, true)).toBe('');
  });

  it('builds a srcset only when a transformation applies', () => {
    expect(cdnImageSrcset(COVER, [480, 800], true)).toBe(
      `/cdn-cgi/image/width=480,quality=80,format=auto,fit=scale-down/${COVER} 480w, /cdn-cgi/image/width=800,quality=80,format=auto,fit=scale-down/${COVER} 800w`,
    );
    expect(cdnImageSrcset(COVER, [480], false)).toBeUndefined();
    expect(cdnImageSrcset('/x.png', [480], true)).toBeUndefined();
  });

  it('rewrites CDN images in rendered HTML only', () => {
    const html = `<p>a</p><img src="${COVER}" alt="x"><img src="/local.png">`;
    expect(rewriteCdnImages(html, 800, false)).toBe(html);
    const out = rewriteCdnImages(html, 800, true);
    expect(out).toContain(
      `<img src="/cdn-cgi/image/width=800,quality=80,format=auto,fit=scale-down/${COVER}" loading="lazy" decoding="async" alt="x">`,
    );
    expect(out).toContain('<img src="/local.png">');
  });
});
