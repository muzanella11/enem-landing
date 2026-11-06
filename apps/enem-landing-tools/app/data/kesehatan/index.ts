/**
 * Health formulas' constants and thresholds with their sources (Story 34).
 * Checked 2026-11-06.
 */
export const CHECKED_AT = '2026-11-06';

export const DISCLAIMER =
  'Hasil ini perkiraan untuk informasi umum, bukan diagnosis. Konsultasikan ke dokter, bidan, atau ahli gizi untuk keputusan kesehatan.';

export interface KategoriImt {
  label: string;
  /** Inclusive lower bound (kg/m², one decimal as published). */
  min: number;
  tone: 'kurang' | 'normal' | 'lebih' | 'obesitas';
}

/** Permenkes 41/2014 (Pedoman Gizi Seimbang), as used by P2PTM Kemenkes. */
export const IMT_KEMENKES: KategoriImt[] = [
  {
    label: 'Kurus (kekurangan berat badan tingkat berat)',
    min: 0,
    tone: 'kurang',
  },
  {
    label: 'Kurus (kekurangan berat badan tingkat ringan)',
    min: 17.0,
    tone: 'kurang',
  },
  { label: 'Normal', min: 18.5, tone: 'normal' },
  {
    label: 'Gemuk (kelebihan berat badan tingkat ringan)',
    min: 25.1,
    tone: 'lebih',
  },
  {
    label: 'Gemuk (kelebihan berat badan tingkat berat)',
    min: 27.1,
    tone: 'obesitas',
  },
];

/** WHO Western Pacific Region (2000), the Asia-Pacific cut-offs. */
export const IMT_WHO_ASIA: KategoriImt[] = [
  { label: 'Berat badan kurang', min: 0, tone: 'kurang' },
  { label: 'Normal', min: 18.5, tone: 'normal' },
  { label: 'Berisiko (overweight)', min: 23.0, tone: 'lebih' },
  { label: 'Obesitas I', min: 25.0, tone: 'obesitas' },
  { label: 'Obesitas II', min: 30.0, tone: 'obesitas' },
];

/** Mifflin-St Jeor activity multipliers. */
export const AKTIVITAS = [
  { id: 'sedenter', label: 'Jarang olahraga (kerja duduk)', faktor: 1.2 },
  { id: 'ringan', label: 'Olahraga ringan 1-3 hari/minggu', faktor: 1.375 },
  { id: 'sedang', label: 'Olahraga sedang 3-5 hari/minggu', faktor: 1.55 },
  { id: 'berat', label: 'Olahraga berat 6-7 hari/minggu', faktor: 1.725 },
  {
    id: 'sangat-berat',
    label: 'Sangat berat (kerja fisik + latihan)',
    faktor: 1.9,
  },
] as const;
export type Aktivitas = (typeof AKTIVITAS)[number]['id'];

/** About 7.700 kcal per kg of body fat; 0,5 kg/week is the usual safe pace. */
export const KKAL_PER_KG = 7700;
/** Below these, intake should be supervised (NIH/NHLBI guidance). */
export const KALORI_MINIMUM = { pria: 1500, wanita: 1200 } as const;

export const SUMBER = {
  imt: [
    {
      label: 'Permenkes No. 41 Tahun 2014 tentang Pedoman Gizi Seimbang',
      url: 'https://peraturan.bpk.go.id/Details/119080/permenkes-no-41-tahun-2014',
    },
    {
      label:
        'WHO WPRO (2000): The Asia-Pacific perspective, redefining obesity',
      url: 'https://iris.who.int/handle/10665/206936',
    },
  ],
  kalori: [
    {
      label: 'Mifflin MD dkk. (1990), Am J Clin Nutr 51(2):241-247',
      url: 'https://pubmed.ncbi.nlm.nih.gov/2305711/',
    },
    {
      label: 'NHLBI: Aim for a Healthy Weight',
      url: 'https://www.nhlbi.nih.gov/health/educational/lose_wt/index.htm',
    },
  ],
  hpl: [
    {
      label: 'ACOG Committee Opinion 700: Methods for Estimating the Due Date',
      url: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date',
    },
    {
      label: 'Kemenkes: Buku Kesehatan Ibu dan Anak (KIA)',
      url: 'https://kesga.kemkes.go.id/',
    },
  ],
  subur: [
    {
      label:
        'Wilcox AJ dkk. (1995), NEJM 333:1517-1521: waktu hubungan relatif terhadap ovulasi',
      url: 'https://www.nejm.org/doi/full/10.1056/NEJM199512073332301',
    },
    {
      label: 'ACOG FAQ: Fertility Awareness-Based Methods of Family Planning',
      url: 'https://www.acog.org/womens-health/faqs/fertility-awareness-based-methods-of-family-planning',
    },
  ],
};

/** General milestones per trimester (information only). */
export const TONGGAK_KEHAMILAN = [
  {
    minggu: 8,
    teks: 'Kunjungan antenatal pertama sebaiknya di trimester 1 (Buku KIA: minimal 6 kali pemeriksaan selama hamil).',
  },
  {
    minggu: 12,
    teks: 'Akhir trimester 1; USG trimester 1 membantu memastikan usia kehamilan.',
  },
  {
    minggu: 20,
    teks: 'Pertengahan kehamilan; gerakan janin biasanya mulai terasa sekitar minggu 18-22.',
  },
  {
    minggu: 28,
    teks: 'Awal trimester 3; pemeriksaan lebih sering sampai persalinan.',
  },
  { minggu: 37, teks: 'Kehamilan cukup bulan (aterm) mulai minggu 37.' },
  {
    minggu: 40,
    teks: 'Hari perkiraan lahir (HPL). Hanya sebagian kecil bayi lahir tepat di HPL.',
  },
];
