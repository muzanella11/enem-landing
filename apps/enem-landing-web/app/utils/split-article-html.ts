/** Shortest article (in paragraphs) that gets an ad inside its body. */
export const MIN_PARAGRAPHS_FOR_IN_ARTICLE_AD = 6;

/**
 * Splits rendered article HTML into two parts at the end of the paragraph
 * closest to one third of the article, so an in-article ad can sit between
 * them (Story 56). The rich-text renderer outputs flat top-level blocks,
 * so a `</p>` always closes a top-level paragraph. Articles shorter than
 * `MIN_PARAGRAPHS_FOR_IN_ARTICLE_AD` paragraphs are not split.
 */
export const splitArticleHtml = (html: string): [string, string] | null => {
  const ends: number[] = [];
  const pattern = /<\/p>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    ends.push(match.index + match[0].length);
  }
  if (ends.length < MIN_PARAGRAPHS_FOR_IN_ARTICLE_AD) return null;
  const cut = ends[Math.round(ends.length / 3) - 1];
  if (cut === undefined) return null;
  return [html.slice(0, cut), html.slice(cut)];
};
