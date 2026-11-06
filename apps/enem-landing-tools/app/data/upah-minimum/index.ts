/**
 * Provincial minimum wages (UMP) for the upah minimum pages (Story 26).
 *
 * 2025 and 2026 values come from one published table (Kontan, 26 December
 * 2025, governors' decisions of 24 December 2025) and have NOT yet been
 * matched against each governor's decree (SK); the page says so. Aceh and
 * Papua Pegunungan were not in that table. 2027 values stay null until
 * officially announced - never estimated.
 */
export interface UmpProvinsi {
  slug: string;
  nama: string;
  ump2025: number | null;
  ump2026: number | null;
  ump2027: number | null;
}

export const UMP_SOURCES = {
  2026: {
    label:
      'Kontan: "Resmi! Ini UMP 2026 di 38 Provinsi Dari Tertinggi ke Terendah" (26 Desember 2025)',
    url: 'https://nasional.kontan.co.id/news/resmi-ini-ump-2026-di-38-provinsi-dari-tertinggi-ke-terendah-ump-masih-dibawah-khl',
    terverifikasiSk: false,
  },
  2027: {
    label: 'Belum diumumkan',
    url: null,
    terverifikasiSk: false,
  },
} as const;

export const UMP_CHECKED_AT = '2026-11-06';

export const UMP_TAHUN_TERBARU = 2027;

