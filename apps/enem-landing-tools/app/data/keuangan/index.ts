/** Personal finance constants with sources (Story 41). Checked 2026-11-06. */
export const CHECKED_AT = '2026-11-06';

export const PAJAK_DEPOSITO = {
  /** PPh final on deposit/savings interest (PP 131/2000). */
  tarif: 0.2,
  /** Not withheld when the customer's total deposits + savings at the bank are at most this (KMK 51/KMK.04/2001). */
  bebasSampai: 7_500_000,
};

export const LPS = {
  /** Guarantee per customer per bank (UU 24/2004 as amended, PP 66/2008). */
  batas: 2_000_000_000,
  catatan:
    'Bunga deposito dijamin LPS hanya bila tidak melebihi tingkat bunga penjaminan LPS yang berlaku saat itu. Cek tingkat terbaru di situs LPS.',
};

export const SUMBER_DEPOSITO = [
  {
    label: 'PP No. 131 Tahun 2000: PPh atas bunga deposito dan tabungan',
    url: 'https://peraturan.bpk.go.id/Details/52916/pp-no-131-tahun-2000',
  },
  {
    label: 'LPS: program penjaminan simpanan dan tingkat bunga penjaminan',
    url: 'https://lps.go.id/',
  },
];

export const DISCLAIMER_INVESTASI =
  'Simulasi dengan asumsi yang Anda isi, bukan nasihat investasi dan bukan janji hasil. Imbal hasil investasi bisa naik turun.';

/** Common emergency fund guidance, in months of expenses. */
export const DANA_DARURAT = [
  { id: 'lajang', label: 'Lajang tanpa tanggungan', bulan: 6 },
  { id: 'menikah', label: 'Menikah tanpa anak', bulan: 9 },
  { id: 'anak', label: 'Menikah dengan anak/tanggungan', bulan: 12 },
] as const;
export type StatusKeluarga = (typeof DANA_DARURAT)[number]['id'];
