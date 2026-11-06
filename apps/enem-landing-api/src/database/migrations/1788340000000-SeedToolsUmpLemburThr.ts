import { randomUUID } from 'node:crypto';
import type { MigrationInterface, QueryRunner } from 'typeorm';

// Kept inside the migration (not imported): the TypeORM CLI loads migration
// sources directly, so relative imports of other .ts files don't resolve.
interface ToolSeed {
  slug: string;
  name: string;
  shortDescription: string;
  category: 'keuangan' | 'dokumen' | 'ibadah';
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

/** Story 26: upah minimum, kalkulator lembur, kalkulator THR. */
const STORY_26_TOOLS: ToolSeed[] = [
  {
    slug: 'upah-minimum',
    name: 'UMP 2026 dan 2027',
    shortDescription:
      'Daftar upah minimum provinsi 2026 dan 2027 di 38 provinsi, lengkap dengan kenaikannya.',
    category: 'keuangan',
  },
  {
    slug: 'kalkulator-lembur',
    name: 'Kalkulator Lembur',
    shortDescription:
      'Hitung upah lembur hari kerja dan hari libur sesuai PP 35/2021.',
    category: 'keuangan',
  },
  {
    slug: 'kalkulator-thr',
    name: 'Kalkulator THR',
    shortDescription:
      'THR penuh atau proporsional, estimasi pajaknya, dan batas tanggal bayar.',
    category: 'keuangan',
  },
];

export class SeedToolsUmpLemburThr1788340000000 implements MigrationInterface {
  name = 'SeedToolsUmpLemburThr1788340000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await insertTools(queryRunner, STORY_26_TOOLS);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await deleteTools(
      queryRunner,
      STORY_26_TOOLS.map((tool) => tool.slug),
    );
  }
}
