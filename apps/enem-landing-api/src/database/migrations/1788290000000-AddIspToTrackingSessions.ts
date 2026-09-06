import { TableColumn } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIspToTrackingSessions1788290000000
  implements MigrationInterface
{
  name = 'AddIspToTrackingSessions1788290000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('tracking_sessions', [
      new TableColumn({ name: 'isp', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'org', type: 'varchar', isNullable: true }),
      new TableColumn({ name: 'asn', type: 'varchar', isNullable: true }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('tracking_sessions', ['isp', 'org', 'asn']);
  }
}
