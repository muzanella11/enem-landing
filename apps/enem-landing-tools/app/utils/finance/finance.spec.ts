import { describe, expect, it } from 'vitest';
import {
  bulananEfektif,
  fv,
  hitungDeposito,
  hitungPensiun,
  nilaiRiil,
  pertumbuhanInvestasi,
  pmt,
  pv,
} from './index.js';

// Reference values of the spreadsheet definitions, e.g. =FV(0,005;120;-1000000;-10000000).
describe('spreadsheet parity', () => {
  it('FV', () => {
    expect(fv(0.005, 120, 1_000_000, 10_000_000)).toBeCloseTo(
      182_073_314.15,
      1,
    );
    expect(fv(0, 12, 100, 50)).toBe(1250);
  });

  it('PV', () => {
    // =PV(0,01;24;-500000) = 10.621.693,63
    expect(pv(0.01, 24, 500_000)).toBeCloseTo(10_621_693.63, 1);
  });

  it('PMT', () => {
    // =PMT(0,005;36;0;100000000) = -2.542.193,75
    expect(pmt(0.005, 36, 100_000_000)).toBeCloseTo(2_542_193.75, 1);
    expect(pmt(0, 10, 1000, 200)).toBe(80);
    expect(pmt(0.01, 12, 100, 1000)).toBe(0);
  });

  it('effective monthly rate and real value', () => {
    expect((1 + bulananEfektif(0.12)) ** 12).toBeCloseTo(1.12, 12);
    expect(nilaiRiil(110, 0.1, 1)).toBeCloseTo(100);
  });
});

describe('deposito', () => {
  it('1-month tenor, 4% p.a., taxed 20%', () => {
    const result = hitungDeposito(100_000_000, 0.04, 1, {
      kenaPajak: true,
      tarifPajak: 0.2,
    });
    expect(result.bungaKotor).toBeCloseTo(333_333.33, 1);
    expect(result.pajak).toBeCloseTo(66_666.67, 1);
    expect(result.bungaBersih).toBeCloseTo(266_666.67, 1);
  });

  it('ARO compounds the net interest', () => {
    const result = hitungDeposito(10_000_000, 0.06, 6, {
      kenaPajak: false,
      tarifPajak: 0.2,
      putaran: 2,
    });
    expect(result.saldoAkhir).toBeCloseTo(10_000_000 * 1.03 ** 2, 2);
  });
});

describe('investasi rutin', () => {
  it('grows from the initial amount, year by year', () => {
    const points = pertumbuhanInvestasi(0, 1_000_000, 0, 2);
    expect(points.map((p) => p.nilai)).toEqual([0, 12_000_000, 24_000_000]);
    expect(pertumbuhanInvestasi(1_000_000, 0, 0.1, 1)[1]!.nilai).toBeCloseTo(
      1_100_000,
      2,
    );
  });
});

describe('pensiun', () => {
  it('zero inflation and zero return: expenses x months', () => {
    const result = hitungPensiun({
      usia: 30,
      usiaPensiun: 55,
      lamaPensiun: 20,
      pengeluaranBulanan: 5_000_000,
      inflasi: 0,
      imbalSebelum: 0,
      imbalPensiun: 0,
      danaSekarang: 0,
    });
    expect(result.danaDibutuhkan).toBe(5_000_000 * 240);
    expect(result.setoranBulanan).toBeCloseTo(1_200_000_000 / 300, 4);
  });

  it('inflation raises the expense at retirement', () => {
    const result = hitungPensiun({
      usia: 30,
      usiaPensiun: 55,
      lamaPensiun: 20,
      pengeluaranBulanan: 5_000_000,
      inflasi: 0.04,
      imbalSebelum: 0.08,
      imbalPensiun: 0.05,
      danaSekarang: 0,
    });
    expect(result.pengeluaranSaatPensiun).toBeCloseTo(
      5_000_000 * 1.04 ** 25,
      2,
    );
    expect(result.setoranBulanan).toBeGreaterThan(0);
  });
});
