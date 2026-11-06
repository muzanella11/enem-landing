import { describe, expect, it } from 'vitest';
import {
  emptyStore,
  exportStore,
  importStore,
  loadStore,
  saveStore,
  STORAGE_KEY,
  type InvoiceStore,
} from './storage.js';

const memoryStorage = () => {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    data,
  };
};

const sample = (): InvoiceStore => {
  const store = emptyStore();
  store.profile.name = 'Toko Kue Bu Ani';
  store.profile.logoDataUrl = 'data:image/png;base64,AAAA';
  store.invoices.push({
    id: 'inv-1',
    number: 'INV/2026/11/001',
    issueDate: '2026-11-06',
    dueDate: '2026-11-20',
    customer: { name: 'PT Maju', address: 'Jakarta', contact: '0812' },
    items: [
      {
        description: 'Kue lapis',
        qty: 2,
        unit: 'loyang',
        price: 150_000,
        discountPct: 0,
      },
    ],
    discountPct: 0,
    taxes: [],
    shipping: 20_000,
    notes: '',
    terms: '',
    status: 'draft',
    createdAt: '2026-11-06T00:00:00Z',
    updatedAt: '2026-11-06T00:00:00Z',
  });
  store.receipts.push({
    id: 'kw-1',
    number: 'KW/2026/11/001',
    receivedFrom: 'Budi',
    amount: 1_250_000,
    purpose: 'Pelunasan',
    place: 'Bandung',
    date: '2026-11-06',
    receiverName: 'Ani',
    createdAt: '2026-11-06T00:00:00Z',
  });
  return store;
};

describe('invoice store', () => {
  it('round-trips through localStorage', () => {
    const storage = memoryStorage();
    saveStore(storage, sample());
    expect(storage.data.has(STORAGE_KEY)).toBe(true);
    expect(loadStore(storage)).toEqual(sample());
  });

  it('export then import on another browser gives identical data', () => {
    expect(importStore(exportStore(sample()))).toEqual(sample());
  });

  it('returns an empty store when nothing or garbage is stored', () => {
    expect(loadStore(memoryStorage())).toEqual(emptyStore());
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, '{not json');
    expect(loadStore(storage)).toEqual(emptyStore());
  });

  it('rejects files that are not a backup', () => {
    expect(() => importStore('hello')).toThrow('bukan JSON');
    expect(() => importStore('{"version":2}')).toThrow('bukan cadangan');
  });

  it('fills missing profile fields with defaults and drops wrong types', () => {
    const store = importStore(
      JSON.stringify({
        version: 1,
        profile: { name: 'X', nextInvoiceSequence: 'lima' },
      }),
    );
    expect(store.profile.name).toBe('X');
    expect(store.profile.nextInvoiceSequence).toBe(1);
    expect(store.profile.template).toBe('modern');
    expect(store.invoices).toEqual([]);
  });
});
