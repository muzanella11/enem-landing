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

/** Story 46. */
const STORY_46_TOOLS: ToolSeed[] = [
  {
    slug: 'penghitung-kata',
    name: 'Penghitung Kata',
    shortDescription:
      'Jumlah kata, karakter, kalimat, paragraf, dan waktu baca.',
    category: 'pendidikan',
  },
  {
    slug: 'ubah-huruf',
    name: 'Ubah Huruf Kapital',
    shortDescription: 'Kapital, kecil, dan judul sesuai EYD dalam sekali klik.',
    category: 'pendidikan',
  },
  {
    slug: 'buat-daftar-pustaka',
    name: 'Buat Daftar Pustaka',
    shortDescription:
      'Daftar pustaka APA 7 dan Harvard untuk buku, jurnal, web, skripsi.',
    category: 'pendidikan',
  },
  {
    slug: 'kalkulator-nilai-rapor',
    name: 'Kalkulator Nilai Rapor',
    shortDescription: 'Nilai akhir berbobot dan nilai UAS yang dibutuhkan.',
    category: 'pendidikan',
  },
];

export class SeedToolsTeks1788540000000 implements MigrationInterface {
  name = 'SeedToolsTeks1788540000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await insertTools(queryRunner, STORY_46_TOOLS);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await deleteTools(
      queryRunner,
      STORY_46_TOOLS.map((tool) => tool.slug),
    );
  }
}
