/**
 * Zakat rules (Story 22), following BAZNAS. Values that are set per year
 * or per region (zakat fitrah) are defaults the user can override.
 */
export const ZAKAT_RULES = {
  checkedAt: '2026-11-06',
  nisabGoldGrams: 85,
  ratePct: 2.5,
  fitrah: {
    berasKgPerJiwa: 2.5,
    berasLiterPerJiwa: 3.5,
    /** BAZNAS RI 2026 (SK Ketua BAZNAS RI No. 14 Tahun 2026). Regional BAZNAS set their own. */
    uangPerJiwa: 50_000,
    uangSourceLabel: 'SK Ketua BAZNAS RI No. 14 Tahun 2026',
  },
  sources: [
    {
      label: 'BAZNAS: ketentuan zakat penghasilan dan maal',
      url: 'https://baznas.go.id/zakat',
    },
    { label: 'BAZNAS: zakat fitrah', url: 'https://baznas.go.id/zakatfitrah' },
    {
      label:
        'Jawapos: BAZNAS tetapkan zakat fitrah 2026 Rp50.000 dan fidyah Rp65.000 (SK 14/2026)',
      url: 'https://www.jawapos.com/nasional/2602100086/baznas-tetapkan-zakat-fitrah-2026-sebesar-rp-50000-dan-fidyah-rp-65000-per-jiwa',
    },
  ],
  caveats: [
    'Nilai zakat fitrah dalam uang ditetapkan BAZNAS tiap daerah. Angka bawaan adalah ketetapan BAZNAS RI 2026; ubah sesuai ketetapan daerahmu.',
    'Harga emas memakai harga spot internasional yang dikonversi ke Rupiah. Harga emas batangan (mis. Antam) biasanya lebih tinggi; kamu bisa mengisinya sendiri.',
  ],
} as const;
