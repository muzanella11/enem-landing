import { TableColumn } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Per-article switch to keep a published post out of search results
 * (`noindex` robots meta, left out of sitemap.xml) while it stays readable.
 */
export class AddNoindexToBlogPosts1788650000000 implements MigrationInterface {
  name = 'AddNoindexToBlogPosts1788650000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'blog_posts',
      new TableColumn({
        name: 'noindex',
        type: 'tinyint',
        default: 0,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('blog_posts', 'noindex');
  }
}
