/**
 * List endpoints only need card fields; each post's full Quill Delta was
 * ~85% of the list payload that ends up in every listing page's HTML.
 */
export const stripPostContent = <T extends { contentDelta?: unknown }>(
  post: T,
): Omit<T, 'contentDelta'> => {
  const rest: Partial<T> = { ...post };
  delete rest.contentDelta;
  return rest as Omit<T, 'contentDelta'>;
};
