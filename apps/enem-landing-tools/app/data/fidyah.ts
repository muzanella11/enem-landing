/** Fidyah and kafarat (Story 45). Checked 2026-11-06. */
export const CHECKED_AT = '2026-11-06';

export const FIDYAH = {
  /** BAZNAS RI 2026 (SK Ketua BAZNAS RI No. 14 Tahun 2026), per person per day, paid through BAZNAS. */
  uangPerHari: 65_000,
  /** One mud of staple food per day; Indonesian practice commonly uses about 0,6 to 0,75 kg of rice. */
  berasKgPerHari: 0.6,
};

export const SUMBER_FIDYAH = [
  {
    label:
      'Jawapos: BAZNAS tetapkan zakat fitrah 2026 Rp50.000 dan fidyah Rp65.000 per jiwa (SK 14/2026)',
    url: 'https://www.jawapos.com/nasional/2602100086/baznas-tetapkan-zakat-fitrah-2026-sebesar-rp-50000-dan-fidyah-rp-65000-per-jiwa',
  },
  { label: 'BAZNAS: fidyah', url: 'https://baznas.go.id/fidyah' },
  {
    label: 'QS Al-Baqarah 184 (fidyah memberi makan orang miskin)',
    url: 'https://quran.kemenag.go.id/quran/per-ayat/surah/2?from=184&to=184',
  },
];

export const KAFARAT = [
  {
    id: 'jima-ramadan',
    label: 'Berhubungan suami istri di siang hari Ramadan',
    urutan: [
      'Memerdekakan budak (tidak berlaku saat ini)',
      'Puasa 2 bulan berturut-turut',
      'Memberi makan 60 orang miskin',
    ],
    miskin: 60,
    dalil:
      'HR Bukhari dan Muslim (kisah orang yang menggauli istrinya di siang Ramadan)',
  },
  {
    id: 'sumpah',
    label: 'Melanggar sumpah',
    urutan: [
      'Memberi makan atau pakaian kepada 10 orang miskin, atau memerdekakan budak',
      'Bila tidak mampu: puasa 3 hari',
    ],
    miskin: 10,
    dalil: 'QS Al-Maidah 89',
  },
  {
    id: 'zihar',
    label: 'Zihar (menyamakan istri dengan ibu)',
    urutan: [
      'Memerdekakan budak (tidak berlaku saat ini)',
      'Puasa 2 bulan berturut-turut',
      'Memberi makan 60 orang miskin',
    ],
    miskin: 60,
    dalil: 'QS Al-Mujadilah 3-4',
  },
] as const;
export type JenisKafarat = (typeof KAFARAT)[number]['id'];

export const SUMBER_KAFARAT = [
  {
    label: 'QS Al-Maidah 89 (kafarat sumpah)',
    url: 'https://quran.kemenag.go.id/quran/per-ayat/surah/5?from=89&to=89',
  },
  {
    label: 'QS Al-Mujadilah 3-4 (kafarat zihar)',
    url: 'https://quran.kemenag.go.id/quran/per-ayat/surah/58?from=3&to=4',
  },
];

export const SUMBER_WARIS = [
  {
    label: 'QS An-Nisa 11, 12, dan 176 (bagian ahli waris)',
    url: 'https://quran.kemenag.go.id/quran/per-ayat/surah/4?from=11&to=12',
  },
  {
    label:
      'Kompilasi Hukum Islam (Inpres 1/1991) Buku II tentang Hukum Kewarisan',
    url: 'https://peraturan.bpk.go.id/Details/224221/inpres-no-1-tahun-1991',
  },
];
