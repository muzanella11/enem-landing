import { rewriteCdnImages } from '@enem-landing/shared-utils';
import { QuillDeltaToHtmlConverter } from 'quill-delta-to-html';
import sanitizeHtml from 'sanitize-html';

/**
 * Turns a post's Quill Delta into sanitized HTML on the server. Doing this
 * in the page shipped quill-delta-to-html + sanitize-html (+ postcss) to
 * every reader, ~220 KB of JavaScript that PageSpeed flagged on article
 * pages, only to recompute HTML the server had already rendered.
 */
export const renderPostHtml = (
  contentDelta: unknown,
  options: { imageTransforms?: boolean } = {},
): string => {
  const ops = (contentDelta as { ops?: unknown[] } | null)?.ops ?? [];
  const converter = new QuillDeltaToHtmlConverter(ops as never[], {});
  const html = sanitizeHtml(converter.convert(), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'width', 'height'],
      a: ['href', 'name', 'target', 'rel'],
    },
  });
  // Article images: resized like the cover when the CMS switch is on.
  return rewriteCdnImages(html, 800, Boolean(options.imageTransforms));
};
