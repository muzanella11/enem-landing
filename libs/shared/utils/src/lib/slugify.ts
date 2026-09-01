/** Generates a `SeoMeta.pageKey`-safe slug, e.g. "Contact Us" -> "contact-us". */
export const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
