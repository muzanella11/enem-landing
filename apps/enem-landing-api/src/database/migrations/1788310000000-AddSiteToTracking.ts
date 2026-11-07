import { TableColumn, TableIndex } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Story 25: tag tracking rows with the site they came from so the CMS can
 * report on enem-landing-web (`landing`) and enem-landing-tools (`tools`)
 * separately. Every existing row is backfilled as `landing` by the column
 * default. Pageviews, events, and recording chunks inherit their site from
 * their session, so they don't get a column of their own.
 */
const SITE_TABLES = [
  'tracking_sessions',
  'tracking_clicks',
  'tracking_click_aggregates',
  'tracking_funnels',
  'tracking_settings',
] as const;

const siteColumn = () =>
  new TableColumn({
    name: 'site',
    type: 'varchar',
    length: '32',
    default: "'landing'",
  });

export class AddSiteToTracking1788310000000 implements MigrationInterface {
  name = 'AddSiteToTracking1788310000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of SITE_TABLES) {
      await queryRunner.addColumn(table, siteColumn());
    }

    await queryRunner.createIndex(
      'tracking_sessions',
      new TableIndex({
        name: 'IDX_tracking_sessions_site_startedAt',
        columnNames: ['site', 'startedAt'],
      }),
    );
    await queryRunner.createIndex(
      'tracking_clicks',
      new TableIndex({
        name: 'IDX_tracking_clicks_site',
        columnNames: ['site'],
      }),
    );
    await queryRunner.createIndex(
      'tracking_funnels',
      new TableIndex({
        name: 'IDX_tracking_funnels_site',
        columnNames: ['site'],
      }),
    );

    // The heatmap's natural key must include the site, otherwise clicks on
    // `/` of both sites would be merged into the same grid cells.
    await queryRunner.dropIndex(
      'tracking_click_aggregates',
      'IDX_tracking_click_aggregates_natural_key',
    );
    await queryRunner.createIndex(
      'tracking_click_aggregates',
      new TableIndex({
        name: 'IDX_tracking_click_aggregates_natural_key',
        columnNames: ['site', 'path', 'deviceBucket', 'gridX', 'gridY'],
        isUnique: true,
      }),
    );

    // tracking_settings goes from single-row to one row per site.
    await queryRunner.createIndex(
      'tracking_settings',
      new TableIndex({
        name: 'IDX_tracking_settings_site',
        columnNames: ['site'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rows from non-landing sites have no meaning in the single-site
    // schema; drop them so the old unique keys can be restored.
    await queryRunner.query(
      `DELETE FROM tracking_click_aggregates WHERE site <> 'landing'`,
    );
    await queryRunner.query(
      `DELETE FROM tracking_settings WHERE site <> 'landing'`,
    );

    await queryRunner.dropIndex(
      'tracking_settings',
      'IDX_tracking_settings_site',
    );
    await queryRunner.dropIndex(
      'tracking_click_aggregates',
      'IDX_tracking_click_aggregates_natural_key',
    );
    await queryRunner.createIndex(
      'tracking_click_aggregates',
      new TableIndex({
        name: 'IDX_tracking_click_aggregates_natural_key',
        columnNames: ['path', 'deviceBucket', 'gridX', 'gridY'],
        isUnique: true,
      }),
    );
    await queryRunner.dropIndex(
      'tracking_funnels',
      'IDX_tracking_funnels_site',
    );
    await queryRunner.dropIndex('tracking_clicks', 'IDX_tracking_clicks_site');
    await queryRunner.dropIndex(
      'tracking_sessions',
      'IDX_tracking_sessions_site_startedAt',
    );

    for (const table of SITE_TABLES) {
      await queryRunner.dropColumn(table, 'site');
    }
  }
}
