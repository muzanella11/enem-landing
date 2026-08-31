import { Table, TableForeignKey } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBusinessDomainTables1788217200000 implements MigrationInterface {
  name = 'CreateBusinessDomainTables1788217200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'experiences',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'company', type: 'varchar' },
          { name: 'position', type: 'varchar' },
          { name: 'location', type: 'varchar' },
          { name: 'description', type: 'text' },
          { name: 'roleSummary', type: 'text' },
          { name: 'workingPeriode', type: 'varchar' },
          { name: 'experienceGained', type: 'json' },
          { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'projects',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'experienceId', type: 'varchar', length: '36' },
          { name: 'title', type: 'varchar' },
          { name: 'image', type: 'json' },
          { name: 'url', type: 'varchar', default: "''" },
          { name: 'year', type: 'varchar' },
          { name: 'description', type: 'text' },
          { name: 'technologies', type: 'json' },
          { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );
    await queryRunner.createForeignKey(
      'projects',
      new TableForeignKey({
        columnNames: ['experienceId'],
        referencedTableName: 'experiences',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'contact_submissions',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'fullname', type: 'varchar' },
          { name: 'email', type: 'varchar' },
          { name: 'phoneNumber', type: 'varchar' },
          { name: 'message', type: 'text' },
          { name: 'readAt', type: 'datetime', isNullable: true },
          { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'site_profile',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'heroTitle', type: 'varchar', default: "''" },
          { name: 'heroSubtitle', type: 'varchar', default: "''" },
          { name: 'bio', type: 'text' },
          { name: 'avatarUrl', type: 'varchar', default: "''" },
          { name: 'socialLinks', type: 'json' },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'seo_meta',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'pageKey', type: 'varchar', isUnique: true },
          { name: 'title', type: 'varchar' },
          { name: 'description', type: 'text' },
          { name: 'ogImageUrl', type: 'varchar', default: "''" },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'skills',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'name', type: 'varchar' },
          { name: 'category', type: 'varchar' },
          { name: 'level', type: 'varchar', isNullable: true },
          { name: 'icon', type: 'varchar', isNullable: true },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('skills');
    await queryRunner.dropTable('seo_meta');
    await queryRunner.dropTable('site_profile');
    await queryRunner.dropTable('contact_submissions');
    await queryRunner.dropTable('projects');
    await queryRunner.dropTable('experiences');
  }
}
