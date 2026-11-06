/**
 * KUR rules for 2026 (Story 52): Permenko Perekonomian No. 1 Tahun 2026
 * (pedoman pelaksanaan KUR), as reported by Bisnis.com from the banks'
 * official information. The regulation text and the official KUR portal
 * (kur.ekon.go.id, suspended when checked) were not reachable. Checked
 * 2026-11-06.
 */
export const CHECKED_AT = '2026-11-06';

export type JenisKur = 'super-mikro' | 'mikro' | 'kecil';
export type SektorKur = 'produksi' | 'perdagangan';

export const JENIS_KUR = [
  {
    id: 'super-mikro',
    label: 'KUR Super Mikro',
    plafonMin: 0,
    plafonMaks: 10_000_000,
    tenorModalKerja: 36,
    tenorInvestasi: 60,
  },
  {
    id: 'mikro',
    label: 'KUR Mikro',
    plafonMin: 10_000_001,
    plafonMaks: 100_000_000,
    tenorModalKerja: 36,
    tenorInvestasi: 60,
  },
  {
    id: 'kecil',
    label: 'KUR Kecil',
    plafonMin: 100_000_001,
    plafonMaks: 500_000_000,
    tenorModalKerja: 48,
    tenorInvestasi: 60,
  },
] as const;

/**
 * Effective annual rate. Super Mikro 3%. Mikro and Kecil: 6% for production
 * and export-oriented trade; non-export trade steps up with each new KUR:
 * 6%, 7%, 8%, 9% (1st to 4th).
 */
export const bungaKur = (
  jenis: JenisKur,
  sektor: SektorKur,
  urutan: number,
) => {
  if (jenis === 'super-mikro') return 3;
  if (sektor === 'produksi') return 6;
  return Math.min(9, 5 + Math.max(1, Math.round(urutan)));
};

export const SUMBER_KUR = [
  {
    label:
      'Bisnis.com (23 Sep 2026): KUR BRI vs Mandiri 2026, Permenko Perekonomian No. 1 Tahun 2026, bunga berjenjang',
    url: 'https://finansial.bisnis.com/read/20260923/90/2006630/kur-bri-vs-mandiri-2026-daftar-bunga-plafon-hingga-simulasi-angsuran',
  },
  {
    label:
      'Bisnis.com (3 Nov 2026): tabel angsuran KUR BNI Rp100 juta (bunga 6% efektif, angsuran anuitas)',
    url: 'https://finansial.bisnis.com/read/20261103/90/2017995/tabel-angsuran-kur-bni-rp100-juta-november-2026-bunga-syarat-dan-cara-pengajuan',
  },
];

export const BANK_PENYALUR = [
  { nama: 'BRI', url: 'https://bri.co.id/' },
  { nama: 'Bank Mandiri', url: 'https://www.bankmandiri.co.id/' },
  { nama: 'BNI', url: 'https://www.bni.co.id/' },
  { nama: 'BSI (KUR syariah)', url: 'https://www.bankbsi.co.id/' },
];
