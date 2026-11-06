/**
 * Motor vehicle insurance premium tariffs (Story 51): SEOJK No.
 * 6/SEOJK.05/2017 Lampiran IV, in force since 1 April 2017 (replaces SEOJK
 * 21/SEOJK.05/2015). The circular's own PDF on ojk.go.id does not include
 * the annex tables, so the tables were copied from two insurers' official
 * product summaries (RIPLAY) that reproduce them; both agree on categories
 * 1-5. Rates are percent per year of the sum insured, for 12-month cover
 * and vehicles up to 5 years old. Checked 2026-11-06.
 */
export const CHECKED_AT = '2026-11-06';

export type Wilayah = 1 | 2 | 3;
export type JenisKendaraan = 'penumpang' | 'truk' | 'bus' | 'motor';
export type JenisJaminan = 'comprehensive' | 'tlo';

interface Kategori {
  kategori: number;
  jenis: JenisKendaraan;
  /** Upper bound of the sum insured (inclusive); null = no upper bound. */
  sampai: number | null;
  label: string;
  /** [min, max] percent per wilayah 1, 2, 3. */
  comprehensive: [[number, number], [number, number], [number, number]];
  tlo: [[number, number], [number, number], [number, number]];
}

export const KATEGORI_OJK: Kategori[] = [
  {
    kategori: 1,
    jenis: 'penumpang',
    sampai: 125_000_000,
    label: 'Sampai Rp125 juta',
    comprehensive: [
      [3.82, 4.2],
      [3.26, 3.59],
      [2.53, 2.78],
    ],
    tlo: [
      [0.47, 0.56],
      [0.65, 0.78],
      [0.51, 0.56],
    ],
  },
  {
    kategori: 2,
    jenis: 'penumpang',
    sampai: 200_000_000,
    label: 'Di atas Rp125 juta sampai Rp200 juta',
    comprehensive: [
      [2.67, 2.94],
      [2.47, 2.72],
      [2.69, 2.96],
    ],
    tlo: [
      [0.63, 0.69],
      [0.44, 0.53],
      [0.44, 0.48],
    ],
  },
  {
    kategori: 3,
    jenis: 'penumpang',
    sampai: 400_000_000,
    label: 'Di atas Rp200 juta sampai Rp400 juta',
    comprehensive: [
      [2.18, 2.4],
      [2.08, 2.29],
      [1.79, 1.97],
    ],
    tlo: [
      [0.41, 0.46],
      [0.38, 0.42],
      [0.29, 0.35],
    ],
  },
  {
    kategori: 4,
    jenis: 'penumpang',
    sampai: 800_000_000,
    label: 'Di atas Rp400 juta sampai Rp800 juta',
    comprehensive: [
      [1.2, 1.32],
      [1.2, 1.32],
      [1.14, 1.25],
    ],
    tlo: [
      [0.25, 0.3],
      [0.25, 0.3],
      [0.23, 0.27],
    ],
  },
  {
    kategori: 5,
    jenis: 'penumpang',
    sampai: null,
    label: 'Di atas Rp800 juta',
    comprehensive: [
      [1.05, 1.16],
      [1.05, 1.16],
      [1.05, 1.16],
    ],
    tlo: [
      [0.2, 0.24],
      [0.2, 0.24],
      [0.2, 0.24],
    ],
  },
  {
    kategori: 6,
    jenis: 'truk',
    sampai: null,
    label: 'Truk dan pickup, semua nilai',
    comprehensive: [
      [2.42, 2.67],
      [2.39, 2.63],
      [2.23, 2.46],
    ],
    tlo: [
      [0.88, 1.07],
      [1.68, 2.02],
      [0.81, 0.98],
    ],
  },
  {
    kategori: 7,
    jenis: 'bus',
    sampai: null,
    label: 'Bus, semua nilai',
    comprehensive: [
      [1.04, 1.14],
      [1.04, 1.14],
      [0.88, 0.97],
    ],
    tlo: [
      [0.23, 0.29],
      [0.23, 0.29],
      [0.18, 0.22],
    ],
  },
  {
    kategori: 8,
    jenis: 'motor',
    sampai: null,
    label: 'Sepeda motor (roda dua), semua nilai',
    comprehensive: [
      [3.18, 3.5],
      [3.18, 3.5],
      [3.18, 3.5],
    ],
    tlo: [
      [1.76, 2.11],
      [1.8, 2.16],
      [0.67, 0.8],
    ],
  },
];

