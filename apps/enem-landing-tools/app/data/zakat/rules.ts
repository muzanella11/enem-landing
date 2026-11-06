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
    /** BAZNAS RI value for Jabodetabek (latest confirmed at checkedAt: 2025). Regions set their own. */
    uangPerJiwa: 47_000,
    uangSourceLabel: 'SK BAZNAS RI 2025, wilayah Jabodetabek',
  },
  sources: [
    {
      label: 'BAZNAS: ketentuan zakat penghasilan dan maal',
      url: 'https://baznas.go.id/zakat',
    },
    { label: 'BAZNAS: zakat fitrah', url: 'https://baznas.go.id/zakatfitrah' },
  ],
  caveats: [
    'Nilai zakat fitrah dalam uang ditetapkan BAZNAS tiap daerah. Angka bawaan adalah acuan Jabodetabek; ubah sesuai ketetapan daerahmu.',
    'Harga emas memakai harga spot internasional yang dikonversi ke Rupiah. Harga emas batangan (mis. Antam) biasanya lebih tinggi; kamu bisa mengisinya sendiri.',
  ],
} as const;
