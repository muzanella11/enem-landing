/**
 * BPJS Kesehatan PBPU/BP (mandiri) contributions and the service penalty
 * (Story 44). Perpres 64/2020 values remain in force: KRIS replaced the
 * class system in hospitals, but no new contribution had been set when
 * checked. Checked 2026-11-06.
 */
export const CHECKED_AT = '2026-11-06';

export const IURAN_MANDIRI = [
  { kelas: 1, iuran: 150_000, dibayarPeserta: 150_000 },
  { kelas: 2, iuran: 100_000, dibayarPeserta: 100_000 },
  /** Rp7.000 is subsidised by the government. */
  { kelas: 3, iuran: 42_000, dibayarPeserta: 35_000 },
] as const;

export const DENDA_PELAYANAN = {
  /** 5% of the initial INA-CBG diagnosis cost x months in arrears. */
  persen: 0.05,
  maksBulan: 12,
  maksRupiah: 30_000_000,
  /** Applies to inpatient care within 45 days after the membership is active again. */
  hariSetelahAktif: 45,
  /** Arrears that must be paid to reactivate are capped at 24 months. */
  maksBulanTunggakanDibayar: 24,
};

export const SUMBER_BPJS = [
  {
    label:
      'Bisnis.com (1 Sep 2026): iuran BPJS Kesehatan kelas 1, 2, 3 per September 2026',
    url: 'https://finansial.bisnis.com/read/20260901/215/2000251/kelas-1-2-3-segera-dihapus-simak-iuran-bpjs-kesehatan-sekarang-per-bulan-september-2026',
  },
  {
    label: 'CNBC Indonesia (2 Agu 2026): kelas dihapus, iuran masih tarif lama',
    url: 'https://cnbcindonesia.com/news/20260802092453-4-755779/pemerintah-hapus-kelas-1-2-3-bpjs-kesehatan-ini-iuran-per-2-agustus',
  },
  {
    label: 'BPJS Kesehatan: informasi iuran dan denda',
    url: 'https://www.bpjs-kesehatan.go.id/',
  },
];
