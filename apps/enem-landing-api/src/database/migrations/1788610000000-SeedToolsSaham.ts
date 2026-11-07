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

/** Story 54. */
const STORY_54_TOOLS: ToolSeed[] = [
  {
    slug: 'kalkulator-saham',
    name: 'Kalkulator Saham',
    shortDescription:
      'Lot, fee, pajak jual 0,1%, untung rugi, dan harga impas.',
    category: 'keuangan',
  },
  {
    slug: 'kalkulator-average-saham',
    name: 'Kalkulator Average Down Saham',
    shortDescription: 'Harga rata-rata dan lot untuk target average down/up.',
    category: 'keuangan',
  },
  {
    slug: 'kalkulator-dividen',
    name: 'Kalkulator Dividen',
    shortDescription: 'Dividen bersih setelah pajak dan dividend yield.',
    category: 'keuangan',
  },
  {
    slug: 'simulasi-reksa-dana',
    name: 'Simulasi Reksa Dana',
    shortDescription: 'Unit dari NAB, biaya, dan simulasi investasi rutin.',
    category: 'keuangan',
  },
];

export class SeedToolsSaham1788610000000 implements MigrationInterface {
  name = 'SeedToolsSaham1788610000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await insertTools(queryRunner, STORY_54_TOOLS);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await deleteTools(
      queryRunner,
      STORY_54_TOOLS.map((tool) => tool.slug),
    );
  }
}
