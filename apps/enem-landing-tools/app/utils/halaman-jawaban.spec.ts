import { describe, expect, it } from 'vitest';
import {
  gajiBersihPerStatus,
  pajakThrPenuh,
  thrPerMasaKerja,
} from './halaman-jawaban.js';
import { calculateYear } from './payroll/index.js';

describe('answer pages use the calculator functions', () => {
  it('gaji 5 juta TK/0 equals the calculator', () => {
    const [tk0] = gajiBersihPerStatus(5_000_000);
    const year = calculateYear({
      gajiPokok: 5_000_000,
      tunjanganTetap: 0,
      tunjanganTidakTetap: 0,
      ptkp: 'TK/0',
      jkkRiskIndex: 0,
      ikutBpjsKesehatan: true,
      ikutBpjsKetenagakerjaan: true,
      thr: 0,
      thrMonth: 3,
    });
    expect(tk0!.januari).toBe(year.months[0]!.takeHomePay);
    // 5jt: TER A 0% at <= 5,4jt; BPJS 1% + 2% + 1% = 200.000
    expect(tk0!.pph21Januari).toBe(0);
    expect(tk0!.januari).toBe(4_800_000);
  });

  it('THR pro rata and tax', () => {
    expect(thrPerMasaKerja(6_000_000)).toEqual([
      { bulan: 1, thr: 500_000 },
      { bulan: 3, thr: 1_500_000 },
      { bulan: 6, thr: 3_000_000 },
      { bulan: 9, thr: 4_500_000 },
      { bulan: 11, thr: 5_500_000 },
      { bulan: 12, thr: 6_000_000 },
    ]);
    const pajak = pajakThrPenuh(6_000_000);
    expect(pajak.thrBersih).toBe(6_000_000 - pajak.tambahanPph21);
    expect(pajak.tambahanPph21).toBeGreaterThan(0);
  });
});
