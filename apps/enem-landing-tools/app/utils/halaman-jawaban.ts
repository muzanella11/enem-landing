import { calculateYear, type PayrollInput } from './payroll';
import { hitungThr, pajakThr } from './payroll/thr';

/** Numbers for the data-driven answer pages (Story 49). Same functions as the calculators. */
const dasar = (gajiPokok: number): Omit<PayrollInput, 'ptkp'> => ({
  gajiPokok,
  tunjanganTetap: 0,
  tunjanganTidakTetap: 0,
  jkkRiskIndex: 0,
  ikutBpjsKesehatan: true,
  ikutBpjsKetenagakerjaan: true,
  thr: 0,
  thrMonth: 3,
});

export const STATUS_JAWABAN = ['TK/0', 'K/0', 'K/1', 'K/2', 'K/3'] as const;

export const gajiBersihPerStatus = (gajiPokok: number) =>
  STATUS_JAWABAN.map((ptkp) => {
    const tahun = calculateYear({ ...dasar(gajiPokok), ptkp });
    return {
      ptkp,
      januari: tahun.months[0]!.takeHomePay,
      pph21Januari: tahun.months[0]!.pph21,
      bpjs: tahun.months[0]!.employee.total,
      desember: tahun.months[11]!.takeHomePay,
      rataRata: Math.round(tahun.totals.takeHomePay / 12),
    };
  });

export const thrPerMasaKerja = (upah: number) =>
  [1, 3, 6, 9, 11, 12].map((bulan) => ({
    bulan,
    thr: hitungThr(bulan, upah).thr,
  }));

/** Extra PPh 21 when a full THR is paid in March, TK/0 (TER, PMK 168/2023). */
export const pajakThrPenuh = (upah: number) =>
  pajakThr({ ...dasar(upah), ptkp: 'TK/0' }, upah, 3);
