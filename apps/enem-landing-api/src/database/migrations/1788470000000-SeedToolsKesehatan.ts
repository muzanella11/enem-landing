import { randomUUID } from 'node:crypto';
import type { MigrationInterface, QueryRunner } from 'typeorm';

// Kept inside the migration (not imported): the TypeORM CLI loads migration
// sources directly, so relative imports of other .ts files don't resolve.
interface ToolSeed {
  slug: string;
  name: string;
  shortDescription: string;
  category: 'keuangan' | 'dokumen' | 'ibadah' | 'kesehatan';
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

/** Story 34. */
const STORY_34_TOOLS: ToolSeed[] = [
  {
    slug: 'hitung-hpl',
    name: 'Hitung HPL Kehamilan',
    shortDescription:
      'Hari perkiraan lahir, usia kehamilan, dan trimester dari HPHT.',
    category: 'kesehatan',
    adsEnabled: false,
  },
  {
    slug: 'kalkulator-masa-subur',
    name: 'Kalkulator Masa Subur',
    shortDescription: 'Perkiraan ovulasi dan masa subur tiga siklus ke depan.',
    category: 'kesehatan',
    adsEnabled: false,
  },
  {
    slug: 'kalkulator-bmi',
    name: 'Kalkulator BMI',
    shortDescription:
      'Indeks massa tubuh dengan kategori Kemenkes dan WHO Asia.',
    category: 'kesehatan',
    adsEnabled: false,
  },
  {
    slug: 'kalkulator-kalori',
    name: 'Kalkulator Kalori',
    shortDescription:
      'Kebutuhan kalori harian (BMR, TDEE) dan target berat aman.',
    category: 'kesehatan',
    adsEnabled: false,
  },
];

export class SeedToolsKesehatan1788470000000 implements MigrationInterface {
  name = 'SeedToolsKesehatan1788470000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await insertTools(queryRunner, STORY_34_TOOLS);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await deleteTools(
      queryRunner,
      STORY_34_TOOLS.map((tool) => tool.slug),
    );
  }
}
