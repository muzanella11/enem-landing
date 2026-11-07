import type { Repository } from 'typeorm';

export interface PublishedTaxonomyRow {
  id: string;
  name: string;
  slug: string;
  postCount: number;
}

/**
 * Categories or tags that at least one published post uses, with how many
 * published posts use each. The public blog filter shows only these, so a
 * visitor never picks a category/tag that leads to an empty list (tags of
 * draft posts, or tags left over after a post was edited).
 */
export async function findPublishedTaxonomy(
  repository: Repository<{ id: string; name: string; slug: string }>,
  joinTable: 'blog_post_categories' | 'blog_post_tags',
  joinColumn: 'categoryId' | 'tagId',
): Promise<PublishedTaxonomyRow[]> {
  const rows = await repository
    .createQueryBuilder('taxonomy')
    .innerJoin(joinTable, 'link', `link.${joinColumn} = taxonomy.id`)
    .innerJoin(
      'blog_posts',
      'post',
      'post.id = link.postId AND post.status = :status',
      { status: 'published' },
    )
    .select('taxonomy.id', 'id')
    .addSelect('taxonomy.name', 'name')
    .addSelect('taxonomy.slug', 'slug')
    .addSelect('COUNT(DISTINCT post.id)', 'postCount')
    .groupBy('taxonomy.id')
    .addGroupBy('taxonomy.name')
    .addGroupBy('taxonomy.slug')
    .orderBy('taxonomy.name', 'ASC')
    .getRawMany<{ id: string; name: string; slug: string; postCount: string }>();

  return rows.map((row) => ({ ...row, postCount: Number(row.postCount) }));
}
