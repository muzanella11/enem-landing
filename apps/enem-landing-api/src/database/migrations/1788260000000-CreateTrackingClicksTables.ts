import { Table, TableIndex } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTrackingClicksTables1788260000000 implements MigrationInterface {
  name = 'CreateTrackingClicksTables1788260000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tracking_clicks',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'path', type: 'varchar' },
          { name: 'xPct', type: 'double' },
          { name: 'yPct', type: 'double' },
          { name: 'deviceBucket', type: 'varchar' },
          { name: 'occurredAt', type: 'datetime', precision: 6 },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'tracking_click_aggregates',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'path', type: 'varchar' },
          { name: 'deviceBucket', type: 'varchar' },
          { name: 'gridX', type: 'int' },
          { name: 'gridY', type: 'int' },
          { name: 'count', type: 'int', default: 0 },
        ],
      }),
    );
    await queryRunner.createIndex(
      'tracking_click_aggregates',
      new TableIndex({
        name: 'IDX_tracking_click_aggregates_natural_key',
        columnNames: ['path', 'deviceBucket', 'gridX', 'gridY'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tracking_click_aggregates');
    await queryRunner.dropTable('tracking_clicks');
  }
}
