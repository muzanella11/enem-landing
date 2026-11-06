import {
  bungaKur,
  JENIS_KUR,
  type JenisKur,
  type SektorKur,
} from '../data/kur';
import { calculateLoan } from './loan';

/** KUR simulation (Story 52): annuity with the effective rate, like the banks' tables. */
export const jenisDariPlafon = (plafon: number): JenisKur =>
  plafon <= 10_000_000
    ? 'super-mikro'
    : plafon <= 100_000_000
      ? 'mikro'
      : 'kecil';

export const simulasiKur = (input: {
  plafon: number;
  tenorBulan: number;
  tujuan: 'modal-kerja' | 'investasi';
  sektor: SektorKur;
  urutan: number;
}) => {
  const jenis = jenisDariPlafon(input.plafon);
  const aturan = JENIS_KUR.find((j) => j.id === jenis)!;
  const bunga = bungaKur(jenis, input.sektor, input.urutan);
  const tenorMaks =
    input.tujuan === 'investasi'
      ? aturan.tenorInvestasi
      : aturan.tenorModalKerja;
  const peringatan: string[] = [];
  if (input.plafon > 500_000_000)
    peringatan.push('Plafon KUR paling tinggi Rp500 juta.');
  if (input.tenorBulan > tenorMaks)
    peringatan.push(
      `Tenor ${aturan.label} untuk ${input.tujuan === 'investasi' ? 'investasi' : 'modal kerja'} paling lama ${tenorMaks} bulan.`,
    );
  const hasil = calculateLoan({
    principal: input.plafon,
    tenorMonths: input.tenorBulan,
    periods: [{ months: input.tenorBulan, annualRate: bunga }],
    method: 'anuitas',
  });
  return {
    jenis,
    aturan,
    bunga,
    tenorMaks,
    peringatan,
    ...hasil,
    angsuran: hasil.schedule[0]?.payment ?? 0,
  };
};
