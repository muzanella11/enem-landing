/**
 * Severance rules per PP 35/2021 (Story 28). The labour cluster of
 * UU 6/2023 was reviewed by the Constitutional Court (putusan
 * 168/PUU-XXI/2024), which ordered a new manpower law; until that law
 * changes these numbers, PP 35/2021 is what employers apply. Re-check
 * before relying on it, and see the page caveats.
 */
export const PESANGON_CHECKED_AT = '2026-11-06';

/** Pasal 40 ayat 2: months of pay by full years of service. */
export const tabelUp = (tahun: number): number =>
  Math.min(9, Math.floor(tahun) + 1);

/** Pasal 40 ayat 3: months of pay by full years of service (0 below 3 years). */
export const tabelUpmk = (tahun: number): number => {
  if (tahun >= 24) return 10;
  if (tahun >= 21) return 8;
  if (tahun >= 18) return 7;
  if (tahun >= 15) return 6;
  if (tahun >= 12) return 5;
  if (tahun >= 9) return 4;
  if (tahun >= 6) return 3;
  if (tahun >= 3) return 2;
  return 0;
};

export interface AlasanPhk {
  id: string;
  label: string;
  pasal: string;
  /** Multiplier of UP (0 = none). */
  up: number;
  /** Multiplier of UPMK (0 = none). */
  upmk: number;
  /** Uang pisah (amount set by the employment contract/company rules). */
  uangPisah: boolean;
}

export const ALASAN_PHK: AlasanPhk[] = [
  {
    id: 'efisiensi-rugi',
    label: 'Efisiensi karena perusahaan merugi',
    pasal: 'Pasal 43 ayat 1',
    up: 0.5,
    upmk: 1,
    uangPisah: false,
  },
  {
    id: 'efisiensi-cegah-rugi',
    label: 'Efisiensi untuk mencegah kerugian',
    pasal: 'Pasal 43 ayat 2',
    up: 1,
    upmk: 1,
    uangPisah: false,
  },
  {
    id: 'tutup-rugi',
    label: 'Perusahaan tutup karena merugi 2 tahun berturut-turut',
    pasal: 'Pasal 44 ayat 1',
    up: 0.5,
    upmk: 1,
    uangPisah: false,
  },
  {
    id: 'tutup-bukan-rugi',
    label: 'Perusahaan tutup bukan karena merugi',
    pasal: 'Pasal 44 ayat 2',
    up: 1,
    upmk: 1,
    uangPisah: false,
  },
  {
    id: 'force-majeure-tutup',
    label: 'Keadaan memaksa, perusahaan tutup',
    pasal: 'Pasal 45 ayat 1',
    up: 0.5,
    upmk: 1,
    uangPisah: false,
  },
  {
    id: 'force-majeure-tidak-tutup',
    label: 'Keadaan memaksa, perusahaan tidak tutup',
    pasal: 'Pasal 45 ayat 2',
    up: 0.75,
    upmk: 1,
    uangPisah: false,
  },
  {
    id: 'pailit',
    label: 'Perusahaan pailit',
    pasal: 'Pasal 47',
    up: 0.5,
    upmk: 1,
    uangPisah: false,
  },
  {
    id: 'merger-tidak-bersedia',
    label: 'Penggabungan/peleburan/pemisahan, pekerja tidak bersedia',
    pasal: 'Pasal 41',
    up: 1,
    upmk: 1,
    uangPisah: false,
  },
  {
    id: 'pengambilalihan',
    label: 'Pengambilalihan perusahaan',
    pasal: 'Pasal 42 ayat 1',
    up: 1,
    upmk: 1,
    uangPisah: false,
  },
  {
    id: 'perubahan-syarat',
    label:
      'Pengambilalihan dengan perubahan syarat kerja, pekerja tidak bersedia',
    pasal: 'Pasal 42 ayat 2',
    up: 0.5,
    upmk: 1,
    uangPisah: false,
  },
  {
    id: 'pengusaha-melanggar',
    label: 'Permohonan PHK oleh pekerja karena pengusaha melanggar',
    pasal: 'Pasal 48',
    up: 1,
    upmk: 1,
    uangPisah: false,
  },
  {
    id: 'pelanggaran-pekerja',
    label: 'Pekerja melanggar perjanjian kerja setelah surat peringatan',
    pasal: 'Pasal 52 ayat 1',
    up: 0.5,
    upmk: 1,
    uangPisah: false,
  },
  {
    id: 'sakit-berkepanjangan',
    label: 'Sakit berkepanjangan/cacat akibat kerja lebih dari 12 bulan',
    pasal: 'Pasal 55',
    up: 2,
    upmk: 1,
    uangPisah: false,
  },
  {
    id: 'pensiun',
    label: 'Pensiun',
    pasal: 'Pasal 56',
    up: 1.75,
    upmk: 1,
    uangPisah: false,
  },
  {
    id: 'meninggal',
    label: 'Meninggal dunia (dibayarkan ke ahli waris)',
    pasal: 'Pasal 57',
    up: 2,
    upmk: 1,
    uangPisah: false,
  },
  {
    id: 'ditahan',
    label: 'Ditahan pihak berwajib',
    pasal: 'Pasal 54',
    up: 0,
    upmk: 1,
    uangPisah: false,
  },
  {
    id: 'mengundurkan-diri',
    label: 'Mengundurkan diri atas kemauan sendiri',
    pasal: 'Pasal 50',
    up: 0,
    upmk: 0,
    uangPisah: true,
  },
  {
    id: 'mangkir',
    label: 'Mangkir 5 hari kerja berturut-turut',
    pasal: 'Pasal 51',
    up: 0,
    upmk: 0,
    uangPisah: true,
  },
];

/** PP 68/2009: final PPh 21 on severance, progressive by layer. */
export const LAPISAN_PPH_PESANGON: readonly [number, number][] = [
  [50_000_000, 0],
  [100_000_000, 5],
  [500_000_000, 15],
  [Infinity, 25],
];

export const PESANGON_SOURCES = [
  {
    label: 'PP 35/2021 Pasal 40 sampai 57 (hak akibat PHK)',
    url: 'https://peraturan.bpk.go.id/',
  },
  {
    label: 'PP 68/2009 (tarif PPh 21 final atas pesangon)',
    url: 'https://jdih.kemenkeu.go.id/',
  },
  {
    label:
      'Putusan MK 168/PUU-XXI/2024 (uji materi klaster ketenagakerjaan UU 6/2023)',
    url: 'https://www.mkri.id/',
  },
];
