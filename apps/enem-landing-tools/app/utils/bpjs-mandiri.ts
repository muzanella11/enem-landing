import { DENDA_PELAYANAN, IURAN_MANDIRI } from '../data/bpjs-mandiri';

/** Story 44: family contribution, arrears, and inpatient service penalty. */
export const iuranKeluarga = (anggota: Record<1 | 2 | 3, number>) =>
  IURAN_MANDIRI.reduce(
    (sum, item) =>
      sum + item.dibayarPeserta * Math.max(0, anggota[item.kelas] || 0),
    0,
  );

export const hitungTunggakan = (iuranPerBulan: number, bulanTunggak: number) =>
  iuranPerBulan *
  Math.min(
    DENDA_PELAYANAN.maksBulanTunggakanDibayar,
    Math.max(0, bulanTunggak),
  );

/** Penalty when hospitalised within 45 days of reactivation. */
export const dendaPelayanan = (
  biayaDiagnosaAwal: number,
  bulanTunggak: number,
) =>
  Math.min(
    DENDA_PELAYANAN.maksRupiah,
    Math.round(
      DENDA_PELAYANAN.persen *
        Math.max(0, biayaDiagnosaAwal) *
        Math.min(DENDA_PELAYANAN.maksBulan, Math.max(0, bulanTunggak)),
    ),
  );
