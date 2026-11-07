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

/** Story 41. */
const STORY_41_TOOLS: ToolSeed[] = [
  {
    slug: 'kalkulator-deposito',
    name: 'Kalkulator Deposito',
    shortDescription: 'Bunga deposito bersih setelah pajak 20%, tenor dan ARO.',
    category: 'keuangan',
  },
  {
    slug: 'kalkulator-tabungan',
    name: 'Kalkulator Target Tabungan',
    shortDescription: 'Setoran bulanan untuk mencapai target dana tepat waktu.',
    category: 'keuangan',
  },
  {
    slug: 'kalkulator-investasi',
    name: 'Kalkulator Investasi Rutin',
    shortDescription:
      'Investasi bulanan dengan bunga majemuk, grafik, dan nilai riil.',
    category: 'keuangan',
  },
  {
    slug: 'kalkulator-dana-darurat',
    name: 'Kalkulator Dana Darurat',
    shortDescription:
      'Dana darurat ideal sesuai status keluarga dan penghasilan.',
    category: 'keuangan',
  },
  {
    slug: 'kalkulator-dana-pensiun',
    name: 'Kalkulator Dana Pensiun',
    shortDescription:
      'Dana pensiun yang dibutuhkan dengan inflasi dan setoran bulanan.',
    category: 'keuangan',
  },
];

export class SeedToolsKeuanganPribadi1788490000000 implements MigrationInterface {
  name = 'SeedToolsKeuanganPribadi1788490000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await insertTools(queryRunner, STORY_41_TOOLS);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await deleteTools(
      queryRunner,
      STORY_41_TOOLS.map((tool) => tool.slug),
    );
  }
}
