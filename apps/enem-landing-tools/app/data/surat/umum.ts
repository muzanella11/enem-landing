import type { Kolom } from './types';

/** Fields shared by most letters; saved once and reused across letter types. */
export const KOTA_TANGGAL: Kolom[] = [
  {
    id: 'kota',
    label: 'Kota tempat surat dibuat',
    wajib: true,
    contoh: 'Bandung',
  },
  { id: 'tanggal', label: 'Tanggal surat', jenis: 'tanggal', wajib: true },
];

export const kolomNama = (label = 'Nama lengkap'): Kolom => ({
  id: 'nama',
  label,
  wajib: true,
  contoh: 'Rina Kartika Sari',
});
export const KOLOM_NIK: Kolom = {
  id: 'nik',
  label: 'NIK',
  placeholder: '16 digit',
  contoh: '3273010101900001',
};
export const KOLOM_TTL: Kolom[] = [
  { id: 'tempatLahir', label: 'Tempat lahir', contoh: 'Garut' },
  {
    id: 'tanggalLahir',
    label: 'Tanggal lahir',
    jenis: 'tanggal',
    contoh: '1998-04-12',
  },
];
export const kolomAlamat = (label = 'Alamat'): Kolom => ({
  id: 'alamat',
  label,
  jenis: 'panjang',
  wajib: true,
  contoh:
    'Jl. Merdeka No. 10, RT 02/RW 05, Kel. Citarum, Kec. Bandung Wetan, Kota Bandung',
});
