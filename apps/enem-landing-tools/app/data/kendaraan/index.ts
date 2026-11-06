/** Vehicle document fees and tax rules with sources (Story 42). Checked 2026-11-06. */
export const CHECKED_AT = '2026-11-06';

const PP_76 = {
  label:
    'Hukumonline (10 Okt 2025): tarif SIM, STNK, BPKB menurut Lampiran PP 76/2020',
  url: 'https://www.hukumonline.com/klinik/a/ini-tarif-sim--stnk-dan-bpkb-tebaru-lt586da674b5694',
};
const PP_76_TNKB = {
  label: 'Hukumonline: biaya penerbitan STNK dan TNKB (PP 76/2020)',
  url: 'https://www.hukumonline.com/klinik/a/biaya-penerbitan-dan-perpanjangan-stnk-serta-tnkb-lt5522126327fb6/',
};
export const SUMBER_PNBP = [PP_76, PP_76_TNKB];

/** PNBP Polri, PP 76/2020 Lampiran angka I and II. */
export const TARIF_SIM = [
  {
    golongan: 'A',
    untuk: 'Mobil penumpang/barang sampai 3.500 kg',
    baru: 120_000,
    perpanjang: 80_000,
  },
  {
    golongan: 'B I',
    untuk: 'Mobil di atas 3.500 kg',
    baru: 120_000,
    perpanjang: 80_000,
  },
  {
    golongan: 'B II',
    untuk: 'Kendaraan alat berat, penarik, gandengan',
    baru: 120_000,
    perpanjang: 80_000,
  },
  {
    golongan: 'C',
    untuk: 'Sepeda motor sampai 250 cc',
    baru: 100_000,
    perpanjang: 75_000,
  },
  {
    golongan: 'C I',
    untuk: 'Sepeda motor 250-500 cc',
    baru: 100_000,
    perpanjang: 75_000,
  },
  {
    golongan: 'C II',
    untuk: 'Sepeda motor di atas 500 cc',
    baru: 100_000,
    perpanjang: 75_000,
  },
  {
    golongan: 'D',
    untuk: 'Kendaraan khusus penyandang disabilitas (motor)',
    baru: 50_000,
    perpanjang: 30_000,
  },
  {
    golongan: 'D I',
    untuk: 'Kendaraan khusus penyandang disabilitas (mobil)',
    baru: 50_000,
    perpanjang: 30_000,
  },
  {
    golongan: 'Internasional',
    untuk: 'SIM Internasional',
    baru: 250_000,
    perpanjang: 225_000,
  },
] as const;

export type JenisRoda = 'r2' | 'r4';
export const LABEL_RODA: Record<JenisRoda, string> = {
  r2: 'Motor (roda 2/3)',
  r4: 'Mobil (roda 4 atau lebih)',
};

/** PP 76/2020 Lampiran angka IV (STNK), TNKB, and VIII (BPKB). */
export const TARIF_DOKUMEN: Record<
  JenisRoda,
  { stnk: number; tnkb: number; bpkb: number }
> = {
  r2: { stnk: 100_000, tnkb: 60_000, bpkb: 225_000 },
  r4: { stnk: 200_000, tnkb: 100_000, bpkb: 375_000 },
};

export const BIAYA_NON_PNBP =
  'Saat membuat atau memperpanjang SIM biasanya ada biaya di luar PNBP, seperti surat keterangan sehat jasmani dan tes psikologi, yang besarnya berbeda per tempat.';

/**
 * Regional vehicle tax framework, UU 1/2022 (HKPD), in force from 5 Jan 2025.
 * Actual provincial rates are set by each province's Perda, at or below these caps.
 */
export const PKB = {
  /** Caps for provinces with autonomous regencies/cities. */
  tarifMaksPertama: 1.2,
  tarifMaksProgresif: 6,
  /** DKI Jakarta (no autonomous regencies) has higher caps and no opsen. */
  dkiMaksPertama: 2,
  dkiMaksProgresif: 10,
  /** Opsen PKB for the regency/city, as a share of PKB. */
  opsen: 0.66,
  /** Late payment: 1% per month, at most 24 months. */
  dendaPerBulan: 0.01,
  dendaMaksBulan: 24,
};

/** Jasa Raharja SWDKLLJ (PMK 16/PMK.010/2017): yearly contribution and late penalty for private vehicles. */
export const SWDKLLJ: Record<JenisRoda, { iuran: number; denda: number }> = {
  r2: { iuran: 35_000, denda: 32_000 },
  r4: { iuran: 143_000, denda: 100_000 },
};

export const SUMBER_PAJAK = [
  {
    label: 'UU No. 1 Tahun 2022 tentang Hubungan Keuangan Pusat dan Daerah',
    url: 'https://peraturan.bpk.go.id/Details/195682/uu-no-1-tahun-2022',
  },
  {
    label: 'PMK No. 16/PMK.010/2017: santunan dan sumbangan wajib Jasa Raharja',
    url: 'https://peraturan.bpk.go.id/Details/115327/pmk-no-16pmk0102017',
  },
];
