/**
 * Loan math for the KPR simulator (Story 21), kept generic so a vehicle
 * loan or KTA simulator can reuse it later. All amounts are rupiah; every
 * schedule row is rounded to whole rupiah, and the final row absorbs the
 * rounding so total principal equals the loan exactly.
 */

export type LoanMethod = 'anuitas' | 'efektif' | 'flat';

export interface RatePeriod {
  /** Length in months. The last period is stretched to the end of the tenor. */
  months: number;
  /** Annual interest rate in percent, e.g. 7.5. */
  annualRate: number;
}

export interface Prepayment {
  /** Paid together with this month's installment (1-based). */
  month: number;
  amount: number;
  /** `tenor`: keep the installment, finish earlier. `cicilan`: keep the end date, lower the installment. */
  mode: 'tenor' | 'cicilan';
  /** Penalty as a percent of the prepaid amount. */
  penaltyPct: number;
}

export interface LoanInput {
  principal: number;
  tenorMonths: number;
  periods: RatePeriod[];
  method: LoanMethod;
  prepayment?: Prepayment | null;
}

export interface ScheduleRow {
  month: number;
  annualRate: number;
  payment: number;
  principal: number;
  interest: number;
  prepayment: number;
  balance: number;
}

export interface PeriodSummary {
  fromMonth: number;
  toMonth: number;
  annualRate: number;
  /** Installment at the start of the period. */
  payment: number;
}

export interface LoanResult {
  schedule: ScheduleRow[];
  periods: PeriodSummary[];
  totalInterest: number;
  totalPayment: number;
  prepaymentPenalty: number;
  /** Month the loan is fully repaid (shorter than the tenor after a `tenor` prepayment). */
  lastMonth: number;
}

/** Spreadsheet PMT for a positive payment: rate per period, number of periods, present value. */
export const pmt = (
  ratePerMonth: number,
  months: number,
  principal: number,
): number => {
  if (months <= 0) return principal;
  if (ratePerMonth === 0) return principal / months;
  const factor = (1 + ratePerMonth) ** months;
  return (principal * ratePerMonth * factor) / (factor - 1);
};

/** Months needed to repay `principal` with a fixed `payment`. */
export const nper = (
  ratePerMonth: number,
  payment: number,
  principal: number,
): number => {
  if (principal <= 0) return 0;
  if (ratePerMonth === 0) return Math.ceil(principal / payment);
  const ratio = 1 - (ratePerMonth * principal) / payment;
  if (ratio <= 0) return Infinity;
  return Math.ceil(-Math.log(ratio) / Math.log(1 + ratePerMonth));
};

const rateForMonth = (periods: RatePeriod[], month: number): number => {
  let end = 0;
  for (const period of periods) {
    end += period.months;
    if (month <= end) return period.annualRate;
  }
  return periods[periods.length - 1]?.annualRate ?? 0;
};

