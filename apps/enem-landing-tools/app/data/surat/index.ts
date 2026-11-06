import { SURAT_DOMISILI } from './domisili';
import { SURAT_IZIN } from './izin';
import { SURAT_KUASA } from './kuasa';
import { LAMARAN_KERJA } from './lamaran-kerja';
import { SURAT_RESIGN } from './pengunduran-diri';
import { SURAT_PERNYATAAN } from './pernyataan';

export type { Kolom, SuratTemplate } from './types';

export const DAFTAR_SURAT = [
  LAMARAN_KERJA,
  SURAT_PERNYATAAN,
  SURAT_KUASA,
  SURAT_IZIN,
  SURAT_RESIGN,
  SURAT_DOMISILI,
];

export const findSurat = (slug: string) =>
  DAFTAR_SURAT.find((surat) => surat.slug === slug);
