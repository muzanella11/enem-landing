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

/** Story 43. */
const STORY_43_TOOLS: ToolSeed[] = [
  {
    slug: 'kalkulator-hpp',
    name: 'Kalkulator HPP',
    shortDescription:
      'Harga pokok produksi per unit dari bahan, tenaga kerja, overhead.',
    category: 'keuangan',
  },
  {
    slug: 'kalkulator-harga-jual',
    name: 'Kalkulator Harga Jual',
    shortDescription: 'Harga jual dari HPP dengan target margin atau markup.',
    category: 'keuangan',
  },
  {
    slug: 'kalkulator-bep',
    name: 'Kalkulator BEP',
    shortDescription: 'Titik impas usaha dalam unit dan rupiah.',
    category: 'keuangan',
  },
  {
    slug: 'kalkulator-fee-marketplace',
    name: 'Kalkulator Fee Marketplace',
    shortDescription:
      'Laba bersih setelah fee marketplace dan harga jual minimal.',
    category: 'keuangan',
  },
  {
    slug: 'kalkulator-pph-umkm',
    name: 'Kalkulator PPh UMKM 0,5%',
    shortDescription:
      'PPh final UMKM per bulan sesuai PP 55/2022 dan PP 20/2026.',
    category: 'keuangan',
  },
];

export class SeedToolsUmkm1788510000000 implements MigrationInterface {
  name = 'SeedToolsUmkm1788510000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await insertTools(queryRunner, STORY_43_TOOLS);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await deleteTools(
      queryRunner,
      STORY_43_TOOLS.map((tool) => tool.slug),
    );
  }
}
