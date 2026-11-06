import {
  PAYROLL_RULES_2026,
  type PayrollRules,
  type PtkpStatus,
  type TerBracket,
  type TerCategory,
} from '../../data/tax/2026.js';

export interface PayrollInput {
  gajiPokok: number;
  tunjanganTetap: number;
  /** Monthly, e.g. overtime or meal allowance that varies. */
  tunjanganTidakTetap: number;
  ptkp: PtkpStatus;
  /** Index into `rules.jkkRates`. */
  jkkRiskIndex: number;
  ikutBpjsKesehatan: boolean;
  ikutBpjsKetenagakerjaan: boolean;
  /** THR/bonus paid in `thrMonth` (1-12). 0 means none. */
  thr: number;
  thrMonth: number;
}

export interface BpjsBreakdown {
  kesehatan: number;
  jht: number;
  jp: number;
  jkk: number;
  jkm: number;
  total: number;
}

export interface MonthResult {
  month: number;
  /** Cash paid before deductions: salary + allowances + THR. */
  cashIncome: number;
  /** Gross for PPh 21: cash + premiums the employer pays (BPJS Kes, JKK, JKM). */
  bruto: number;
  terCategory: TerCategory;
  /** TER rate (percent) used, or null in December (Pasal 17 reconciliation). */
  terRate: number | null;
  pph21: number;
  employee: BpjsBreakdown;
  employer: BpjsBreakdown;
  takeHomePay: number;
  /** Salary plus everything the employer pays on top. */
  employerCost: number;
}

export interface DecemberReconciliation {
  brutoSetahun: number;
  biayaJabatan: number;
  iuranPensiun: number;
  neto: number;
  ptkp: number;
  pkp: number;
  pph21Setahun: number;
  pph21JanNov: number;
  pph21Desember: number;
}

export interface YearResult {
  months: MonthResult[];
  december: DecemberReconciliation;
  totals: {
    takeHomePay: number;
    pph21: number;
    employeeBpjs: number;
    employerCost: number;
  };
}

const round = (value: number): number => Math.round(value);

export const getPtkp = (
  status: PtkpStatus,
  rules: PayrollRules = PAYROLL_RULES_2026,
): number => {
  const [marital, dependants] = status.split('/') as [string, string];
  const count = Math.min(Number(dependants), rules.ptkp.maxDependants);
  return (
    rules.ptkp.base +
    (marital === 'K' ? rules.ptkp.married : 0) +
    count * rules.ptkp.perDependant
  );
};

export const getTerCategory = (
  status: PtkpStatus,
  rules: PayrollRules = PAYROLL_RULES_2026,
): TerCategory => rules.terCategory[status];

const findRate = (brackets: readonly TerBracket[], amount: number): number => {
  for (const [upper, rate] of brackets) {
    if (amount <= upper) return rate;
  }
  return brackets[brackets.length - 1]?.[1] ?? 0;
};

export const getTerRate = (
  category: TerCategory,
  monthlyBruto: number,
  rules: PayrollRules = PAYROLL_RULES_2026,
): number => findRate(rules.ter[category], monthlyBruto);

/** Progressive Pasal 17 tax on annual PKP. */
export const pasal17Tax = (
  pkp: number,
  rules: PayrollRules = PAYROLL_RULES_2026,
): number => {
  let tax = 0;
  let lower = 0;
  for (const [upper, rate] of rules.pasal17) {
    if (pkp <= lower) break;
    const taxable = Math.min(pkp, upper) - lower;
    tax += (taxable * rate) / 100;
    lower = upper;
  }
  return Math.floor(tax);
};

/** BPJS on the fixed wage (gaji pokok + tunjangan tetap), with each program's cap. */
export const calculateBpjs = (
  input: PayrollInput,
  rules: PayrollRules = PAYROLL_RULES_2026,
): { employee: BpjsBreakdown; employer: BpjsBreakdown } => {
  const wage = input.gajiPokok + input.tunjanganTetap;
  const { kesehatan, jht, jp, jkm } = rules.bpjs;
  const kesWage = Math.min(wage, kesehatan.wageCap);
  const jpWage = Math.min(wage, jp.wageCap);
  const jkkRate = rules.jkkRates[input.jkkRiskIndex]?.rate ?? 0;

  const employee = {
    kesehatan: input.ikutBpjsKesehatan
      ? round(kesWage * kesehatan.employee)
      : 0,
    jht: input.ikutBpjsKetenagakerjaan ? round(wage * jht.employee) : 0,
    jp: input.ikutBpjsKetenagakerjaan ? round(jpWage * jp.employee) : 0,
    jkk: 0,
    jkm: 0,
    total: 0,
  };
  employee.total = employee.kesehatan + employee.jht + employee.jp;

  const employer = {
    kesehatan: input.ikutBpjsKesehatan
      ? round(kesWage * kesehatan.employer)
      : 0,
    jht: input.ikutBpjsKetenagakerjaan ? round(wage * jht.employer) : 0,
    jp: input.ikutBpjsKetenagakerjaan ? round(jpWage * jp.employer) : 0,
    jkk: input.ikutBpjsKetenagakerjaan ? round(wage * jkkRate) : 0,
    jkm: input.ikutBpjsKetenagakerjaan ? round(wage * jkm.employer) : 0,
    total: 0,
  };
  employer.total =
    employer.kesehatan +
    employer.jht +
    employer.jp +
    employer.jkk +
    employer.jkm;

  return { employee, employer };
};

