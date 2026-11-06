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

/** Story 35. */
const STORY_35_TOOLS: ToolSeed[] = [
  {
    slug: 'kalkulator-ipk',
    name: 'Kalkulator IPK',
    shortDescription:
      'IPS dan IPK dengan skala nilai kampus, plus simulasi target IPK.',
    category: 'pendidikan',
  },
  {
    slug: 'simulasi-nilai-skd',
    name: 'Simulasi Nilai SKD CPNS',
    shortDescription:
      'Cek skor TWK, TIU, TKP terhadap ambang batas per formasi.',
    category: 'pendidikan',
  },
];

export class SeedToolsAkademik1788480000000 implements MigrationInterface {
  name = 'SeedToolsAkademik1788480000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await insertTools(queryRunner, STORY_35_TOOLS);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await deleteTools(
      queryRunner,
      STORY_35_TOOLS.map((tool) => tool.slug),
    );
  }
}
