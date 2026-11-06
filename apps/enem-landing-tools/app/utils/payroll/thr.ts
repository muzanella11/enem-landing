import { calculateMonth, type PayrollInput } from './index';

/**
 * THR per Permenaker 6/2016 (Story 26), plus the PPh 21 effect in the month
 * it is paid, using the TER calculator from Story 20.
 */

export type StatusPekerja = 'tetap' | 'harian';

/** Whole months from `mulai` to `sampai` (both YYYY-MM-DD), never negative. */
export const masaKerjaBulan = (mulai: string, sampai: string): number => {
  const [y1, m1, d1] = mulai.split('-').map(Number) as [number, number, number];
  const [y2, m2, d2] = sampai.split('-').map(Number) as [
    number,
    number,
    number,
  ];
  let months = (y2 - y1) * 12 + (m2 - m1);
  if (d2 < d1) months -= 1;
  return Math.max(0, months);
};

export interface ThrResult {
  berhak: boolean;
  masaKerja: number;
  proporsional: boolean;
  thr: number;
}

/**
 * `upah` is pokok + tunjangan tetap (or the average monthly pay for daily
 * workers, computed by the caller).
 */
export const hitungThr = (masaKerja: number, upah: number): ThrResult => {
  if (masaKerja < 1)
    return { berhak: false, masaKerja, proporsional: false, thr: 0 };
  if (masaKerja >= 12)
    return {
      berhak: true,
      masaKerja,
      proporsional: false,
      thr: Math.round(upah),
    };
  return {
    berhak: true,
    masaKerja,
    proporsional: true,
    thr: Math.round((masaKerja / 12) * upah),
  };
};

/** Average of the given monthly pay amounts (daily workers). */
export const rataRataUpah = (upahBulanan: number[]): number => {
  const valid = upahBulanan.filter((value) => value > 0);
  return valid.length
    ? valid.reduce((sum, value) => sum + value, 0) / valid.length
    : 0;
};

export interface ThrPajakResult {
  pph21DenganThr: number;
  pph21TanpaThr: number;
  tambahanPph21: number;
  thrBersih: number;
  bulan: number;
}

/** Extra PPh 21 in the payment month and the THR left after it. */
export const pajakThr = (
  payroll: Omit<PayrollInput, 'thr' | 'thrMonth'>,
  thr: number,
  bulan: number,
): ThrPajakResult => {
  const dengan = calculateMonth({ ...payroll, thr, thrMonth: bulan }, bulan);
  const tanpa = calculateMonth({ ...payroll, thr: 0, thrMonth: bulan }, bulan);
  const tambahan = dengan.pph21 - tanpa.pph21;
  return {
    pph21DenganThr: dengan.pph21,
    pph21TanpaThr: tanpa.pph21,
    tambahanPph21: tambahan,
    thrBersih: thr - tambahan,
    bulan,
  };
};

/** Latest payment date: 7 days before the holiday (YYYY-MM-DD). */
export const batasBayarThr = (hariRaya: string): string => {
  const [y, m, d] = hariRaya.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d - 7));
  return date.toISOString().slice(0, 10);
};
