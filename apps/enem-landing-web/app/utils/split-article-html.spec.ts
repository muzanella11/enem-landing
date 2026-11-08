import { describe, expect, it } from 'vitest';
import {
  MIN_PARAGRAPHS_FOR_IN_ARTICLE_AD,
  splitArticleHtml,
} from './split-article-html';

const paragraphs = (count: number) =>
  Array.from({ length: count }, (_, i) => `<p>Paragraph ${i + 1}</p>`).join('');

describe('splitArticleHtml (Story 56)', () => {
  it('leaves short articles whole', () => {
    expect(
      splitArticleHtml(paragraphs(MIN_PARAGRAPHS_FOR_IN_ARTICLE_AD - 1)),
    ).toBeNull();
    expect(splitArticleHtml('')).toBeNull();
  });

  it('cuts after the paragraph closest to one third', () => {
    const html = `<h2>Intro</h2>${paragraphs(9)}<ul><li>x</li></ul>`;
    const parts = splitArticleHtml(html);
    expect(parts).not.toBeNull();
    const [first, rest] = parts!;
    expect(first.endsWith('<p>Paragraph 3</p>')).toBe(true);
    expect(rest.startsWith('<p>Paragraph 4</p>')).toBe(true);
    expect(first + rest).toBe(html);
  });

  it('never cuts inside a tag', () => {
    const html = paragraphs(6).replace(
      '<p>Paragraph 2</p>',
      '<p>See <a href="https://tools.muzanella.com/x">tool</a></p>',
    );
    const [first, rest] = splitArticleHtml(html)!;
    expect(first.endsWith('</p>')).toBe(true);
    expect(rest.startsWith('<p>')).toBe(true);
  });
});
