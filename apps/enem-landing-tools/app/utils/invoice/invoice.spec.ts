import { describe, expect, it } from 'vitest';
import {
  calculateInvoiceTotals,
  formatDocumentNumber,
  needsMeterai,
} from './index.js';

describe('calculateInvoiceTotals', () => {
  it('applies item discount, invoice discount, taxes, and shipping in order', () => {
    const totals = calculateInvoiceTotals({
      items: [
        {
          description: 'Desain logo',
          qty: 1,
          unit: 'paket',
          price: 2_000_000,
          discountPct: 10,
        },
        {
          description: 'Revisi',
          qty: 3,
          unit: 'jam',
          price: 150_000,
          discountPct: 0,
        },
      ],
      discountPct: 5,
      taxes: [
        { label: 'PPN', ratePct: 11, kind: 'add' },
        { label: 'PPh 23', ratePct: 2, kind: 'withhold' },
      ],
      shipping: 25_000,
    });
    expect(totals.lines.map((line) => line.net)).toEqual([1_800_000, 450_000]);
    expect(totals.subtotal).toBe(2_250_000);
    expect(totals.invoiceDiscount).toBe(112_500);
    expect(totals.taxableBase).toBe(2_137_500);
    expect(totals.taxes.map((tax) => tax.amount)).toEqual([235_125, 42_750]);
    expect(totals.total).toBe(2_137_500 + 235_125 - 42_750 + 25_000);
  });

  it('rounds fractional quantities to whole rupiah', () => {
    const totals = calculateInvoiceTotals({
      items: [
        {
          description: 'Kain',
          qty: 1.333,
          unit: 'm',
          price: 45_000,
          discountPct: 0,
        },
      ],
      discountPct: 0,
      taxes: [],
      shipping: 0,
    });
    expect(totals.total).toBe(59_985);
  });

  it('empty invoice totals zero', () => {
    expect(
      calculateInvoiceTotals({
        items: [],
        discountPct: 0,
        taxes: [],
        shipping: 0,
      }).total,
    ).toBe(0);
  });
});

describe('formatDocumentNumber', () => {
  it('fills date parts and the zero-padded sequence', () => {
    expect(
      formatDocumentNumber('INV/{YYYY}/{MM}/{NNN}', 7, new Date(2026, 10, 6)),
    ).toBe('INV/2026/11/007');
    expect(
      formatDocumentNumber('KW-{YY}{MM}{DD}-{N}', 12, new Date(2026, 0, 2)),
    ).toBe('KW-260102-12');
  });
});

describe('needsMeterai', () => {
  it('only above Rp5 juta', () => {
    expect(needsMeterai(5_000_000)).toBe(false);
    expect(needsMeterai(5_000_001)).toBe(true);
  });
});
