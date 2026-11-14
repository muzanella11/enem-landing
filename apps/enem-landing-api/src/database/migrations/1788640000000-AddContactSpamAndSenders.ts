import { Table, TableColumn, TableForeignKey, TableIndex } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Contact form anti-spam: a spam flag on each submission, plus a separate
 * sender table (network, browser and form-behaviour details) that the
 * retention job empties after 90 days.
 */
export class AddContactSpamAndSenders1788640000000 implements MigrationInterface {
  name = 'AddContactSpamAndSenders1788640000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('contact_submissions', [
      new TableColumn({
        name: 'isSpam',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
      new TableColumn({
        name: 'spamReason',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    ]);

    const nullableVarchar = (name: string, length: number) => ({
      name,
      type: 'varchar',
      length: String(length),
      isNullable: true,
    });
    const nullableBoolean = (name: string) => ({
      name,
      type: 'boolean',
      isNullable: true,
    });
    const nullableInt = (name: string) => ({
      name,
      type: 'int',
      isNullable: true,
    });

    await queryRunner.createTable(
      new Table({
        name: 'contact_submission_senders',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          {
            name: 'submissionId',
            type: 'varchar',
            length: '36',
            isUnique: true,
          },
          nullableVarchar('ipAddress', 45),
          nullableVarchar('countryCode', 2),
          nullableVarchar('country', 100),
          nullableVarchar('region', 100),
          nullableVarchar('city', 100),
          nullableVarchar('cfRay', 64),
          nullableVarchar('asn', 150),
          nullableVarchar('isp', 150),
          nullableVarchar('org', 150),
          nullableBoolean('isProxy'),
          nullableBoolean('isHosting'),
          nullableBoolean('isTor'),
          nullableVarchar('userAgent', 512),
          nullableVarchar('acceptLanguage', 255),
          nullableVarchar('referer', 512),
          nullableVarchar('timezone', 64),
          nullableBoolean('timezoneMismatch'),
          nullableVarchar('language', 35),
          nullableInt('screenWidth'),
          nullableInt('screenHeight'),
          nullableInt('fillDurationMs'),
          nullableInt('keystrokeCount'),
          { name: 'pastedFields', type: 'text', isNullable: true },
          nullableBoolean('hadPointerMovement'),
          nullableVarchar('visitorId', 64),
          nullableVarchar('sessionId', 64),
          nullableBoolean('hasTrackedVisit'),
          nullableBoolean('emailHasMx'),
          nullableBoolean('isDisposableEmail'),
          nullableVarchar('phoneCountry', 2),
          nullableBoolean('phoneValid'),
          {
            name: 'createdAt',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'contact_submission_senders',
      new TableForeignKey({
        columnNames: ['submissionId'],
        referencedTableName: 'contact_submissions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndices('contact_submission_senders', [
      new TableIndex({ columnNames: ['ipAddress'] }),
      new TableIndex({ columnNames: ['visitorId'] }),
      new TableIndex({ columnNames: ['createdAt'] }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('contact_submission_senders', true, true, true);
    await queryRunner.dropColumns('contact_submissions', [
      'isSpam',
      'spamReason',
    ]);
  }
}
