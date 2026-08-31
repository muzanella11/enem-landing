import { Table, TableIndex } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUploadsAndSystemSettingsTables1788199200000
  implements MigrationInterface
{
  name = 'CreateUploadsAndSystemSettingsTables1788199200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'files',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'app', type: 'varchar', length: '64' },
          { name: 'purpose', type: 'varchar', length: '64' },
          { name: 'uploaderId', type: 'varchar', length: '36', isNullable: true },
          { name: 'mime', type: 'varchar', length: '128' },
          { name: 'size', type: 'int' },
          { name: 'key', type: 'varchar', length: '512' },
          { name: 'url', type: 'varchar', length: '1024' },
          { name: 'createdAt', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
    );
    await queryRunner.createIndex(
      'files',
      new TableIndex({ name: 'file_app_purpose_idx', columnNames: ['app', 'purpose'] }),
    );
    await queryRunner.createIndex(
      'files',
      new TableIndex({ name: 'file_uploader_id_idx', columnNames: ['uploaderId'] }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'system_settings',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'key', type: 'varchar', isUnique: true },
          { name: 'value', type: 'text', isNullable: true },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('system_settings');
    await queryRunner.dropIndex('files', 'file_uploader_id_idx');
    await queryRunner.dropIndex('files', 'file_app_purpose_idx');
    await queryRunner.dropTable('files');
  }
}
