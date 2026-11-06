import { describe, expect, it } from 'vitest';
import { PAYROLL_RULES_2026 } from '../../data/tax/2026.js';
import {
  calculateBpjs,
  calculateMonth,
  calculateYear,
  getPtkp,
  getTerCategory,
  getTerRate,
  pasal17Tax,
  type PayrollInput,
} from './index.js';

const base: PayrollInput = {
  gajiPokok: 10_000_000,
  tunjanganTetap: 0,
  tunjanganTidakTetap: 0,
  ptkp: 'TK/0',
  jkkRiskIndex: 0,
  ikutBpjsKesehatan: false,
  ikutBpjsKetenagakerjaan: false,
  thr: 0,
  thrMonth: 4,
};

describe('PTKP and TER category', () => {
  it.each([
    ['TK/0', 54_000_000, 'A'],
    ['TK/1', 58_500_000, 'A'],
    ['K/0', 58_500_000, 'A'],
    ['TK/2', 63_000_000, 'B'],
    ['K/1', 63_000_000, 'B'],
    ['TK/3', 67_500_000, 'B'],
    ['K/2', 67_500_000, 'B'],
    ['K/3', 72_000_000, 'C'],
  ] as const)('%s -> PTKP %d, kategori %s', (status, ptkp, category) => {
    expect(getPtkp(status)).toBe(ptkp);
    expect(getTerCategory(status)).toBe(category);
  });
});

describe('getTerRate', () => {
  it('uses inclusive upper bounds', () => {
    expect(getTerRate('A', 5_400_000)).toBe(0);
    expect(getTerRate('A', 5_400_001)).toBe(0.25);
    expect(getTerRate('A', 10_000_000)).toBe(2);
  });

  it('differs per category for the same gross', () => {
    expect(getTerRate('A', 7_000_000)).toBe(1.25);
    expect(getTerRate('B', 7_000_000)).toBe(0.75);
    expect(getTerRate('C', 7_000_000)).toBe(0.5);
  });

  it('tops out at 34%', () => {
    expect(getTerRate('A', 2_000_000_000)).toBe(34);
    expect(getTerRate('B', 2_000_000_000)).toBe(34);
    expect(getTerRate('C', 2_000_000_000)).toBe(34);
  });

  it('every table ends in Infinity and increases monotonically', () => {
    for (const table of Object.values(PAYROLL_RULES_2026.ter)) {
      expect(table[table.length - 1]?.[0]).toBe(Infinity);
      for (let index = 1; index < table.length; index += 1) {
        expect(table[index]![0]).toBeGreaterThan(table[index - 1]![0]);
        expect(table[index]![1]).toBeGreaterThan(table[index - 1]![1]);
      }
    }
  });
});

describe('pasal17Tax', () => {
  it.each([
    [0, 0],
    [60_000_000, 3_000_000],
    [100_000_000, 3_000_000 + 6_000_000],
    [600_000_000, 3_000_000 + 28_500_000 + 62_500_000 + 30_000_000],
  ])('PKP %d -> %d', (pkp, tax) => {
    expect(pasal17Tax(pkp)).toBe(tax);
  });
});

describe('calculateBpjs', () => {
  it('applies the BPJS Kesehatan and JP wage caps', () => {
    const { employee, employer } = calculateBpjs({
      ...base,
      gajiPokok: 20_000_000,
      ikutBpjsKesehatan: true,
      ikutBpjsKetenagakerjaan: true,
    });
    expect(employee.kesehatan).toBe(120_000); // 1% x 12 jt cap
    expect(employer.kesehatan).toBe(480_000); // 4% x 12 jt cap
    expect(employee.jp).toBe(105_474); // 1% x 10.547.400 cap
    expect(employer.jp).toBe(210_948);
    expect(employee.jht).toBe(400_000); // JHT has no cap
    expect(employer.jkk).toBe(48_000); // 0,24%
    expect(employer.jkm).toBe(60_000); // 0,3%
  });

  it('is zero when not enrolled', () => {
    const { employee, employer } = calculateBpjs(base);
    expect(employee.total).toBe(0);
    expect(employer.total).toBe(0);
  });
});

describe('calculateYear', () => {
  it('uses TER Jan-Nov: TK/0 Rp10 jt without BPJS -> 2%', () => {
    const result = calculateMonth(base, 1);
    expect(result.terCategory).toBe('A');
    expect(result.terRate).toBe(2);
    expect(result.pph21).toBe(200_000);
    expect(result.takeHomePay).toBe(9_800_000);
  });

  it('includes employer-paid premiums in the TER gross', () => {
    const result = calculateMonth(
      { ...base, ikutBpjsKesehatan: true, ikutBpjsKetenagakerjaan: true },
      1,
    );
    // 10 jt + Kes 400.000 + JKK 24.000 + JKM 30.000
    expect(result.bruto).toBe(10_454_000);
    expect(result.terRate).toBe(2.5);
    expect(result.pph21).toBe(261_350);
  });

  it('total PPh 21 over the year equals the Pasal 17 annual tax', () => {
    const year = calculateYear({ ...base, ptkp: 'K/1', thr: 10_000_000 });
    expect(year.totals.pph21).toBe(year.december.pph21Setahun);
  });

  it('December can be an underpayment (THR month pushes TER up only once)', () => {
    const year = calculateYear(base);
    // 120 jt bruto, biaya jabatan 6 jt, PTKP 54 jt -> PKP 60 jt -> 3 jt.
    expect(year.december.pkp).toBe(60_000_000);
    expect(year.december.pph21Setahun).toBe(3_000_000);
    expect(year.december.pph21JanNov).toBe(11 * 200_000);
    expect(year.december.pph21Desember).toBe(800_000);
  });

  it('December can be an overpayment, which is refunded (THP goes up)', () => {
    // A big THR in a TER month withholds at a high rate once.
    const year = calculateYear({
      ...base,
      gajiPokok: 6_000_000,
      thr: 60_000_000,
      thrMonth: 3,
    });
    expect(year.december.pph21Desember).toBeLessThan(0);
    const december = year.months[11]!;
    expect(december.takeHomePay).toBeGreaterThan(december.cashIncome);
  });

  it('THR raises that month TER rate', () => {
    const withThr = calculateMonth(
      { ...base, thr: 10_000_000, thrMonth: 4 },
      4,
    );
    const without = calculateMonth(base, 4);
    expect(withThr.bruto).toBe(20_000_000);
    expect(withThr.terRate).toBe(9);
    expect(withThr.pph21).toBe(1_800_000);
    expect(without.pph21).toBe(200_000);
  });

  it('salary below PTKP pays no tax all year', () => {
    const year = calculateYear({ ...base, gajiPokok: 4_000_000 });
    expect(year.totals.pph21).toBe(0);
    expect(year.december.pkp).toBe(0);
  });

  it('caps biaya jabatan at 6 jt per year', () => {
    const year = calculateYear({ ...base, gajiPokok: 30_000_000 });
    expect(year.december.biayaJabatan).toBe(6_000_000);
  });

  it('categories B and C use their own tables', () => {
    expect(calculateMonth({ ...base, ptkp: 'K/1' }, 1).terRate).toBe(1.5);
    expect(calculateMonth({ ...base, ptkp: 'K/3' }, 1).terRate).toBe(1.5);
  });
});
