import type { SuratTemplate } from './types';
import { KOLOM_NIK, KOTA_TANGGAL, kolomAlamat, kolomNama } from './umum';

export const SURAT_KUASA: SuratTemplate = {
  slug: 'surat-kuasa',
  nama: 'Surat Kuasa',
  seoTitle: 'Buat Surat Kuasa Otomatis (PDF): Pengambilan BPKB, Dokumen, dll.',
  deskripsi:
    'Buat surat kuasa untuk mengambil dokumen, mengurus administrasi, atau keperluan lain. Isi data pemberi dan penerima kuasa, unduh PDF.',
  tanggalDi: 'ttd',
  catatanHukum: true,
  meterai: {
    bawaan: true,
    catatan:
      'Surat kuasa yang dipakai sebagai bukti biasanya diberi meterai Rp10.000 (UU 10/2020). Tempel meterai di kotak tanda tangan pemberi kuasa.',
  },
  kolom: [
    kolomNama('Nama pemberi kuasa'),
    { ...KOLOM_NIK, label: 'NIK pemberi kuasa', wajib: true },
    kolomAlamat('Alamat pemberi kuasa'),
    {
      id: 'namaPenerima',
      label: 'Nama penerima kuasa',
      wajib: true,
      contoh: 'Dimas Pratama',
    },
    {
      id: 'nikPenerima',
      label: 'NIK penerima kuasa',
      wajib: true,
      placeholder: '16 digit',
      contoh: '3273010202920002',
    },
    {
      id: 'alamatPenerima',
      label: 'Alamat penerima kuasa',
      jenis: 'panjang',
      wajib: true,
      contoh: 'Jl. Dago No. 25, Kota Bandung',
    },
    {
      id: 'keperluan',
      label: 'Keperluan (diawali kata kerja)',
      jenis: 'panjang',
      wajib: true,
      contoh:
        'mengambil BPKB sepeda motor Honda Beat nomor polisi D 1234 ABC di kantor PT Leasing Contoh cabang Bandung',
      bantuan:
        'Tulis sejelas mungkin: apa, di mana, dan nomor dokumen bila ada.',
    },
    ...KOTA_TANGGAL,
  ],
  judul: 'SURAT KUASA',
  isi: [
    { p: 'Yang bertanda tangan di bawah ini:' },
    {
      tabel: [
        ['Nama', '{{nama}}'],
        ['NIK', '{{nik}}'],
        ['Alamat', '{{alamat}}'],
      ],
    },
    {
      p: 'selanjutnya disebut Pemberi Kuasa, dengan ini memberikan kuasa kepada:',
    },
    {
      tabel: [
        ['Nama', '{{namaPenerima}}'],
        ['NIK', '{{nikPenerima}}'],
        ['Alamat', '{{alamatPenerima}}'],
      ],
    },
    { p: 'selanjutnya disebut Penerima Kuasa.' },
    {
      p: 'Penerima Kuasa diberi wewenang untuk bertindak atas nama Pemberi Kuasa untuk {{keperluan}}.',
    },
    {
      p: 'Demikian surat kuasa ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.',
    },
  ],
  ttd: [
    { label: 'Penerima Kuasa', nama: '{{namaPenerima}}' },
    { label: 'Pemberi Kuasa', nama: '{{nama}}', meterai: true },
  ],
  struktur: [
    'Judul SURAT KUASA di tengah.',
    'Identitas pemberi kuasa (nama, NIK, alamat).',
    'Identitas penerima kuasa.',
    'Isi kuasa yang spesifik: apa yang boleh dilakukan, di mana, dan dokumen apa.',
    'Tempat, tanggal, tanda tangan kedua pihak; meterai di tanda tangan pemberi kuasa.',
  ],
  faqs: [
    {
      q: 'Apakah surat kuasa wajib bermeterai?',
      a: 'Meterai bukan syarat sah surat, tetapi diperlukan bila surat dipakai sebagai alat bukti di pengadilan (UU 10/2020). Banyak instansi juga memintanya, jadi sebaiknya ditempel.',
    },
    {
      q: 'Apa beda surat kuasa umum dan khusus?',
      a: 'Kuasa khusus menyebut satu urusan tertentu (mis. mengambil BPKB tertentu). Instansi biasanya meminta kuasa khusus. Template ini berbentuk kuasa khusus.',
    },
    {
      q: 'Dokumen apa yang dibawa penerima kuasa?',
      a: 'Umumnya surat kuasa asli, KTP asli penerima, dan fotokopi KTP pemberi kuasa. Cek syarat instansi yang dituju.',
    },
  ],
};
