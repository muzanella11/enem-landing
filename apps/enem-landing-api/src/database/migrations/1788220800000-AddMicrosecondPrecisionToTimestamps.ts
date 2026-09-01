import { TableColumn } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * MySQL's default `datetime` has only 1-second resolution, which made
 * bulk-created rows (e.g. importing many experiences at once) sort
 * unpredictably by `findAll()`'s `order: { createdAt: 'ASC' }` whenever
 * several rows land within the same second. `datetime(6)` gives
 * microsecond precision instead.
 */
export class AddMicrosecondPrecisionToTimestamps1788220800000 implements MigrationInterface {
  name = 'AddMicrosecondPrecisionToTimestamps1788220800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'experiences',
      'createdAt',
      new TableColumn({
        name: 'createdAt',
        type: 'datetime',
        precision: 6,
        default: 'CURRENT_TIMESTAMP(6)',
      }),
    );
    await queryRunner.changeColumn(
      'experiences',
      'updatedAt',
      new TableColumn({
        name: 'updatedAt',
        type: 'datetime',
        precision: 6,
        default: 'CURRENT_TIMESTAMP(6)',
        onUpdate: 'CURRENT_TIMESTAMP(6)',
      }),
    );

    await queryRunner.changeColumn(
      'projects',
      'createdAt',
      new TableColumn({
        name: 'createdAt',
        type: 'datetime',
        precision: 6,
        default: 'CURRENT_TIMESTAMP(6)',
      }),
    );
    await queryRunner.changeColumn(
      'projects',
      'updatedAt',
      new TableColumn({
        name: 'updatedAt',
        type: 'datetime',
        precision: 6,
        default: 'CURRENT_TIMESTAMP(6)',
        onUpdate: 'CURRENT_TIMESTAMP(6)',
      }),
    );

    await queryRunner.changeColumn(
      'contact_submissions',
      'createdAt',
      new TableColumn({
        name: 'createdAt',
        type: 'datetime',
        precision: 6,
        default: 'CURRENT_TIMESTAMP(6)',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'contact_submissions',
      'createdAt',
      new TableColumn({
        name: 'createdAt',
        type: 'datetime',
        default: 'CURRENT_TIMESTAMP',
      }),
    );

    await queryRunner.changeColumn(
      'projects',
      'updatedAt',
      new TableColumn({
        name: 'updatedAt',
        type: 'datetime',
        default: 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
      }),
    );
    await queryRunner.changeColumn(
      'projects',
      'createdAt',
      new TableColumn({
        name: 'createdAt',
        type: 'datetime',
        default: 'CURRENT_TIMESTAMP',
      }),
    );

    await queryRunner.changeColumn(
      'experiences',
      'updatedAt',
      new TableColumn({
        name: 'updatedAt',
        type: 'datetime',
        default: 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
      }),
    );
    await queryRunner.changeColumn(
      'experiences',
      'createdAt',
      new TableColumn({
        name: 'createdAt',
        type: 'datetime',
        default: 'CURRENT_TIMESTAMP',
      }),
    );
  }
}
