import { randomUUID } from 'node:crypto';
import type { MigrationInterface, QueryRunner } from 'typeorm';

// Kept inside the migration (not imported): the TypeORM CLI loads migration
// sources directly, so relative imports of other .ts files don't resolve.
interface ToolSeed {
  slug: string;
  name: string;
  shortDescription: string;
  category: 'keuangan' | 'dokumen' | 'ibadah' | 'kesehatan' | 'pendidikan';
  /** Defaults to true; false for topics where ads start switched off. */
  adsEnabled?: boolean;
}

/**
 * Adds tools to the registry (Story 25) for migrations that ship new
 * tools. Appended after the current last tool, badged "baru", and skipped
 * when the slug already exists so re-runs are harmless.
 */
const insertTools = async (
  queryRunner: QueryRunner,
  tools: ToolSeed[],
): Promise<void> => {
  const [{ maxOrder }] = (await queryRunner.query(
    'SELECT COALESCE(MAX(sortOrder), -1) AS maxOrder FROM tools',
  )) as { maxOrder: number }[];
  let order = Number(maxOrder) + 1;
  for (const tool of tools) {
    await queryRunner.query(
      `INSERT IGNORE INTO tools (id, slug, name, shortDescription, category, sortOrder, enabled, badge, adsEnabled)
       VALUES (?, ?, ?, ?, ?, ?, 1, 'baru', ?)`,
      [
        randomUUID(),
        tool.slug,
        tool.name,
        tool.shortDescription,
        tool.category,
        order,
        tool.adsEnabled === false ? 0 : 1,
      ],
    );
    order += 1;
  }
};

const deleteTools = async (
  queryRunner: QueryRunner,
  slugs: string[],
): Promise<void> => {
  if (slugs.length === 0) return;
  await queryRunner.query(
    `DELETE FROM tools WHERE slug IN (${slugs.map(() => '?').join(', ')})`,
    slugs,
  );
};

/** Story 45. */
const STORY_45_TOOLS: ToolSeed[] = [
  {
    slug: 'kalkulator-waris',
    name: 'Kalkulator Waris Islam',
    shortDescription:
      'Pembagian waris faraid dengan alasan bagian tiap ahli waris.',
    category: 'ibadah',
    adsEnabled: false,
  },
  {
    slug: 'kalkulator-fidyah',
    name: 'Kalkulator Fidyah',
    shortDescription: 'Fidyah puasa dalam uang atau beras sesuai nilai BAZNAS.',
    category: 'ibadah',
    adsEnabled: false,
  },
  {
    slug: 'kalkulator-kafarat',
    name: 'Kalkulator Kafarat',
    shortDescription: 'Kafarat sumpah, zihar, dan batal puasa Ramadan.',
    category: 'ibadah',
    adsEnabled: false,
  },
];

export class SeedToolsWarisFidyah1788530000000 implements MigrationInterface {
  name = 'SeedToolsWarisFidyah1788530000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await insertTools(queryRunner, STORY_45_TOOLS);
    // Faraid must be reviewed by a qualified person before going live
    // (Story 45); enable it from the CMS after the review.
    await queryRunner.query(
      "UPDATE tools SET enabled = 0 WHERE slug = 'kalkulator-waris'",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await deleteTools(
      queryRunner,
      STORY_45_TOOLS.map((tool) => tool.slug),
    );
  }
}
