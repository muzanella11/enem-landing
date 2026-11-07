import { Table } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Story 38: daily spot gold price history. */
export class CreateGoldPrices1788380000000 implements MigrationInterface {
  name = 'CreateGoldPrices1788380000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tools_gold_prices',
        columns: [
          { name: 'tanggal', type: 'varchar', length: '10', isPrimary: true },
          { name: 'pricePerGram', type: 'int' },
          { name: 'sourceUpdatedAt', type: 'datetime', precision: 6 },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tools_gold_prices');
  }
}
