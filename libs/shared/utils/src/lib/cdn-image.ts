/** Where CMS uploads live (R2 behind Cloudflare). */
export const CDN_IMAGE_ORIGIN = 'https://cdn.muzanella.com/';

/**
 * URL of `url` resized to `width` px through Cloudflare Image
 * Transformations on the page's own origin (`/cdn-cgi/image/...`), served
 * as WebP/AVIF when the browser supports it. Returns `url` unchanged when
 * transformations are off (CMS switch), or for anything not on the CDN
 * (local fallbacks, data URIs, other hosts).
 */
export const cdnImageUrl = (
  url: string | null | undefined,
  width: number,
  enabled: boolean,
): string => {
  const source = url ?? '';
  if (!enabled || !source.startsWith(CDN_IMAGE_ORIGIN)) return source;
  return `/cdn-cgi/image/width=${Math.round(width)},quality=80,format=auto,fit=scale-down/${source}`;
};

/** `srcset` for `widths`, or undefined when no transformation applies. */
export const cdnImageSrcset = (
  url: string | null | undefined,
  widths: readonly number[],
  enabled: boolean,
): string | undefined => {
  if (!enabled || !(url ?? '').startsWith(CDN_IMAGE_ORIGIN)) return undefined;
  return widths.map((w) => `${cdnImageUrl(url, w, true)} ${w}w`).join(', ');
};

/**
 * Rewrites every `<img src="https://cdn.muzanella.com/...">` in trusted,
 * already sanitized HTML (rendered blog content) to the transformed URL at
 * `width`, and marks those images lazy + async-decoded.
 */
export const rewriteCdnImages = (
  html: string,
  width: number,
  enabled: boolean,
): string => {
  if (!enabled) return html;
  return html.replace(
    /<img\b([^>]*?)\bsrc="(https:\/\/cdn\.muzanella\.com\/[^"]+)"([^>]*)>/g,
    (_match, before: string, src: string, after: string) =>
      `<img${before}src="${cdnImageUrl(src, width, true)}" loading="lazy" decoding="async"${after}>`,
  );
};
