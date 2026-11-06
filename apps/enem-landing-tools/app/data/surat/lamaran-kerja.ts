import type { SuratTemplate } from './types';
import { KOLOM_TTL, KOTA_TANGGAL, kolomAlamat, kolomNama } from './umum';

export const LAMARAN_KERJA: SuratTemplate = {
  slug: 'lamaran-kerja',
  nama: 'Surat Lamaran Kerja',
  seoTitle: 'Buat Surat Lamaran Kerja Otomatis (PDF, Contoh dan Format)',
  deskripsi:
    'Isi data diri dan posisi yang dilamar, surat lamaran kerja yang rapi langsung jadi. Unduh PDF A4/F4 atau salin teksnya.',
  tanggalDi: 'atas',
  kolom: [
    {
      id: 'posisi',
      label: 'Posisi yang dilamar',
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
      id: 'alamatPerusahaan',
      label: 'Alamat perusahaan',
      contoh: 'Jl. Asia Afrika No. 8, Bandung',
    },
    {
      id: 'sumberInfo',
      label: 'Sumber info lowongan',
      placeholder: 'mis. situs karier perusahaan',
      contoh: 'situs karier perusahaan',
    },
    kolomNama(),
    ...KOLOM_TTL,
    {
      id: 'pendidikan',
      label: 'Pendidikan terakhir',
      wajib: true,
      contoh: 'S1 Manajemen, Universitas Padjadjaran',
    },
    kolomAlamat(),
    { id: 'telepon', label: 'Nomor HP', wajib: true, contoh: '0812 3456 7890' },
    { id: 'email', label: 'Email', contoh: 'rina.kartika@email.com' },
    {
      id: 'lampiran',
      label: 'Lampiran (satu per baris)',
      jenis: 'panjang',
      contoh:
        'Daftar riwayat hidup\nFotokopi ijazah dan transkrip nilai\nFotokopi KTP\nPas foto terbaru',
    },
    ...KOTA_TANGGAL,
  ],
  kepada: [
    'Yth. Bapak/Ibu HRD {{perusahaan}}',
    { baris: '{{alamatPerusahaan}}', jika: 'alamatPerusahaan' },
  ],
  perihal: 'Lamaran Pekerjaan sebagai {{posisi}}',
  isi: [
    { p: 'Dengan hormat,' },
    {
      p: 'Berdasarkan informasi lowongan kerja dari {{sumberInfo}}, saya bermaksud melamar posisi {{posisi}} di {{perusahaan}}. Berikut data diri saya:',
      jika: 'sumberInfo',
    },
    {
      p: 'Saya bermaksud melamar posisi {{posisi}} di {{perusahaan}}. Berikut data diri saya:',
      kecuali: 'sumberInfo',
    },
    {
      tabel: [
        ['Nama', '{{nama}}'],
        ['Tempat, tanggal lahir', '{{tempatLahir}}, {{tanggalLahir}}'],
        ['Pendidikan terakhir', '{{pendidikan}}'],
        ['Alamat', '{{alamat}}'],
        ['Nomor HP', '{{telepon}}'],
        ['Email', '{{email}}'],
      ],
    },
    {
      p: 'Saya memiliki minat yang besar pada bidang ini dan siap bekerja dengan sungguh-sungguh serta terus belajar. Sebagai bahan pertimbangan, bersama ini saya lampirkan:',
      jika: 'lampiran',
    },
    { daftar: 'lampiran', jika: 'lampiran' },
    {
      p: 'Besar harapan saya untuk dapat mengikuti tahap seleksi berikutnya. Atas perhatian Bapak/Ibu, saya ucapkan terima kasih.',
    },
  ],
  salam: 'Hormat saya,',
  ttd: [{ nama: '{{nama}}' }],
  struktur: [
    'Tempat dan tanggal di kanan atas, lalu tujuan surat (bagian HRD dan nama perusahaan).',
    'Perihal yang menyebut posisi yang dilamar.',
    'Paragraf pembuka: sumber lowongan dan posisi.',
    'Data diri singkat: nama, tempat tanggal lahir, pendidikan, alamat, kontak.',
    'Alasan singkat dan daftar lampiran.',
    'Penutup, salam, tanda tangan, dan nama jelas.',
  ],
  faqs: [
    {
      q: 'Apakah surat lamaran harus ditulis tangan?',
      a: 'Tidak, kecuali lowongan memintanya. Sebagian besar perusahaan menerima surat lamaran ketikan dalam bentuk PDF.',
    },
    {
      q: 'Berapa panjang surat lamaran yang ideal?',
      a: 'Cukup satu halaman. Detail pengalaman ditaruh di CV, bukan di surat lamaran.',
    },
    {
      q: 'Format file apa yang sebaiknya dikirim?',
      a: 'PDF, agar tampilan tidak berubah di perangkat HRD. Beri nama file yang jelas, mis. Surat-Lamaran-Rina-Kartika.pdf.',
    },
  ],
};
