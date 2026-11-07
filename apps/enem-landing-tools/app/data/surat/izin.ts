import type { SuratTemplate } from './types';
import { KOTA_TANGGAL, kolomNama } from './umum';
import { formatTanggal } from '../../utils/surat/format';

export const SURAT_IZIN: SuratTemplate = {
  slug: 'izin-tidak-masuk',
  nama: 'Surat Izin Tidak Masuk',
  seoTitle: 'Buat Surat Izin Tidak Masuk Kerja atau Sekolah (PDF)',
  deskripsi:
    'Surat izin tidak masuk kerja atau sekolah karena sakit atau keperluan keluarga. Isi tanggal dan alasan, surat langsung jadi.',
  tanggalDi: 'atas',
  kolom: [
    {
      id: 'jenis',
      label: 'Izin untuk',
      jenis: 'pilihan',
      wajib: true,
      pilihan: [
        { value: 'kerja', label: 'Tidak masuk kerja' },
        { value: 'sekolah', label: 'Tidak masuk sekolah (oleh orang tua)' },
      ],
      contoh: 'kerja',
    },
    {
      id: 'namaOrtu',
      label: 'Nama orang tua/wali',
      wajib: true,
      tampilJika: 'jenis=sekolah',
      contoh: 'Budi Santoso',
    },
    kolomNama('Nama karyawan atau siswa'),
    {
      id: 'jabatan',
      label: 'Jabatan/divisi atau kelas',
      contoh: 'Staf Keuangan',
    },
    {
      id: 'penerima',
      label: 'Ditujukan kepada',
      wajib: true,
      placeholder: 'mis. Manajer HRD / Wali Kelas 8B',
      contoh: 'Manajer HRD',
    },
    {
      id: 'instansi',
      label: 'Nama perusahaan atau sekolah',
      wajib: true,
      contoh: 'PT Maju Bersama',
    },
    {
      id: 'tanggalMulai',
      label: 'Tidak masuk mulai',
      jenis: 'tanggal',
      wajib: true,
      contoh: '2026-11-09',
    },
    {
      id: 'tanggalSelesai',
      label: 'Sampai (kosongkan bila satu hari)',
      jenis: 'tanggal',
    },
    {
      id: 'alasan',
      label: 'Alasan',
      wajib: true,
      placeholder: 'mis. sakit demam dan perlu beristirahat',
      contoh: 'sakit demam dan perlu beristirahat sesuai anjuran dokter',
    },
    ...KOTA_TANGGAL,
  ],
  turunan: (nilai) => ({
    rentang: !nilai['tanggalMulai']
      ? '[Tidak masuk mulai]'
      : nilai['tanggalSelesai'] &&
          nilai['tanggalSelesai'] !== nilai['tanggalMulai']
        ? `tanggal ${formatTanggal(nilai['tanggalMulai'] ?? '')} sampai ${formatTanggal(nilai['tanggalSelesai'])}`
        : `hari ${formatTanggal(nilai['tanggalMulai'] ?? '', true)}`,
  }),
  kepada: ['Yth. {{penerima}}', '{{instansi}}'],
  perihal: 'Izin Tidak Masuk',
  isi: [
    { p: 'Dengan hormat,' },
    { p: 'Saya yang bertanda tangan di bawah ini:', kecuali: 'jenis=sekolah' },
    { p: 'Saya selaku orang tua/wali dari:', jika: 'jenis=sekolah' },
    {
      tabel: [
        ['Nama', '{{nama}}'],
        ['Jabatan/Kelas', '{{jabatan}}'],
      ],
    },
    {
      p: 'memberitahukan bahwa saya tidak dapat masuk kerja pada {{rentang}} karena {{alasan}}.',
      kecuali: 'jenis=sekolah',
    },
    {
      p: 'memberitahukan bahwa anak kami tidak dapat mengikuti kegiatan belajar pada {{rentang}} karena {{alasan}}.',
      jika: 'jenis=sekolah',
    },
    {
      p: 'Demikian surat izin ini saya sampaikan. Atas perhatian dan izin yang diberikan, saya ucapkan terima kasih.',
    },
  ],
  salam: 'Hormat saya,',
  ttd: [
    { nama: '{{nama}}', kecuali: 'jenis=sekolah' },
    { label: 'Orang tua/wali', nama: '{{namaOrtu}}', jika: 'jenis=sekolah' },
  ],
  struktur: [
    'Tempat dan tanggal, lalu tujuan surat (atasan/HRD atau wali kelas).',
    'Identitas yang izin.',
    'Tanggal tidak masuk dan alasan yang singkat dan jelas.',
    'Penutup, tanda tangan, dan nama jelas.',
  ],
  faqs: [
    {
      q: 'Apakah perlu surat dokter?',
      a: 'Untuk izin sakit lebih dari satu atau dua hari, banyak perusahaan dan sekolah meminta surat keterangan dokter. Lampirkan bila ada.',
    },
    {
      q: 'Bisa dikirim lewat WhatsApp?',
      a: 'Bisa bila kantor atau sekolah menerimanya. Unduh PDF atau salin teksnya ke pesan.',
    },
  ],
};
