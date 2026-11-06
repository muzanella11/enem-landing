import { randomUUID } from 'node:crypto';
import { Table } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Story 25: registry for tools.muzanella.com. Seeds every tool that
 * enem-landing-tools ships with (Stories 20-24), the default settings row
 * (ads off until AdSense approves the site), and a SociaBuzz donation
 * option without a URL - the CMS fills in the URL, and options without one
 * are never served publicly.
 */
const SEED_TOOLS: {
  slug: string;
  name: string;
  shortDescription: string;
  category: 'keuangan' | 'dokumen' | 'ibadah';
}[] = [
  {
    slug: 'kalkulator-gaji-bersih',
    name: 'Kalkulator Gaji Bersih',
    shortDescription:
      'Hitung take home pay, potongan BPJS, dan PPh 21 skema TER, termasuk rekonsiliasi Desember dan THR.',
    category: 'keuangan',
  },
  {
    slug: 'simulasi-kpr',
    name: 'Simulasi KPR',
    shortDescription:
      'Cicilan KPR bunga fixed lalu floating, tabel amortisasi, biaya awal, dan pelunasan sebagian.',
    category: 'keuangan',
  },
  {
    slug: 'kalkulator-zakat',
    name: 'Kalkulator Zakat',
    shortDescription:
      'Zakat penghasilan, zakat maal, dan zakat fitrah dengan nisab dari harga emas terbaru.',
    category: 'ibadah',
  },
  {
    slug: 'gabung-pdf',
    name: 'Gabung PDF',
    shortDescription:
      'Gabungkan beberapa file PDF jadi satu, langsung di browser.',
    category: 'dokumen',
  },
  {
    slug: 'pisah-pdf',
    name: 'Pisah PDF',
    shortDescription: 'Ambil halaman atau rentang halaman tertentu dari PDF.',
    category: 'dokumen',
  },
  {
    slug: 'atur-halaman-pdf',
    name: 'Atur Halaman PDF',
    shortDescription:
      'Urutkan ulang, putar, dan hapus halaman PDF dengan thumbnail.',
    category: 'dokumen',
  },
  {
    slug: 'gambar-ke-pdf',
    name: 'Gambar ke PDF',
    shortDescription:
      'Ubah foto JPG, PNG, atau HEIC jadi satu PDF ukuran A4 atau F4.',
    category: 'dokumen',
  },
  {
    slug: 'kompres-gambar',
    name: 'Kompres Gambar',
    shortDescription:
      'Perkecil ukuran foto sampai target, misalnya di bawah 200 KB untuk formulir pendaftaran.',
    category: 'dokumen',
  },
  {
    slug: 'ubah-ukuran-gambar',
    name: 'Ubah Ukuran Gambar',
    shortDescription: 'Resize foto dan buat pas foto 2x3, 3x4, atau 4x6.',
    category: 'dokumen',
  },
  {
    slug: 'konversi-gambar',
    name: 'Konversi Gambar',
    shortDescription: 'Ubah format gambar JPG, PNG, WebP, dan HEIC.',
    category: 'dokumen',
  },
  {
    slug: 'buat-invoice',
    name: 'Buat Invoice',
    shortDescription: 'Buat invoice PDF untuk UMKM dan freelancer, tanpa akun.',
    category: 'keuangan',
  },
  {
    slug: 'buat-kwitansi',
    name: 'Buat Kwitansi',
    shortDescription: 'Buat kwitansi PDF lengkap dengan terbilang.',
    category: 'keuangan',
  },
  {
    slug: 'terbilang',
    name: 'Terbilang',
    shortDescription: 'Ubah angka jadi kata dalam Bahasa Indonesia.',
    category: 'keuangan',
  },
];

export class CreateToolsTables1788320000000 implements MigrationInterface {
  name = 'CreateToolsTables1788320000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'tools',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'slug', type: 'varchar', isUnique: true },
          { name: 'name', type: 'varchar' },
          { name: 'shortDescription', type: 'varchar', length: '512' },
          { name: 'category', type: 'varchar', length: '32' },
          { name: 'sortOrder', type: 'int', default: 0 },
          { name: 'enabled', type: 'tinyint', default: 1 },
          { name: 'badge', type: 'varchar', length: '16', isNullable: true },
          { name: 'adsEnabled', type: 'tinyint', default: 1 },
          {
            name: 'updatedAt',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
            onUpdate: 'CURRENT_TIMESTAMP(6)',
          },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'tools_donation_options',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'label', type: 'varchar' },
          { name: 'platform', type: 'varchar', length: '32' },
          { name: 'url', type: 'varchar', length: '2048', isNullable: true },
          {
            name: 'qrisImageUrl',
            type: 'varchar',
            length: '2048',
            isNullable: true,
          },
          { name: 'note', type: 'varchar', isNullable: true },
          { name: 'enabled', type: 'tinyint', default: 1 },
          { name: 'sortOrder', type: 'int', default: 0 },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'tools_settings',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'adsEnabled', type: 'tinyint', default: 0 },
          { name: 'adsenseClientId', type: 'varchar', isNullable: true },
          {
            name: 'donationCtaText',
            type: 'varchar',
            default: "'Traktir kopi'",
          },
          { name: 'blockedCategoriesNote', type: 'text', isNullable: true },
        ],
      }),
    );

    for (const [index, tool] of SEED_TOOLS.entries()) {
      await queryRunner.query(
        `INSERT INTO tools (id, slug, name, shortDescription, category, sortOrder, enabled, badge, adsEnabled)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [
          randomUUID(),
          tool.slug,
          tool.name,
          tool.shortDescription,
          tool.category,
          index,
          index === 0 ? 'baru' : null,
          // Topik ibadah: ads off by default (Story 22).
          tool.category === 'ibadah' ? 0 : 1,
        ],
      );
    }

    await queryRunner.query(
      `INSERT INTO tools_settings (id, adsEnabled, adsenseClientId, donationCtaText, blockedCategoriesNote)
       VALUES (?, 0, NULL, 'Traktir kopi', ?)`,
      [
        randomUUID(),
        'Blokir di AdSense: pinjol, judi/slot, investasi bodong, kripto berisiko tinggi. Untuk halaman zakat juga: alkohol, kencan, kartu kredit, pinjaman.',
      ],
    );

    await queryRunner.query(
      `INSERT INTO tools_donation_options (id, label, platform, url, qrisImageUrl, note, enabled, sortOrder)
       VALUES (?, 'SociaBuzz', 'sociabuzz', NULL, NULL, 'Bisa pakai Rupiah atau mata uang asing', 1, 0)`,
      [randomUUID()],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tools_settings');
    await queryRunner.dropTable('tools_donation_options');
    await queryRunner.dropTable('tools');
  }
}
