import type { SuratTemplate } from './types';
import { KOTA_TANGGAL, kolomNama } from './umum';

const hari = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).getTime() / 86_400_000;

export const SURAT_RESIGN: SuratTemplate = {
  slug: 'pengunduran-diri',
  nama: 'Surat Pengunduran Diri (Resign)',
  seoTitle: 'Buat Surat Pengunduran Diri (Resign) yang Sopan, PDF',
  deskripsi:
    'Surat resign yang sopan dan profesional: isi jabatan, perusahaan, dan hari kerja terakhir. Ada pengingat pemberitahuan 30 hari.',
  tanggalDi: 'atas',
  kolom: [
    kolomNama(),
    {
      id: 'jabatan',
      label: 'Jabatan',
      wajib: true,
      contoh: 'Staf Administrasi',
    },
    {
      id: 'perusahaan',
      label: 'Nama perusahaan',
      wajib: true,
      contoh: 'PT Maju Bersama',
    },
    {
      id: 'penerima',
      label: 'Ditujukan kepada',
      wajib: true,
      contoh: 'Manajer HRD',
    },
    {
      id: 'tanggalTerakhir',
      label: 'Hari kerja terakhir',
      jenis: 'tanggal',
      wajib: true,
      contoh: '2026-12-11',
    },
    {
      id: 'alasan',
      label: 'Alasan (opsional, singkat)',
      placeholder: 'mis. ingin melanjutkan pendidikan',
    },
    ...KOTA_TANGGAL,
  ],
  peringatan: (nilai) => {
    const surat = nilai['tanggal'];
    const terakhir = nilai['tanggalTerakhir'];
    if (!surat || !terakhir) return [];
    const selisih = hari(terakhir) - hari(surat);
    return selisih < 30
      ? [
          `Hari terakhir hanya ${Math.max(0, Math.round(selisih))} hari dari tanggal surat. PP 35/2021 meminta pengunduran diri diajukan paling lambat 30 hari sebelumnya agar hak (mis. uang penggantian hak) tetap aman. Cek juga perjanjian kerja Anda.`,
        ]
      : [];
  },
  kepada: ['Yth. {{penerima}}', '{{perusahaan}}'],
  perihal: 'Pengunduran Diri',
  isi: [
    { p: 'Dengan hormat,' },
    { p: 'Saya yang bertanda tangan di bawah ini:' },
    {
      tabel: [
        ['Nama', '{{nama}}'],
        ['Jabatan', '{{jabatan}}'],
      ],
    },
    {
      p: 'dengan ini mengajukan pengunduran diri dari jabatan saya di {{perusahaan}}, dengan hari kerja terakhir pada {{tanggalTerakhir}}.',
    },
    { p: 'Keputusan ini saya ambil karena {{alasan}}.', jika: 'alasan' },
    {
      p: 'Saya mengucapkan terima kasih atas kesempatan, bimbingan, dan pengalaman selama bekerja di {{perusahaan}}. Sampai hari terakhir, saya akan menyelesaikan tanggung jawab dan serah terima pekerjaan dengan baik.',
    },
    {
      p: 'Demikian surat pengunduran diri ini saya sampaikan. Mohon maaf atas segala kekurangan selama saya bekerja.',
    },
  ],
  salam: 'Hormat saya,',
  ttd: [{ nama: '{{nama}}' }],
  struktur: [
    'Tempat, tanggal, dan tujuan surat (atasan langsung atau HRD).',
    'Identitas dan jabatan.',
    'Pernyataan mengundurkan diri dan hari kerja terakhir yang jelas.',
    'Ucapan terima kasih dan komitmen serah terima pekerjaan.',
    'Penutup, tanda tangan, dan nama jelas.',
  ],
  faqs: [
    {
      q: 'Berapa lama sebelumnya surat resign harus diajukan?',
      a: 'PP 35/2021 Pasal 36 menyebut pekerja yang mengundurkan diri mengajukan permohonan tertulis paling lambat 30 hari sebelum tanggal mulai pengunduran diri. Perjanjian kerja bisa mengatur lebih rinci.',
    },
    {
      q: 'Apakah alasan resign wajib ditulis?',
      a: 'Tidak wajib. Bila ditulis, cukup singkat dan positif.',
    },
    {
      q: 'Apakah karyawan resign dapat pesangon?',
      a: 'Umumnya tidak mendapat pesangon, tetapi berhak atas uang penggantian hak dan uang pisah sesuai perjanjian kerja. Hitung di Kalkulator Pesangon.',
    },
  ],
};
