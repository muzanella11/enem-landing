import type { ToolsPublicConfig } from '@enem-landing/shared-types';

/**
 * Build-time snapshot of the tool registry (Story 25). The live registry
 * comes from the CMS via `/api/tools/config`; this snapshot is only used
 * when that request fails, so pages never render empty. Keep it in sync
 * with the seed in enem-landing-api's CreateToolsTables migration.
 */
export const TOOLS_SNAPSHOT: ToolsPublicConfig = {
  tools: [
    {
      slug: 'kalkulator-gaji-bersih',
      name: 'Kalkulator Gaji Bersih',
      shortDescription:
        'Hitung take home pay, potongan BPJS, dan PPh 21 skema TER, termasuk rekonsiliasi Desember dan THR.',
      category: 'keuangan',
      badge: 'baru',
    },
    {
      slug: 'simulasi-kpr',
      name: 'Simulasi KPR',
      shortDescription:
        'Cicilan KPR bunga fixed lalu floating, tabel amortisasi, biaya awal, dan pelunasan sebagian.',
      category: 'keuangan',
      badge: null,
    },
    {
      slug: 'kalkulator-zakat',
      name: 'Kalkulator Zakat',
      shortDescription:
        'Zakat penghasilan, zakat maal, dan zakat fitrah dengan nisab dari harga emas terbaru.',
      category: 'ibadah',
      badge: null,
    },
    {
      slug: 'gabung-pdf',
      name: 'Gabung PDF',
      shortDescription:
        'Gabungkan beberapa file PDF jadi satu, langsung di browser.',
      category: 'dokumen',
      badge: null,
    },
    {
      slug: 'pisah-pdf',
      name: 'Pisah PDF',
      shortDescription: 'Ambil halaman atau rentang halaman tertentu dari PDF.',
      category: 'dokumen',
      badge: null,
    },
    {
      slug: 'atur-halaman-pdf',
      name: 'Atur Halaman PDF',
      shortDescription:
        'Urutkan ulang, putar, dan hapus halaman PDF dengan thumbnail.',
      category: 'dokumen',
      badge: null,
    },
    {
      slug: 'gambar-ke-pdf',
      name: 'Gambar ke PDF',
      shortDescription:
        'Ubah foto JPG, PNG, atau HEIC jadi satu PDF ukuran A4 atau F4.',
      category: 'dokumen',
      badge: null,
    },
    {
      slug: 'kompres-gambar',
      name: 'Kompres Gambar',
      shortDescription:
        'Perkecil ukuran foto sampai target, misalnya di bawah 200 KB untuk formulir pendaftaran.',
      category: 'dokumen',
      badge: null,
    },
    {
      slug: 'ubah-ukuran-gambar',
      name: 'Ubah Ukuran Gambar',
      shortDescription: 'Resize foto dan buat pas foto 2x3, 3x4, atau 4x6.',
      category: 'dokumen',
      badge: null,
    },
    {
      slug: 'konversi-gambar',
      name: 'Konversi Gambar',
      shortDescription: 'Ubah format gambar JPG, PNG, WebP, dan HEIC.',
      category: 'dokumen',
      badge: null,
    },
    {
      slug: 'buat-invoice',
      name: 'Buat Invoice',
      shortDescription:
        'Buat invoice PDF untuk UMKM dan freelancer, tanpa akun.',
      category: 'keuangan',
      badge: null,
    },
    {
      slug: 'buat-kwitansi',
      name: 'Buat Kwitansi',
      shortDescription: 'Buat kwitansi PDF lengkap dengan terbilang.',
      category: 'keuangan',
      badge: null,
    },
    {
      slug: 'terbilang',
      name: 'Terbilang',
      shortDescription: 'Ubah angka jadi kata dalam Bahasa Indonesia.',
      category: 'keuangan',
      badge: null,
    },
  ].map((tool, index) => ({
    ...tool,
    category: tool.category as ToolsPublicConfig['tools'][number]['category'],
    badge: tool.badge as ToolsPublicConfig['tools'][number]['badge'],
    sortOrder: index,
    enabled: true,
    // Ads stay off in the fallback: if the CMS can't be reached we don't
    // know whether AdSense is approved or switched off.
    adsEnabled: false,
  })),
  donationOptions: [],
  settings: {
    adsEnabled: false,
    adsenseClientId: null,
    donationCtaText: 'Traktir kopi',
  },
};
