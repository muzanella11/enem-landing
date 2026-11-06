import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import {
  renderInvoicePdf,
  renderReceiptsPdf,
  toWinAnsi,
  wrapText,
} from './pdf.js';
import { defaultProfile, type InvoiceDocument } from './storage.js';

const monoFont = {
  widthOfTextAtSize: (text: string, size: number) => text.length * size * 0.5,
};

describe('toWinAnsi', () => {
  it('keeps Latin-1, normalizes smart quotes, replaces the rest', () => {
    expect(toWinAnsi('Café “Rp” – 10…')).toBe('Café "Rp" - 10...');
    expect(toWinAnsi('Kue 🎂 enak')).toBe('Kue ?? enak');
  });
});

describe('wrapText', () => {
  it('wraps on words and keeps explicit newlines', () => {
    expect(wrapText('satu dua tiga empat', monoFont, 10, 50)).toEqual([
      'satu dua',
      'tiga empat',
    ]);
    expect(wrapText('a\nb', monoFont, 10, 100)).toEqual(['a', 'b']);
  });

  it('breaks words longer than the column', () => {
    expect(wrapText('abcdefghij', monoFont, 10, 20)).toEqual([
      'abcd',
      'efgh',
      'ij',
    ]);
  });
});

const invoice = (itemCount: number): InvoiceDocument => ({
  id: 'inv-1',
  number: 'INV/2026/11/001',
  issueDate: '2026-11-06',
  dueDate: '2026-11-20',
  customer: {
    name: 'PT Maju Jaya',
    address: 'Jl. Merdeka 1, Jakarta',
    contact: 'budi@maju.co.id',
  },
  items: Array.from({ length: itemCount }, (_, index) => ({
    description: `Jasa desain ${index + 1} dengan deskripsi yang cukup panjang agar baris membungkus`,
    qty: 1,
    unit: 'paket',
    price: 1_500_000,
    discountPct: index % 2 ? 10 : 0,
  })),
  discountPct: 5,
  taxes: [{ label: 'PPN', ratePct: 11, kind: 'add' }],
  shipping: 0,
  notes: 'Terima kasih 🙏',
  terms: 'Bayar 14 hari',
  status: 'lunas',
  createdAt: '2026-11-06T00:00:00Z',
  updatedAt: '2026-11-06T00:00:00Z',
});

describe('renderInvoicePdf', () => {
  it.each(['klasik', 'modern', 'ringkas'] as const)(
    'renders a valid PDF with template %s',
    async (template) => {
      const bytes = await renderInvoicePdf(
        { ...defaultProfile(), name: 'Studio Ani', template },
        invoice(3),
      );
      const doc = await PDFDocument.load(bytes);
      expect(doc.getPageCount()).toBe(1);
    },
  );

  it('flows long item lists onto extra pages', async () => {
    const bytes = await renderInvoicePdf(defaultProfile(), invoice(40));
    expect((await PDFDocument.load(bytes)).getPageCount()).toBeGreaterThan(1);
  });
});

describe('renderReceiptsPdf', () => {
  it('puts up to three kwitansi on one A4 page', async () => {
    const receipt = {
      id: 'k',
      number: 'KW/1',
      receivedFrom: 'Budi',
      amount: 6_000_000,
      purpose: 'DP sewa',
      place: 'Bandung',
      date: '2026-11-06',
      receiverName: 'Ani',
      createdAt: '',
    };
    const bytes = await renderReceiptsPdf(
      [receipt, receipt, receipt, receipt],
      3,
      true,
    );
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(2);
  });
});