const monthBase = (input: PayrollInput, month: number, rules: PayrollRules) => {
  const thr = input.thr > 0 && input.thrMonth === month ? input.thr : 0;
  const cashIncome =
    input.gajiPokok + input.tunjanganTetap + input.tunjanganTidakTetap + thr;
  const { employee, employer } = calculateBpjs(input, rules);
  // Premiums the employer pays that count as the employee's income
  // (PMK 168/2023): BPJS Kesehatan, JKK, JKM. JHT/JP employer shares don't.
  const bruto = cashIncome + employer.kesehatan + employer.jkk + employer.jkm;
  return { cashIncome, bruto, employee, employer };
};

/**
 * Full-year simulation, assuming the same salary every month: TER for
 * January-November, Pasal 17 reconciliation in December. This is also
 * how a single month is answered, because December can only be computed
 * from the whole year.
 */
export const calculateYear = (
  input: PayrollInput,
  rules: PayrollRules = PAYROLL_RULES_2026,
): YearResult => {
  const category = getTerCategory(input.ptkp, rules);
  const months: MonthResult[] = [];
  let pph21JanNov = 0;
  let brutoSetahun = 0;
  let iuranPensiun = 0;

  for (let month = 1; month <= 12; month += 1) {
    const base = monthBase(input, month, rules);
    brutoSetahun += base.bruto;
    iuranPensiun += base.employee.jht + base.employee.jp;

    if (month < 12) {
      const rate = getTerRate(category, base.bruto, rules);
      const pph21 = Math.floor((base.bruto * rate) / 100);
      pph21JanNov += pph21;
      months.push(buildMonth(month, base, category, rate, pph21));
    }
  }

  const biayaJabatan = Math.min(
    brutoSetahun * rules.biayaJabatan.rate,
    rules.biayaJabatan.maxAnnual,
  );
  const neto = brutoSetahun - biayaJabatan - iuranPensiun;
  const ptkp = getPtkp(input.ptkp, rules);
  // PKP is rounded down to whole thousands.
  const pkp = Math.max(0, Math.floor((neto - ptkp) / 1000) * 1000);
  const pph21Setahun = pasal17Tax(pkp, rules);
  const pph21Desember = pph21Setahun - pph21JanNov;

  const decemberBase = monthBase(input, 12, rules);
  months.push(buildMonth(12, decemberBase, category, null, pph21Desember));

  return {
    months,
    december: {
      brutoSetahun,
      biayaJabatan: round(biayaJabatan),
      iuranPensiun,
      neto: round(neto),
      ptkp,
      pkp,
      pph21Setahun,
      pph21JanNov,
      pph21Desember,
    },
    totals: {
      takeHomePay: months.reduce((sum, month) => sum + month.takeHomePay, 0),
      pph21: months.reduce((sum, month) => sum + month.pph21, 0),
      employeeBpjs: months.reduce(
        (sum, month) => sum + month.employee.total,
        0,
      ),
      employerCost: months.reduce((sum, month) => sum + month.employerCost, 0),
    },
  };
};

const buildMonth = (
  month: number,
  base: ReturnType<typeof monthBase>,
  category: TerCategory,
  terRate: number | null,
  pph21: number,
): MonthResult => ({
  month,
  cashIncome: base.cashIncome,
  bruto: base.bruto,
  terCategory: category,
  terRate,
  pph21,
  employee: base.employee,
  employer: base.employer,
  // A negative December PPh 21 (overpaid) is refunded, so it raises THP.
  takeHomePay: base.cashIncome - base.employee.total - pph21,
  employerCost: base.cashIncome + base.employer.total,
});

export const calculateMonth = (
  input: PayrollInput,
  month: number,
  rules: PayrollRules = PAYROLL_RULES_2026,
): MonthResult => {
  const year = calculateYear(input, rules);
  const result = year.months[month - 1];
  if (!result) throw new RangeError('Bulan harus 1 sampai 12');
  return result;
};
