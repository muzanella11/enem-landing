/**
 * Payroll rules for tax year 2026 (Story 20). Every number that changes
 * over time lives here, once, with where it came from. Update this file
 * (or add `2027.ts`) when a rule changes; the calculator and its tests
 * read only from here.
 */

/** [upper bound of monthly gross (inclusive), rate in percent]. Last row uses Infinity. */
export type TerBracket = readonly [number, number];

export const TER_A: readonly TerBracket[] = [
  [5_400_000, 0],
  [5_650_000, 0.25],
  [5_950_000, 0.5],
  [6_300_000, 0.75],
  [6_750_000, 1],
  [7_500_000, 1.25],
  [8_550_000, 1.5],
  [9_650_000, 1.75],
  [10_050_000, 2],
  [10_350_000, 2.25],
  [10_700_000, 2.5],
  [11_050_000, 3],
  [11_600_000, 3.5],
  [12_500_000, 4],
  [13_750_000, 5],
  [15_100_000, 6],
  [16_950_000, 7],
  [19_750_000, 8],
  [24_150_000, 9],
  [26_450_000, 10],
  [28_000_000, 11],
  [30_050_000, 12],
  [32_400_000, 13],
  [35_400_000, 14],
  [39_100_000, 15],
  [43_850_000, 16],
  [47_800_000, 17],
  [51_400_000, 18],
  [56_300_000, 19],
  [62_200_000, 20],
  [68_600_000, 21],
  [77_500_000, 22],
  [89_000_000, 23],
  [103_000_000, 24],
  [125_000_000, 25],
  [157_000_000, 26],
  [206_000_000, 27],
  [337_000_000, 28],
  [454_000_000, 29],
  [550_000_000, 30],
  [695_000_000, 31],
  [910_000_000, 32],
  [1_400_000_000, 33],
  [Infinity, 34],
];

export const TER_B: readonly TerBracket[] = [
  [6_200_000, 0],
  [6_500_000, 0.25],
  [6_850_000, 0.5],
  [7_300_000, 0.75],
  [9_200_000, 1],
  [10_750_000, 1.5],
  [11_250_000, 2],
  [11_600_000, 2.5],
  [12_600_000, 3],
  [13_600_000, 4],
  [14_950_000, 5],
  [16_400_000, 6],
  [18_450_000, 7],
  [21_850_000, 8],
  [26_000_000, 9],
  [27_700_000, 10],
  [29_350_000, 11],
  [31_450_000, 12],
  [33_950_000, 13],
  [37_100_000, 14],
  [41_100_000, 15],
  [45_800_000, 16],
  [49_500_000, 17],
  [53_800_000, 18],
  [58_500_000, 19],
  [64_000_000, 20],
  [71_000_000, 21],
  [80_000_000, 22],
  [93_000_000, 23],
  [109_000_000, 24],
  [129_000_000, 25],
  [163_000_000, 26],
  [211_000_000, 27],
  [374_000_000, 28],
  [459_000_000, 29],
  [555_000_000, 30],
  [704_000_000, 31],
  [957_000_000, 32],
  [1_405_000_000, 33],
  [Infinity, 34],
];

export const TER_C: readonly TerBracket[] = [
  [6_600_000, 0],
  [6_950_000, 0.25],
  [7_350_000, 0.5],
  [7_800_000, 0.75],
  [8_850_000, 1],
  [9_800_000, 1.25],
  [10_950_000, 1.5],
  [11_200_000, 1.75],
  [12_050_000, 2],
  [12_950_000, 3],
  [14_150_000, 4],
  [15_550_000, 5],
  [17_050_000, 6],
  [19_500_000, 7],
  [22_700_000, 8],
  [26_600_000, 9],
  [28_100_000, 10],
  [30_100_000, 11],
  [32_600_000, 12],
  [35_400_000, 13],
  [38_900_000, 14],
  [43_000_000, 15],
  [47_400_000, 16],
  [51_200_000, 17],
  [55_800_000, 18],
  [60_400_000, 19],
  [66_700_000, 20],
  [74_500_000, 21],
  [83_200_000, 22],
  [95_600_000, 23],
  [110_000_000, 24],
  [134_000_000, 25],
  [169_000_000, 26],
  [221_000_000, 27],
  [390_000_000, 28],
  [463_000_000, 29],
  [561_000_000, 30],
  [709_000_000, 31],
  [965_000_000, 32],
  [1_419_000_000, 33],
  [Infinity, 34],
];

