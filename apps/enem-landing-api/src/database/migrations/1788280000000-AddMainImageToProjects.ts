import { TableColumn } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Lets the CMS pick which of a project's images represents it in the
 * portfolio list, instead of always assuming `image[0]` - nullable since
 * existing projects (and any without an explicit choice) keep falling back
 * to `image[0]` at read time.
 */
export class AddMainImageToProjects1788280000000 implements MigrationInterface {
  name = 'AddMainImageToProjects1788280000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'projects',
      new TableColumn({
        name: 'mainImage',
        type: 'varchar',
        length: '2048',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('projects', 'mainImage');
  }
}
