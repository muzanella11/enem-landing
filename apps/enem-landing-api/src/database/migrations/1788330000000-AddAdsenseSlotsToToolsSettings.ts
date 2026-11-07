import { TableColumn } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Story 27: AdSense ad unit ids move from env vars to the CMS, so the whole
 * AdSense setup can be done without a deploy.
 */
export class AddAdsenseSlotsToToolsSettings1788330000000 implements MigrationInterface {
  name = 'AddAdsenseSlotsToToolsSettings1788330000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('tools_settings', [
      new TableColumn({
        name: 'adsenseSlotResult',
        type: 'varchar',
        length: '32',
        isNullable: true,
      }),
      new TableColumn({
        name: 'adsenseSlotSidebar',
        type: 'varchar',
        length: '32',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('tools_settings', [
      'adsenseSlotResult',
      'adsenseSlotSidebar',
    ]);
  }
}
