import { Table, TableForeignKey } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTrackingEventsAndFunnelsTables1788250000000 implements MigrationInterface {
  name = 'CreateTrackingEventsAndFunnelsTables1788250000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tracking_events',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'sessionId', type: 'varchar', length: '36' },
          { name: 'name', type: 'varchar' },
          { name: 'payload', type: 'json', isNullable: true },
          { name: 'path', type: 'varchar', isNullable: true },
          { name: 'occurredAt', type: 'datetime', precision: 6 },
        ],
      }),
    );
    await queryRunner.createForeignKey(
      'tracking_events',
      new TableForeignKey({
        columnNames: ['sessionId'],
        referencedTableName: 'tracking_sessions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'tracking_funnels',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'name', type: 'varchar' },
          { name: 'steps', type: 'json' },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tracking_funnels');
    await queryRunner.dropTable('tracking_events');
  }
}