export const calculateLoan = (input: LoanInput): LoanResult => {
  const { principal, tenorMonths, method } = input;
  const periods =
    input.periods.length > 0
      ? input.periods
      : [{ months: tenorMonths, annualRate: 0 }];
  const prepayment =
    input.prepayment && input.prepayment.amount > 0 ? input.prepayment : null;

  const schedule: ScheduleRow[] = [];
  const summaries: PeriodSummary[] = [];
  let balance = principal;
  let endMonth = tenorMonths;
  let currentRate = Number.NaN;
  let payment = 0;
  let principalPerMonth = 0;
  let flatInterest = 0;
  let prepaymentPenalty = 0;

  const resetInstallment = (month: number, annualRate: number) => {
    const remaining = Math.max(1, endMonth - month + 1);
    const monthlyRate = annualRate / 100 / 12;
    payment = pmt(monthlyRate, remaining, balance);
    principalPerMonth = balance / remaining;
    flatInterest = balance * monthlyRate;
  };

  for (let month = 1; month <= endMonth && balance > 0.5; month += 1) {
    const annualRate = rateForMonth(periods, month);
    if (annualRate !== currentRate) {
      currentRate = annualRate;
      resetInstallment(month, annualRate);
      summaries.push({
        fromMonth: month,
        toMonth: month,
        annualRate,
        payment: 0,
      });
    }

    const monthlyRate = annualRate / 100 / 12;
    let interest: number;
    let principalPart: number;
    if (method === 'anuitas') {
      interest = balance * monthlyRate;
      principalPart = payment - interest;
    } else if (method === 'efektif') {
      interest = balance * monthlyRate;
      principalPart = principalPerMonth;
    } else {
      interest = flatInterest;
      principalPart = principalPerMonth;
    }

    const isLast = month === endMonth || principalPart >= balance - 0.5;
    const roundedInterest = Math.round(interest);
    // Anuitas: derive principal from the rounded installment so the
    // installment shown stays exactly constant month to month.
    const regularPrincipal =
      method === 'anuitas'
        ? Math.round(payment) - roundedInterest
        : Math.round(principalPart);
    const roundedPrincipal = isLast ? Math.round(balance) : regularPrincipal;
    balance = isLast ? 0 : balance - roundedPrincipal;

    let prepaid = 0;
    if (prepayment && prepayment.month === month && balance > 0) {
      prepaid = Math.round(Math.min(prepayment.amount, balance));
      balance -= prepaid;
      prepaymentPenalty = Math.round((prepaid * prepayment.penaltyPct) / 100);
      if (balance > 0.5) {
        if (prepayment.mode === 'tenor') {
          if (method === 'anuitas') {
            endMonth = month + nper(monthlyRate, payment, balance);
          } else {
            endMonth = month + Math.ceil(balance / principalPerMonth);
            flatInterest = balance * monthlyRate;
          }
        } else {
          resetInstallment(month + 1, annualRate);
        }
      }
    }

    const row: ScheduleRow = {
      month,
      annualRate,
      payment: roundedPrincipal + roundedInterest,
      principal: roundedPrincipal,
      interest: roundedInterest,
      prepayment: prepaid,
      balance: Math.max(0, Math.round(balance)),
    };
    schedule.push(row);

    const summary = summaries[summaries.length - 1];
    if (summary) {
      if (summary.payment === 0) summary.payment = row.payment;
      summary.toMonth = month;
    }
  }

  const totalInterest = schedule.reduce((sum, row) => sum + row.interest, 0);
  const totalPayment = schedule.reduce(
    (sum, row) => sum + row.payment + row.prepayment,
    0,
  );

  return {
    schedule,
    periods: summaries,
    totalInterest,
    totalPayment,
    prepaymentPenalty,
    lastMonth: schedule[schedule.length - 1]?.month ?? 0,
  };
};

export interface UpfrontCostInput {
  propertyPrice: number;
  loanAmount: number;
  /** Percent of the loan. */
  provisiPct: number;
  administrasi: number;
  appraisal: number;
  notaris: number;
  /** Life + fire insurance, percent of the loan (one-off, paid upfront). */
  asuransiPct: number;
  /** BPHTB: 5% of (price - NPOPTKP); NPOPTKP differs per region. */
  bphtbPct: number;
  npoptkp: number;
}

export interface UpfrontCostResult {
  provisi: number;
  administrasi: number;
  appraisal: number;
  notaris: number;
  asuransi: number;
  bphtb: number;
  total: number;
}

export const calculateUpfrontCosts = (
  input: UpfrontCostInput,
): UpfrontCostResult => {
  const provisi = Math.round((input.loanAmount * input.provisiPct) / 100);
  const asuransi = Math.round((input.loanAmount * input.asuransiPct) / 100);
  const bphtb = Math.round(
    (Math.max(0, input.propertyPrice - input.npoptkp) * input.bphtbPct) / 100,
  );
  const total =
    provisi +
    input.administrasi +
    input.appraisal +
    input.notaris +
    asuransi +
    bphtb;
  return {
    provisi,
    administrasi: input.administrasi,
    appraisal: input.appraisal,
    notaris: input.notaris,
    asuransi,
    bphtb,
    total,
  };
};

/** Highest installment as a percent of monthly income (null without income). */
export const installmentRatio = (
  payment: number,
  monthlyIncome: number,
): number | null =>
  monthlyIncome > 0 ? (payment / monthlyIncome) * 100 : null;

export const scheduleToCsv = (schedule: ScheduleRow[]): string => {
  const header =
    'Bulan;Bunga per tahun (%);Cicilan;Pokok;Bunga;Pelunasan sebagian;Sisa pokok';
  const lines = schedule.map((row) =>
    [
      row.month,
      String(row.annualRate).replace('.', ','),
      row.payment,
      row.principal,
      row.interest,
      row.prepayment,
      row.balance,
    ].join(';'),
  );
  // BOM so Excel opens it as UTF-8; semicolons because Indonesian-locale
  // Excel uses the comma as the decimal separator.
  return `${'\uFEFF'}${[header, ...lines].join('\r\n')}\r\n`;
};
