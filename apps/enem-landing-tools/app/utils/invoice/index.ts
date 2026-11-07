/**
 * Invoice and kwitansi math (Story 24). Taxes are optional free-form lines
 * with a user-entered rate - the tool never guesses someone's tax regime,
 * and it is not e-Faktur.
 */

export interface InvoiceItem {
  description: string;
  qty: number;
  unit: string;
  price: number;
  /** Per-item discount in percent of (qty x price). */
  discountPct: number;
}

export interface TaxLine {
  label: string;
  /** Percent of the taxable base (subtotal after discounts). */
  ratePct: number;
  /** `add` for PPN-like taxes, `withhold` for PPh deducted by the buyer. */
  kind: 'add' | 'withhold';
}

export interface InvoiceTotalsInput {
  items: InvoiceItem[];
  /** Whole-invoice discount, percent of the subtotal after item discounts. */
  discountPct: number;
  taxes: TaxLine[];
  shipping: number;
}

export interface InvoiceTotals {
  lines: { gross: number; discount: number; net: number }[];
  subtotal: number;
  invoiceDiscount: number;
  taxableBase: number;
  taxes: {
    label: string;
    ratePct: number;
    kind: TaxLine['kind'];
    amount: number;
  }[];
  shipping: number;
  total: number;
}

const roundRupiah = (value: number): number => Math.round(value);

export const calculateInvoiceTotals = (
  input: InvoiceTotalsInput,
): InvoiceTotals => {
  const lines = input.items.map((item) => {
    const gross = roundRupiah(item.qty * item.price);
    const discount = roundRupiah((gross * item.discountPct) / 100);
    return { gross, discount, net: gross - discount };
  });
  const subtotal = lines.reduce((sum, line) => sum + line.net, 0);
  const invoiceDiscount = roundRupiah((subtotal * input.discountPct) / 100);
  const taxableBase = subtotal - invoiceDiscount;
  const taxes = input.taxes.map((tax) => ({
    label: tax.label,
    ratePct: tax.ratePct,
    kind: tax.kind,
    amount: roundRupiah((taxableBase * tax.ratePct) / 100),
  }));
  const added = taxes
    .filter((tax) => tax.kind === 'add')
    .reduce((sum, tax) => sum + tax.amount, 0);
  const withheld = taxes
    .filter((tax) => tax.kind === 'withhold')
    .reduce((sum, tax) => sum + tax.amount, 0);
  return {
    lines,
    subtotal,
    invoiceDiscount,
    taxableBase,
    taxes,
    shipping: input.shipping,
    total: taxableBase + added - withheld + input.shipping,
  };
};

/**
 * Invoice numbers from a pattern: `{YYYY}`, `{YY}`, `{MM}`, `{DD}`, and
 * `{N}`/`{NNN}` (sequence, zero-padded to the number of N's).
 */
export const formatDocumentNumber = (
  pattern: string,
  sequence: number,
  date: Date,
): string =>
  pattern
    .replace(/\{YYYY\}/g, String(date.getFullYear()))
    .replace(/\{YY\}/g, String(date.getFullYear()).slice(-2))
    .replace(/\{MM\}/g, String(date.getMonth() + 1).padStart(2, '0'))
    .replace(/\{DD\}/g, String(date.getDate()).padStart(2, '0'))
    .replace(/\{(N+)\}/g, (_, ns: string) =>
      String(sequence).padStart(ns.length, '0'),
    );

/**
 * Bea meterai (UU 10/2020): Rp10.000 on documents stating an amount above
 * Rp5.000.000. The tool only marks the spot; it doesn't issue e-meterai.
 */
export const METERAI = { threshold: 5_000_000, amount: 10_000 } as const;

export const needsMeterai = (amount: number): boolean =>
  amount > METERAI.threshold;