export const PTKP_STATUSES = [
  'TK/0',
  'TK/1',
  'TK/2',
  'TK/3',
  'K/0',
  'K/1',
  'K/2',
  'K/3',
] as const;
export type PtkpStatus = (typeof PTKP_STATUSES)[number];

export type TerCategory = 'A' | 'B' | 'C';

export const PAYROLL_RULES_2026 = {
  year: 2026,
  checkedAt: '2026-11-06',
  ptkp: {
    base: 54_000_000,
    married: 4_500_000,
    perDependant: 4_500_000,
    maxDependants: 3,
  },
  terCategory: {
    'TK/0': 'A',
    'TK/1': 'A',
    'K/0': 'A',
    'TK/2': 'B',
    'TK/3': 'B',
    'K/1': 'B',
    'K/2': 'B',
    'K/3': 'C',
  } satisfies Record<PtkpStatus, TerCategory>,
  ter: { A: TER_A, B: TER_B, C: TER_C },
  /** [upper bound of annual PKP (inclusive), rate in percent]. */
  pasal17: [
    [60_000_000, 5],
    [250_000_000, 15],
    [500_000_000, 25],
    [5_000_000_000, 30],
    [Infinity, 35],
  ] as readonly TerBracket[],
  biayaJabatan: { rate: 0.05, maxAnnual: 6_000_000 },
  bpjs: {
    kesehatan: { employee: 0.01, employer: 0.04, wageCap: 12_000_000 },
    jht: { employee: 0.02, employer: 0.037 },
    // Cap set by BPJS Ketenagakerjaan from March 2025; adjusted yearly by
    // GDP growth. The 2026 adjustment was not confirmed at checkedAt.
    jp: { employee: 0.01, employer: 0.02, wageCap: 10_547_400 },
    jkm: { employer: 0.003 },
  },
  /** JKK by workplace risk level (PP 44/2015). */
  jkkRates: [
    { label: 'Sangat rendah (0,24%)', rate: 0.0024 },
    { label: 'Rendah (0,54%)', rate: 0.0054 },
    { label: 'Sedang (0,89%)', rate: 0.0089 },
    { label: 'Tinggi (1,27%)', rate: 0.0127 },
    { label: 'Sangat tinggi (1,74%)', rate: 0.0174 },
  ],
  sources: [
    {
      label: 'PP 58/2023 (tarif efektif rata-rata PPh 21)',
      url: 'https://jdih.kemenkeu.go.id/',
    },
    {
      label: 'PMK 168/2023 (tata cara pemotongan PPh 21)',
      url: 'https://jdih.kemenkeu.go.id/',
    },
    {
      label:
        'BPJS Ketenagakerjaan: batas upah Jaminan Pensiun mulai Maret 2025',
      url: 'https://www.bpjsketenagakerjaan.go.id/',
    },
    {
      label: 'Perpres 64/2020 (iuran BPJS Kesehatan, batas upah Rp12 juta)',
      url: 'https://www.bpjs-kesehatan.go.id/',
    },
  ],
  caveats: [
    'Batas upah Jaminan Pensiun memakai angka resmi Maret 2025 (Rp10.547.400). Penyesuaian tahun 2026 belum terkonfirmasi saat pengecekan.',
  ],
} as const;

export type PayrollRules = typeof PAYROLL_RULES_2026;
