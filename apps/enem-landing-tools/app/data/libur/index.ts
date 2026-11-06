/**
 * Public holidays and joint leave (cuti bersama), Story 30. Source rule
 * (user decision 2026-11-06): ALWAYS the Bank Indonesia holiday calendar
 * PDF, linked from https://www.bi.go.id/id/publikasi/kalender/Default.aspx
 * ("Hari Libur dan Cuti Bersama Tahun YYYY"). Transcribed by hand from the
 * PDF opened in a browser - bi.go.id refuses automated fetches and the PDF
 * has no text layer.
 */
export type JenisLibur = 'libur' | 'cuti-bersama' | 'fakultatif-hindu';

export interface HariLibur {
  /** YYYY-MM-DD */
  tanggal: string;
  nama: string;
  jenis: JenisLibur;
  /** Marked `*)` in the BI PDF: follows the government's decision and may shift. */
  dapatBerubah: boolean;
}

export interface KalenderLibur {
  tahun: number;
  status: 'resmi' | 'menunggu';
  sumber: {
    label: string;
    url: string;
    checkedAt: string;
    lastModified?: string;
  } | null;
  dasarHukum?: string;
  entries: HariLibur[];
}

const libur = (
  tanggal: string,
  nama: string,
  dapatBerubah = false,
): HariLibur => ({ tanggal, nama, jenis: 'libur', dapatBerubah });
const cuti = (
  tanggal: string,
  nama: string,
  dapatBerubah = false,
): HariLibur => ({ tanggal, nama, jenis: 'cuti-bersama', dapatBerubah });
const fakultatif = (tanggal: string, nama: string): HariLibur => ({
  tanggal,
  nama,
  jenis: 'fakultatif-hindu',
  dapatBerubah: false,
});

export const KALENDER_LIBUR: Record<number, KalenderLibur> = {
  2026: {
    tahun: 2026,
    status: 'resmi',
    sumber: {
      label:
        'Bank Indonesia: Hari Libur dan Cuti Bersama Tahun 2026 di Bank Indonesia (PDF)',
      url: 'https://www.bi.go.id/id/publikasi/Kalender/Documents/Kalender-Libur-BI-2026.pdf',
      checkedAt: '2026-11-06',
      lastModified: '2025-12-22',
    },
    dasarHukum:
      'SKB Menteri Agama, Menteri Ketenagakerjaan, dan MenPAN-RB Nomor 933 Tahun 2025, 1 Tahun 2025, 3 Tahun 2025. Libur fakultatif Hindu: SE Ditjen Bimas Hindu Kemenag Nomor B-253/DJ.VI/Dt.VI.I.3/BA.03/09/2025.',
    entries: [
      libur('2026-01-01', 'Tahun Baru 2026 Masehi'),
      libur('2026-01-16', 'Isra Mikraj Nabi Muhammad SAW'),
      libur('2026-02-17', 'Tahun Baru Imlek 2577 Kongzili'),
      libur('2026-03-19', 'Hari Suci Nyepi Tahun Baru Saka 1948'),
      libur('2026-03-21', 'Hari Raya Idul Fitri 1447 Hijriah', true),
      libur('2026-03-22', 'Hari Raya Idul Fitri 1447 Hijriah', true),
      libur('2026-04-03', 'Wafat Yesus Kristus'),
      libur('2026-04-05', 'Kebangkitan Yesus Kristus (Paskah)'),
      libur('2026-05-01', 'Hari Buruh Internasional'),
      libur('2026-05-14', 'Kenaikan Yesus Kristus'),
      libur('2026-05-27', 'Hari Raya Idul Adha 1447 Hijriah', true),
      libur('2026-05-31', 'Hari Raya Waisak 2570 BE'),
      libur('2026-06-01', 'Hari Lahir Pancasila'),
      libur('2026-06-16', 'Tahun Baru Islam 1448 Hijriah', true),
      libur('2026-08-17', 'Hari Proklamasi Kemerdekaan Republik Indonesia'),
      libur('2026-08-25', 'Maulid Nabi Muhammad SAW'),
      libur('2026-12-25', 'Hari Raya Natal/Kelahiran Yesus Kristus'),
      cuti('2026-02-16', 'Tahun Baru Imlek 2577 Kongzili'),
      cuti('2026-03-18', 'Hari Suci Nyepi Tahun Baru Saka 1948'),
      cuti('2026-03-20', 'Hari Raya Idul Fitri 1447 Hijriah', true),
      cuti('2026-03-23', 'Hari Raya Idul Fitri 1447 Hijriah', true),
      cuti('2026-03-24', 'Hari Raya Idul Fitri 1447 Hijriah', true),
      cuti('2026-05-15', 'Kenaikan Yesus Kristus'),
      cuti('2026-05-28', 'Hari Raya Idul Adha 1447 Hijriah', true),
      cuti('2026-12-24', 'Hari Raya Natal'),
      fakultatif('2026-01-17', 'Hari Suci Siwa Ratri'),
      fakultatif('2026-03-20', 'Ngembak Geni Hari Suci Nyepi Tahun Saka 1948'),
      fakultatif('2026-04-04', 'Hari Raya Saraswati'),
      fakultatif('2026-04-08', 'Hari Raya Pagarwesi'),
      fakultatif('2026-06-16', 'Hari Penampahan Galungan'),
      fakultatif('2026-06-17', 'Hari Raya Galungan'),
      fakultatif('2026-06-18', 'Hari Umanis Galungan'),
      fakultatif('2026-06-26', 'Hari Penampahan Kuningan'),
      fakultatif('2026-06-27', 'Hari Raya Kuningan'),
      fakultatif('2026-10-31', 'Hari Raya Saraswati'),
      fakultatif('2026-11-04', 'Hari Raya Pagarwesi'),
      fakultatif('2026-11-08', 'Hari Deepavali/Diwali'),
    ],
  },
  2027: {
    tahun: 2027,
    // Checked 2026-11-06: the BI PDF for 2027 is not published yet (the
    // 2026 file appeared on 22 December 2025). No estimated dates here.
    status: 'menunggu',
    sumber: null,
    entries: [],
  },
};

export const TAHUN_LIBUR = Object.keys(KALENDER_LIBUR).map(Number).sort();
export const BI_KALENDER_URL =
  'https://www.bi.go.id/id/publikasi/kalender/Default.aspx';
