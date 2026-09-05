import { Table, TableForeignKey } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTrackingTables1788240000000 implements MigrationInterface {
  name = 'CreateTrackingTables1788240000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tracking_settings',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'pageviewEnabled', type: 'boolean', default: false },
          { name: 'eventsEnabled', type: 'boolean', default: false },
          { name: 'heatmapEnabled', type: 'boolean', default: false },
          {
            name: 'sessionRecordingEnabled',
            type: 'boolean',
            default: false,
          },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'tracking_sessions',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'visitorId', type: 'varchar' },
          { name: 'startedAt', type: 'datetime', precision: 6 },
          {
            name: 'endedAt',
            type: 'datetime',
            precision: 6,
            isNullable: true,
          },
          { name: 'referrer', type: 'varchar', isNullable: true },
          { name: 'utmSource', type: 'varchar', isNullable: true },
          { name: 'utmMedium', type: 'varchar', isNullable: true },
          { name: 'utmCampaign', type: 'varchar', isNullable: true },
          { name: 'deviceType', type: 'varchar', isNullable: true },
          { name: 'deviceVendor', type: 'varchar', isNullable: true },
          { name: 'deviceModel', type: 'varchar', isNullable: true },
          { name: 'browserName', type: 'varchar', isNullable: true },
          { name: 'browserVersion', type: 'varchar', isNullable: true },
          { name: 'engineName', type: 'varchar', isNullable: true },
          { name: 'engineVersion', type: 'varchar', isNullable: true },
          { name: 'osName', type: 'varchar', isNullable: true },
          { name: 'osVersion', type: 'varchar', isNullable: true },
          { name: 'cpuArchitecture', type: 'varchar', isNullable: true },
          { name: 'language', type: 'varchar', isNullable: true },
          { name: 'timezone', type: 'varchar', isNullable: true },
          { name: 'screenWidth', type: 'int', isNullable: true },
          { name: 'screenHeight', type: 'int', isNullable: true },
          { name: 'ipAddress', type: 'varchar', isNullable: true },
          { name: 'country', type: 'varchar', isNullable: true },
          { name: 'region', type: 'varchar', isNullable: true },
          { name: 'city', type: 'varchar', isNullable: true },
          { name: 'latitude', type: 'double', isNullable: true },
          { name: 'longitude', type: 'double', isNullable: true },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'tracking_pageviews',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'sessionId', type: 'varchar', length: '36' },
          { name: 'path', type: 'varchar' },
          { name: 'enteredAt', type: 'datetime', precision: 6 },
          { name: 'durationMs', type: 'int', isNullable: true },
        ],
      }),
    );
    await queryRunner.createForeignKey(
      'tracking_pageviews',
      new TableForeignKey({
        columnNames: ['sessionId'],
        referencedTableName: 'tracking_sessions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tracking_pageviews');
    await queryRunner.dropTable('tracking_sessions');
    await queryRunner.dropTable('tracking_settings');
  }
}