export const UMP_PROVINSI: UmpProvinsi[] = [
  {
    slug: 'dki-jakarta',
    nama: 'DKI Jakarta',
    ump2025: 5396760,
    ump2026: 5729876,
    ump2027: null,
  },
  {
    slug: 'papua-selatan',
    nama: 'Papua Selatan',
    ump2025: 4285850,
    ump2026: 4508850,
    ump2027: null,
  },
  {
    slug: 'papua',
    nama: 'Papua',
    ump2025: 4285850,
    ump2026: 4436283,
    ump2027: null,
  },
  {
    slug: 'papua-tengah',
    nama: 'Papua Tengah',
    ump2025: 4285848,
    ump2026: 4295848,
    ump2027: null,
  },
  {
    slug: 'kepulauan-bangka-belitung',
    nama: 'Kepulauan Bangka Belitung',
    ump2025: 3876600,
    ump2026: 4035000,
    ump2027: null,
  },
  {
    slug: 'sulawesi-utara',
    nama: 'Sulawesi Utara',
    ump2025: 3775425,
    ump2026: 4002630,
    ump2027: null,
  },
  {
    slug: 'sumatera-selatan',
    nama: 'Sumatera Selatan',
    ump2025: 3681571,
    ump2026: 3942963,
    ump2027: null,
  },
  {
    slug: 'sulawesi-selatan',
    nama: 'Sulawesi Selatan',
    ump2025: 3657527,
    ump2026: 3921088,
    ump2027: null,
  },
  {
    slug: 'kepulauan-riau',
    nama: 'Kepulauan Riau',
    ump2025: 3623653,
    ump2026: 3879520,
    ump2027: null,
  },
  {
    slug: 'papua-barat',
    nama: 'Papua Barat',
    ump2025: 3615000,
    ump2026: 3840947,
    ump2027: null,
  },
  {
    slug: 'riau',
    nama: 'Riau',
    ump2025: 3508775,
    ump2026: 3780495,
    ump2027: null,
  },
  {
    slug: 'kalimantan-utara',
    nama: 'Kalimantan Utara',
    ump2025: 3580160,
    ump2026: 3770000,
    ump2027: null,
  },
  {
    slug: 'papua-barat-daya',
    nama: 'Papua Barat Daya',
    ump2025: 3614000,
    ump2026: 3766000,
    ump2027: null,
  },
  {
    slug: 'kalimantan-timur',
    nama: 'Kalimantan Timur',
    ump2025: 3579313,
    ump2026: 3759313,
    ump2027: null,
  },
  {
    slug: 'kalimantan-selatan',
    nama: 'Kalimantan Selatan',
    ump2025: 3282812,
    ump2026: 3686138,
    ump2027: null,
  },
  {
    slug: 'kalimantan-tengah',
    nama: 'Kalimantan Tengah',
    ump2025: 3473621,
    ump2026: 3686138,
    ump2027: null,
  },
  {
    slug: 'maluku-utara',
    nama: 'Maluku Utara',
    ump2025: 3408000,
    ump2026: 3552840,
    ump2027: null,
  },
  {
    slug: 'jambi',
    nama: 'Jambi',
    ump2025: 3234533,
    ump2026: 3471497,
    ump2027: null,
  },
  {
    slug: 'gorontalo',
    nama: 'Gorontalo',
    ump2025: 3221731,
    ump2026: 3405144,
    ump2027: null,
  },
  {
    slug: 'maluku',
    nama: 'Maluku',
    ump2025: 3141699,
    ump2026: 3334499,
    ump2027: null,
  },
  {
    slug: 'sulawesi-barat',
    nama: 'Sulawesi Barat',
    ump2025: 3104430,
    ump2026: 3315935,
    ump2027: null,
  },
  {
    slug: 'sulawesi-tenggara',
    nama: 'Sulawesi Tenggara',
    ump2025: 3073551,
    ump2026: 3306496,
    ump2027: null,
  },
  {
    slug: 'sumatera-utara',
    nama: 'Sumatera Utara',
    ump2025: 2992599,
    ump2026: 3228701,
    ump2027: null,
  },
  {
    slug: 'sumatera-barat',
    nama: 'Sumatera Barat',
    ump2025: 2994193,
    ump2026: 3214846,
    ump2027: null,
  },
  {
    slug: 'bali',
    nama: 'Bali',
    ump2025: 2996560,
    ump2026: 3207459,
    ump2027: null,
  },
  {
    slug: 'sulawesi-tengah',
    nama: 'Sulawesi Tengah',
    ump2025: 2914583,
    ump2026: 3179565,
    ump2027: null,
  },
  {
    slug: 'banten',
    nama: 'Banten',
    ump2025: 2905119,
    ump2026: 3100881,
    ump2027: null,
  },
  {
    slug: 'kalimantan-barat',
    nama: 'Kalimantan Barat',
    ump2025: 2878286,
    ump2026: 3054552,
    ump2027: null,
  },
  {
    slug: 'lampung',
    nama: 'Lampung',
    ump2025: 2893069,
    ump2026: 3047734,
    ump2027: null,
  },
  {
    slug: 'bengkulu',
    nama: 'Bengkulu',
    ump2025: 2670039,
    ump2026: 2827250,
    ump2027: null,
  },
  {
    slug: 'nusa-tenggara-barat',
    nama: 'Nusa Tenggara Barat',
    ump2025: 2602931,
    ump2026: 2673861,
    ump2027: null,
  },
  {
    slug: 'nusa-tenggara-timur',
    nama: 'Nusa Tenggara Timur',
    ump2025: 2328969,
    ump2026: 2455898,
    ump2027: null,
  },
  {
    slug: 'jawa-timur',
    nama: 'Jawa Timur',
    ump2025: 2305984,
    ump2026: 2446880,
    ump2027: null,
  },
  {
    slug: 'di-yogyakarta',
    nama: 'DI Yogyakarta',
    ump2025: 2264080,
    ump2026: 2417495,
    ump2027: null,
  },
  {
    slug: 'jawa-tengah',
    nama: 'Jawa Tengah',
    ump2025: 2169348,
    ump2026: 2327386.07,
    ump2027: null,
  },
  {
    slug: 'jawa-barat',
    nama: 'Jawa Barat',
    ump2025: 2191232,
    ump2026: 2317601,
    ump2027: null,
  },
  {
    slug: 'aceh',
    nama: 'Aceh',
    ump2025: null,
    ump2026: null,
    ump2027: null,
  },
  {
    slug: 'papua-pegunungan',
    nama: 'Papua Pegunungan',
    ump2025: null,
    ump2026: null,
    ump2027: null,
  },
];

export const findProvinsi = (slug: string): UmpProvinsi | null =>
  UMP_PROVINSI.find((provinsi) => provinsi.slug === slug) ?? null;

/** Rupiah and percent change, or null when either year is missing. */
export const kenaikanUmp = (dari: number | null, ke: number | null) =>
  dari && ke ? { rupiah: ke - dari, persen: ((ke - dari) / dari) * 100 } : null;
