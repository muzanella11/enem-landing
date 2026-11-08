import { TableColumn } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Story 56: ads in muzanella.com blog articles, managed next to the tools
 * AdSense settings (same publisher id, same global switch).
 */
export class AddBlogAdsToToolsSettings1788630000000 implements MigrationInterface {
  name = 'AddBlogAdsToToolsSettings1788630000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('tools_settings', [
      new TableColumn({
        name: 'blogAdsEnabled',
        type: 'tinyint',
        default: 0,
        isNullable: false,
      }),
      new TableColumn({
        name: 'adsenseSlotArticle',
        type: 'varchar',
        length: '32',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('tools_settings', [
      'blogAdsEnabled',
      'adsenseSlotArticle',
    ]);
  }
}
