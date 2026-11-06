import type { SuratTemplate } from './types';
import {
  KOLOM_NIK,
  KOLOM_TTL,
  KOTA_TANGGAL,
  kolomAlamat,
  kolomNama,
} from './umum';

export const SURAT_PERNYATAAN: SuratTemplate = {
  slug: 'surat-pernyataan',
  nama: 'Surat Pernyataan',
  seoTitle: 'Buat Surat Pernyataan Otomatis (PDF, Format dan Contoh)',
  deskripsi:
    'Buat surat pernyataan untuk lamaran CPNS, beasiswa, kerja, atau keperluan lain. Tulis poin pernyataan, unduh PDF dengan kotak meterai.',
  tanggalDi: 'ttd',
  catatanHukum: true,
  meterai: {
    bawaan: true,
    catatan:
      'Surat pernyataan umumnya diberi meterai Rp10.000. Tempel meterai lalu tanda tangan di atasnya, sebagian di meterai dan sebagian di kertas.',
  },
  kolom: [
    kolomNama(),
    KOLOM_NIK,
    ...KOLOM_TTL,
    { id: 'pekerjaan', label: 'Pekerjaan', contoh: 'Karyawan swasta' },
    kolomAlamat(),
    {
      id: 'pernyataan',
      label: 'Isi pernyataan (satu poin per baris)',
      jenis: 'panjang',
      wajib: true,
      contoh:
        'Data yang saya sampaikan dalam berkas pendaftaran adalah benar.\nSaya tidak sedang menerima beasiswa dari pihak lain.\nSaya bersedia menerima sanksi apabila pernyataan ini tidak benar.',
    },
    ...KOTA_TANGGAL,
  ],
  judul: 'SURAT PERNYATAAN',
  isi: [
    { p: 'Yang bertanda tangan di bawah ini:' },
    {
      tabel: [
        ['Nama', '{{nama}}'],
        ['NIK', '{{nik}}'],
        ['Tempat, tanggal lahir', '{{tempatLahir}}, {{tanggalLahir}}'],
        ['Pekerjaan', '{{pekerjaan}}'],
        ['Alamat', '{{alamat}}'],
      ],
    },
    { p: 'dengan ini menyatakan bahwa:' },
    { daftar: 'pernyataan' },
    {
      p: 'Demikian surat pernyataan ini saya buat dengan sebenar-benarnya, dalam keadaan sadar dan tanpa paksaan dari pihak mana pun, untuk dipergunakan sebagaimana mestinya.',
    },
  ],
  ttd: [{ label: 'Yang membuat pernyataan', nama: '{{nama}}', meterai: true }],
  struktur: [
    'Judul SURAT PERNYATAAN di tengah.',
    'Identitas yang membuat pernyataan.',
    'Isi pernyataan, sebaiknya berupa poin bernomor yang jelas.',
    'Kalimat penutup bahwa pernyataan dibuat dengan sadar tanpa paksaan.',
    'Tempat, tanggal, meterai, tanda tangan, dan nama jelas.',
  ],
  faqs: [
    {
      q: 'Apakah surat pernyataan harus bermeterai?',
      a: 'Tidak selalu. Meterai diperlukan bila surat dipakai sebagai alat bukti perdata; banyak instansi (mis. pendaftaran CPNS) mewajibkannya. Ikuti syarat dari instansi yang meminta.',
    },
    {
      q: 'Apakah isi pernyataan boleh bebas?',
      a: 'Boleh, asalkan benar dan tidak melanggar hukum. Bila instansi memberi format sendiri, pakai format mereka.',
    },
  ],
};
