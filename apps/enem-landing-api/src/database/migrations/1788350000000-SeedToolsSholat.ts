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
/** Story 36: prayer times, imsakiyah, qibla. Ads start off (ibadah topic, like zakat). */
const STORY_36_TOOLS: ToolSeed[] = [
  {
    slug: 'jadwal-sholat',
    name: 'Jadwal Sholat',
    shortDescription:
      'Jadwal sholat hari ini dan sebulan untuk 500+ kabupaten/kota, kriteria Kemenag RI.',
    category: 'ibadah',
    adsEnabled: false,
  },
  {
    slug: 'jadwal-imsakiyah',
    name: 'Jadwal Imsakiyah Ramadan',
    shortDescription:
      'Imsakiyah Ramadan 1448 H / 2027 per kabupaten/kota: imsak, subuh, dan waktu berbuka.',
    category: 'ibadah',
    adsEnabled: false,
  },
  {
    slug: 'arah-kiblat',
    name: 'Arah Kiblat',
    shortDescription:
      'Arah kiblat dari kota atau lokasimu, dengan kompas di HP.',
    category: 'ibadah',
    adsEnabled: false,
  },
];

export class SeedToolsSholat1788350000000 implements MigrationInterface {
  name = 'SeedToolsSholat1788350000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await insertTools(queryRunner, STORY_36_TOOLS);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await deleteTools(
      queryRunner,
      STORY_36_TOOLS.map((tool) => tool.slug),
    );
  }
}