/** Comprehensive cover for vehicles older than 5 years: extra premium of at least 5% of the rate per year (SEOJK 6/2017 IV.4). */
export const LOADING_USIA = { mulaiTahun: 5, persenPerTahun: 5 };

/**
 * Optional extensions (Lampiran IV Tabel IV.B), as reproduced in one
 * insurer's RIPLAY. [min, max] percent per wilayah; one value = flat rate.
 */
export const PERLUASAN = {
  banjir: {
    label: 'Banjir termasuk angin topan',
    tarif: [
      [0.075, 0.1],
      [0.1, 0.125],
      [0.075, 0.1],
    ] as [number, number][],
  },
  gempa: {
    label: 'Gempa bumi, letusan gunung berapi, tsunami',
    tarif: [
      [0.12, 0.135],
      [0.1, 0.125],
      [0.075, 0.135],
    ] as [number, number][],
  },
  srcc: {
    label: 'Huru-hara dan kerusuhan (SRCC)',
    tarif: [
      [0.05, 0.05],
      [0.05, 0.05],
      [0.05, 0.05],
    ] as [number, number][],
  },
  terorisme: {
    label: 'Terorisme dan sabotase',
    tarif: [
      [0.05, 0.05],
      [0.05, 0.05],
      [0.05, 0.05],
    ] as [number, number][],
  },
} as const;
export type JenisPerluasan = keyof typeof PERLUASAN;

/** Third-party liability (passenger cars), progressive on the chosen limit. */
export const TJH_BERTINGKAT = [
  { sampai: 25_000_000, persen: 1 },
  { sampai: 50_000_000, persen: 0.5 },
  { sampai: 100_000_000, persen: 0.5 },
] as const;

/** Personal accident: driver 0,5% and passenger 0,1% per person of the PA sum insured. */
export const KECELAKAAN_DIRI = { pengemudiPersen: 0.5, penumpangPersen: 0.1 };

export const PROVINSI_WILAYAH_1 = [
  'Aceh',
  'Sumatera Utara',
  'Sumatera Barat',
  'Riau',
  'Kepulauan Riau',
  'Jambi',
  'Bengkulu',
  'Sumatera Selatan',
  'Kepulauan Bangka Belitung',
  'Lampung',
];
export const PROVINSI_WILAYAH_2 = ['DKI Jakarta', 'Jawa Barat', 'Banten'];

export const SUMBER_ASURANSI = [
  {
    label:
      'OJK: SEOJK No. 6/SEOJK.05/2017 tentang Penetapan Tarif Premi atau Kontribusi pada Lini Usaha Asuransi Harta Benda dan Asuransi Kendaraan Bermotor Tahun 2017',
    url: 'https://ojk.go.id/id/kanal/iknb/regulasi/asuransi/surat-edaran-ojk/Documents/SAL%20-%20SE%20OJK%20Tarif%20Premi.pdf',
  },
  {
    label:
      'RIPLAY Asuransi Kendaraan Bermotor PT Asuransi Bina Dana Arta Tbk (tabel kategori 1-8, mengutip SEOJK 6/2017)',
    url: 'https://myoona.id/content/dam/oona/documents/downloadable-brochures/all-products/bahasa/oona-riplay-asuransi-kendaraan-bermotor-versi-umum.pdf',
  },
  {
    label:
      'RIPLAY Roojai (tabel kategori 1-5 dan perluasan jaminan, mengutip SEOJK 6/2017)',
    url: 'https://www.roojai.co.id/wp-content/uploads/2024/03/roojai-riplay-MV-id-20230405.pdf',
  },
];
