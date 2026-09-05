import { Table, TableColumn, TableForeignKey } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTrackingRecordingChunksTable1788270000000 implements MigrationInterface {
  name = 'CreateTrackingRecordingChunksTable1788270000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tracking_recording_chunks',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'sessionId', type: 'varchar', length: '36' },
          { name: 'sequence', type: 'int' },
          { name: 'uploadId', type: 'varchar' },
          { name: 'url', type: 'varchar' },
          { name: 'sizeBytes', type: 'int' },
          { name: 'occurredAt', type: 'datetime', precision: 6 },
        ],
      }),
    );
    await queryRunner.createForeignKey(
      'tracking_recording_chunks',
      new TableForeignKey({
        columnNames: ['sessionId'],
        referencedTableName: 'tracking_sessions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.addColumn(
      'tracking_sessions',
      new TableColumn({
        name: 'recordingSampled',
        type: 'boolean',
        default: false,
      }),
    );

    await queryRunner.addColumn(
      'tracking_settings',
      new TableColumn({
        name: 'sessionRecordingSampleRatePct',
        type: 'int',
        default: 10,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(
      'tracking_settings',
      'sessionRecordingSampleRatePct',
    );
    await queryRunner.dropColumn('tracking_sessions', 'recordingSampled');
    await queryRunner.dropTable('tracking_recording_chunks');
  }
}
