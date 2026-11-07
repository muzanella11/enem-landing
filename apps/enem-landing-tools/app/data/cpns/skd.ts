/**
 * SKD CPNS rules per selection year (Story 35). Only years whose decree
 * has been published are listed; newer selections show the latest year
 * with a clear label until their KepmenPANRB comes out.
 */
export interface AmbangFormasi {
  id: string;
  label: string;
  /** Per-subtest minimums; null when the formation uses a cumulative minimum instead. */
  twk: number | null;
  tiu: number | null;
  tkp: number | null;
  totalMin: number | null;
}

export interface AturanSkd {
  tahun: number;
  dasarHukum: string;
  soal: { twk: number; tiu: number; tkp: number };
  formasi: AmbangFormasi[];
  sources: { label: string; url: string }[];
  checkedAt: string;
}

export const SKD_2024: AturanSkd = {
  tahun: 2024,
  dasarHukum:
    'KepmenPANRB Nomor 321 Tahun 2024 tentang Nilai Ambang Batas Seleksi Kompetensi Dasar Pengadaan PNS Tahun Anggaran 2024',
  soal: { twk: 30, tiu: 35, tkp: 45 },
  formasi: [
    { id: 'umum', label: 'Umum', twk: 65, tiu: 80, tkp: 166, totalMin: null },
    {
      id: 'kalimantan',
      label: 'Putra/putri Kalimantan',
      twk: 65,
      tiu: 80,
      tkp: 166,
      totalMin: null,
    },
    {
      id: 'cumlaude',
      label: 'Lulusan cumlaude',
      twk: null,
      tiu: 85,
      tkp: null,
      totalMin: 311,
    },
    {
      id: 'diaspora',
      label: 'Diaspora',
      twk: null,
      tiu: 85,
      tkp: null,
      totalMin: 311,
    },
    {
      id: 'disabilitas',
      label: 'Penyandang disabilitas',
      twk: null,
      tiu: 60,
      tkp: null,
      totalMin: 286,
    },
    {
      id: 'papua',
      label: 'Putra/putri Papua',
      twk: null,
      tiu: 60,
      tkp: null,
      totalMin: 286,
    },
    {
      id: 'tertinggal',
      label: 'Putra/putri daerah tertinggal',
      twk: null,
      tiu: 60,
      tkp: null,
      totalMin: 286,
    },
  ],
  sources: [
    {
      label: 'detikEdu (18 Okt 2024): nilai ambang batas SKD CPNS 2024',
      url: 'https://www.detik.com/edu/detikpedia/d-7594594/nilai-ambang-batas-skd-cpns-2024-cek-skormu',
    },
    {
      label: 'Okezone (5 Agu 2024): rincian KepmenPANRB 321/2024',
      url: 'https://economy.okezone.com/read/2024/08/05/320/3044349/nilai-ambang-batas-skd-cpns-2024-ini-rincian-lengkapnya?page=all',
    },
  ],
  checkedAt: '2026-11-06',
};

/** Latest published rules. */
export const ATURAN_SKD_TERBARU = SKD_2024;
