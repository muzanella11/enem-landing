import type { SuratTemplate } from './types';
import {
  KOLOM_NIK,
  KOLOM_TTL,
  KOTA_TANGGAL,
  kolomAlamat,
  kolomNama,
} from './umum';

export const SURAT_DOMISILI: SuratTemplate = {
  slug: 'permohonan-keterangan-domisili',
  nama: 'Surat Permohonan Keterangan Domisili',
  seoTitle: 'Buat Surat Permohonan Keterangan Domisili ke RT/RW (PDF)',
  deskripsi:
    'Surat permohonan pengantar keterangan domisili untuk diajukan ke Ketua RT/RW, mis. untuk buka rekening, melamar kerja, atau sekolah.',
  tanggalDi: 'atas',
  kolom: [
    kolomNama(),
    { ...KOLOM_NIK, wajib: true },
    ...KOLOM_TTL,
    {
      id: 'jenisKelamin',
      label: 'Jenis kelamin',
      jenis: 'pilihan',
      pilihan: [
        { value: 'Laki-laki', label: 'Laki-laki' },
        { value: 'Perempuan', label: 'Perempuan' },
      ],
      contoh: 'Perempuan',
    },
    { id: 'pekerjaan', label: 'Pekerjaan', contoh: 'Karyawan swasta' },
    kolomAlamat('Alamat domisili saat ini'),
    { id: 'rt', label: 'RT', wajib: true, contoh: '02' },
    { id: 'rw', label: 'RW', wajib: true, contoh: '05' },
    {
      id: 'kelurahan',
      label: 'Kelurahan/desa',
      wajib: true,
      contoh: 'Citarum',
    },
    {
      id: 'keperluan',
      label: 'Keperluan',
      wajib: true,
      placeholder: 'mis. membuka rekening bank',
      contoh: 'melengkapi berkas lamaran kerja',
    },
    ...KOTA_TANGGAL,
  ],
  kepada: ['Yth. Ketua RT {{rt}} / RW {{rw}}', 'Kelurahan/Desa {{kelurahan}}'],
  perihal: 'Permohonan Surat Keterangan Domisili',
  isi: [
    { p: 'Dengan hormat,' },
    { p: 'Saya yang bertanda tangan di bawah ini:' },
    {
      tabel: [
        ['Nama', '{{nama}}'],
        ['NIK', '{{nik}}'],
        ['Tempat, tanggal lahir', '{{tempatLahir}}, {{tanggalLahir}}'],
        ['Jenis kelamin', '{{jenisKelamin}}'],
        ['Pekerjaan', '{{pekerjaan}}'],
        ['Alamat', '{{alamat}}'],
      ],
    },
    {
      p: 'dengan ini mengajukan permohonan surat pengantar keterangan domisili karena saya benar bertempat tinggal di alamat tersebut. Surat keterangan ini akan saya gunakan untuk {{keperluan}}.',
    },
    {
      p: 'Sebagai kelengkapan, bersama ini saya lampirkan fotokopi KTP dan Kartu Keluarga.',
    },
    {
      p: 'Demikian permohonan ini saya sampaikan. Atas perhatian dan bantuan Bapak/Ibu, saya ucapkan terima kasih.',
    },
  ],
  salam: 'Hormat saya,',
  ttd: [{ label: 'Pemohon', nama: '{{nama}}' }],
  struktur: [
    'Tujuan surat: Ketua RT/RW setempat.',
    'Identitas pemohon sesuai KTP.',
    'Permohonan dan keperluan surat domisili.',
    'Lampiran (fotokopi KTP dan KK), penutup, tanda tangan.',
  ],
  faqs: [
    {
      q: 'Ke mana surat ini dibawa setelah ditandatangani RT/RW?',
      a: 'Surat pengantar RT/RW biasanya dibawa ke kantor kelurahan/desa untuk diterbitkan surat keterangan domisili. Prosedurnya bisa berbeda per daerah.',
    },
    {
      q: 'Apakah perlu meterai?',
      a: 'Umumnya tidak untuk surat permohonan pengantar. Ikuti permintaan kelurahan bila berbeda.',
    },
  ],
};
