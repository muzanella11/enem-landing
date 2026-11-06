import { describe, expect, it } from 'vitest';
import {
  calculateLoan,
  calculateUpfrontCosts,
  installmentRatio,
  nper,
  pmt,
  scheduleToCsv,
  type LoanInput,
} from './index.js';

const sumPrincipal = (input: LoanInput) =>
  calculateLoan(input).schedule.reduce(
    (sum, row) => sum + row.principal + row.prepayment,
    0,
  );

describe('pmt', () => {
  it('matches the spreadsheet PMT function', () => {
    // =PMT(7.5%/12, 240, -500000000) = 4.027.966,...
    expect(Math.round(pmt(0.075 / 12, 240, 500_000_000))).toBe(4_027_966);
    // =PMT(10%/12, 12, -12000000) = 1.054.990,...
    expect(Math.round(pmt(0.1 / 12, 12, 12_000_000))).toBe(1_054_991);
  });

  it('handles 0% interest', () => {
    expect(pmt(0, 10, 1000)).toBe(100);
  });
});

describe('calculateLoan - anuitas', () => {
  const single: LoanInput = {
    principal: 500_000_000,
    tenorMonths: 240,
    periods: [{ months: 240, annualRate: 7.5 }],
    method: 'anuitas',
  };

  it('single period: constant installment = PMT', () => {
    const result = calculateLoan(single);
    expect(result.schedule).toHaveLength(240);
    expect(result.periods[0]?.payment).toBe(4_027_966);
    expect(result.schedule[result.schedule.length - 1]?.balance).toBe(0);
  });

  it('total principal equals the loan exactly', () => {
    expect(sumPrincipal(single)).toBe(500_000_000);
  });

  it('multi-period: installment jumps when floating starts', () => {
    const result = calculateLoan({
      ...single,
      periods: [
        { months: 36, annualRate: 3.5 },
        { months: 24, annualRate: 7 },
        { months: 180, annualRate: 11 },
      ],
    });
    expect(result.periods.map((period) => period.fromMonth)).toEqual([
      1, 37, 61,
    ]);
    const [fixed1, fixed2, floating] = result.periods;
    expect(fixed2!.payment).toBeGreaterThan(fixed1!.payment);
    expect(floating!.payment).toBeGreaterThan(fixed2!.payment);
    expect(
      sumPrincipal({
        ...single,
        periods: result.periods.map((p) => ({
          months: p.toMonth - p.fromMonth + 1,
          annualRate: p.annualRate,
        })),
      }),
    ).toBe(500_000_000);
  });

  it.each([12, 60, 120, 360])('tenor %d months repays exactly', (tenor) => {
    const input: LoanInput = {
      principal: 300_000_000,
      tenorMonths: tenor,
      periods: [{ months: tenor, annualRate: 9.25 }],
      method: 'anuitas',
    };
    const result = calculateLoan(input);
    expect(result.schedule).toHaveLength(tenor);
    expect(sumPrincipal(input)).toBe(300_000_000);
  });

  it('DP 100% (zero principal) yields an empty schedule', () => {
    const result = calculateLoan({ ...single, principal: 0 });
    expect(result.schedule).toHaveLength(0);
    expect(result.totalInterest).toBe(0);
  });
});

describe('calculateLoan - other methods', () => {
  it('efektif: constant principal, falling installment', () => {
    const result = calculateLoan({
      principal: 120_000_000,
      tenorMonths: 12,
      periods: [{ months: 12, annualRate: 12 }],
      method: 'efektif',
    });
    expect(result.schedule[0]?.principal).toBe(10_000_000);
    expect(result.schedule[0]?.interest).toBe(1_200_000);
    expect(result.schedule[11]?.interest).toBe(100_000);
  });

  it('flat: constant interest on the starting balance', () => {
    const result = calculateLoan({
      principal: 120_000_000,
      tenorMonths: 12,
      periods: [{ months: 12, annualRate: 12 }],
      method: 'flat',
    });
    expect(new Set(result.schedule.map((row) => row.interest))).toEqual(
      new Set([1_200_000]),
    );
    expect(result.totalInterest).toBe(14_400_000);
  });
});

describe('prepayment', () => {
  const base: LoanInput = {
    principal: 500_000_000,
    tenorMonths: 240,
    periods: [{ months: 240, annualRate: 8 }],
    method: 'anuitas',
  };

  it('tenor mode keeps the installment and finishes earlier', () => {
    const result = calculateLoan({
      ...base,
      prepayment: {
        month: 24,
        amount: 100_000_000,
        mode: 'tenor',
        penaltyPct: 1,
      },
    });
    expect(result.lastMonth).toBeLessThan(240);
    expect(result.schedule[24]?.payment).toBe(result.schedule[0]?.payment);
    expect(result.prepaymentPenalty).toBe(1_000_000);
    expect(
      result.schedule.reduce(
        (sum, row) => sum + row.principal + row.prepayment,
        0,
      ),
    ).toBe(500_000_000);
  });

  it('cicilan mode keeps the end date and lowers the installment', () => {
    const result = calculateLoan({
      ...base,
      prepayment: {
        month: 24,
        amount: 100_000_000,
        mode: 'cicilan',
        penaltyPct: 0,
      },
    });
    expect(result.lastMonth).toBe(240);
    expect(result.schedule[24]!.payment).toBeLessThan(
      result.schedule[0]!.payment,
    );
    expect(
      result.schedule.reduce(
        (sum, row) => sum + row.principal + row.prepayment,
        0,
      ),
    ).toBe(500_000_000);
  });

  it('both modes pay less interest than no prepayment', () => {
    const none = calculateLoan(base).totalInterest;
    const tenor = calculateLoan({
      ...base,
      prepayment: { month: 24, amount: 1e8, mode: 'tenor', penaltyPct: 0 },
    }).totalInterest;
    const cicilan = calculateLoan({
      ...base,
      prepayment: { month: 24, amount: 1e8, mode: 'cicilan', penaltyPct: 0 },
    }).totalInterest;
    expect(tenor).toBeLessThan(cicilan);
    expect(cicilan).toBeLessThan(none);
  });
});

describe('helpers', () => {
  it('nper inverts pmt', () => {
    const payment = pmt(0.01, 120, 1_000_000);
    expect(nper(0.01, payment, 1_000_000)).toBe(120);
  });

  it('upfront costs with BPHTB above NPOPTKP', () => {
    const costs = calculateUpfrontCosts({
      propertyPrice: 600_000_000,
      loanAmount: 480_000_000,
      provisiPct: 1,
      administrasi: 500_000,
      appraisal: 1_000_000,
      notaris: 5_000_000,
      asuransiPct: 2,
      bphtbPct: 5,
      npoptkp: 80_000_000,
    });
    expect(costs.provisi).toBe(4_800_000);
    expect(costs.asuransi).toBe(9_600_000);
    expect(costs.bphtb).toBe(26_000_000);
    expect(costs.total).toBe(46_900_000);
  });

  it('installment ratio', () => {
    expect(installmentRatio(3_000_000, 10_000_000)).toBe(30);
    expect(installmentRatio(3_000_000, 0)).toBeNull();
  });

  it('CSV has a BOM, a header, and one line per month', () => {
    const csv = scheduleToCsv(
      calculateLoan({
        principal: 12_000_000,
        tenorMonths: 12,
        periods: [{ months: 12, annualRate: 10.5 }],
        method: 'anuitas',
      }).schedule,
    );
    expect(csv.startsWith('﻿Bulan;')).toBe(true);
    expect(csv.trim().split('\r\n')).toHaveLength(13);
    expect(csv).toContain('10,5');
  });
});
