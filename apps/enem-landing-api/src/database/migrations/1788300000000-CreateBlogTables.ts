import { Table, TableForeignKey } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBlogTables1788300000000 implements MigrationInterface {
  name = 'CreateBlogTables1788300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'blog_categories',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'name', type: 'varchar' },
          { name: 'slug', type: 'varchar', isUnique: true },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'blog_tags',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'name', type: 'varchar' },
          { name: 'slug', type: 'varchar', isUnique: true },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'blog_posts',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'title', type: 'varchar' },
          { name: 'slug', type: 'varchar', isUnique: true },
          { name: 'excerpt', type: 'text', isNullable: true },
          { name: 'contentDelta', type: 'json' },
          {
            name: 'coverImageUrl',
            type: 'varchar',
            length: '2048',
            isNullable: true,
          },
          { name: 'status', type: 'varchar', length: '16', default: "'draft'" },
          {
            name: 'publishedAt',
            type: 'datetime',
            precision: 6,
            isNullable: true,
          },
          { name: 'metaTitle', type: 'varchar', default: "''" },
          { name: 'metaDescription', type: 'text' },
          { name: 'ogImageUrl', type: 'varchar', default: "''" },
          {
            name: 'createdAt',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
            onUpdate: 'CURRENT_TIMESTAMP(6)',
          },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'blog_post_categories',
        columns: [
          { name: 'postId', type: 'varchar', length: '36', isPrimary: true },
          {
            name: 'categoryId',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
        ],
      }),
    );
    await queryRunner.createForeignKey(
      'blog_post_categories',
      new TableForeignKey({
        columnNames: ['postId'],
        referencedTableName: 'blog_posts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'blog_post_categories',
      new TableForeignKey({
        columnNames: ['categoryId'],
        referencedTableName: 'blog_categories',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'blog_post_tags',
        columns: [
          { name: 'postId', type: 'varchar', length: '36', isPrimary: true },
          { name: 'tagId', type: 'varchar', length: '36', isPrimary: true },
        ],
      }),
    );
    await queryRunner.createForeignKey(
      'blog_post_tags',
      new TableForeignKey({
        columnNames: ['postId'],
        referencedTableName: 'blog_posts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'blog_post_tags',
      new TableForeignKey({
        columnNames: ['tagId'],
        referencedTableName: 'blog_tags',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('blog_post_tags');
    await queryRunner.dropTable('blog_post_categories');
    await queryRunner.dropTable('blog_posts');
    await queryRunner.dropTable('blog_tags');
    await queryRunner.dropTable('blog_categories');
  }
}
