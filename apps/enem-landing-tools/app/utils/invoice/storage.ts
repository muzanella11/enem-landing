import type { InvoiceItem, TaxLine } from './index';

/**
 * Local-only storage for the invoice and kwitansi tools (Story 24). Data
 * lives in this browser's localStorage; export/import JSON moves it to
 * another device. Nothing is ever sent to a server.
 */

export type InvoiceTemplate = 'klasik' | 'modern' | 'ringkas';

export interface BusinessProfile {
  name: string;
  address: string;
  phone: string;
  email: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  /** Resized in the browser before saving (data URL). */
  logoDataUrl: string;
  qrisDataUrl: string;
  invoicePattern: string;
  nextInvoiceSequence: number;
  receiptPattern: string;
  nextReceiptSequence: number;
  template: InvoiceTemplate;
  /** "Dibuat dengan tools.muzanella.com" line in the PDF footer. */
  showFooterCredit: boolean;
}

export type InvoiceStatus = 'draft' | 'terkirim' | 'lunas';

export interface InvoiceDocument {
  id: string;
  number: string;
  issueDate: string;
  dueDate: string;
  customer: { name: string; address: string; contact: string };
  items: InvoiceItem[];
  discountPct: number;
  taxes: TaxLine[];
  shipping: number;
  notes: string;
  terms: string;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptDocument {
  id: string;
  number: string;
  receivedFrom: string;
  amount: number;
  purpose: string;
  place: string;
  date: string;
  receiverName: string;
  createdAt: string;
}

export interface InvoiceStore {
  version: 1;
  profile: BusinessProfile;
  invoices: InvoiceDocument[];
  receipts: ReceiptDocument[];
}

export const STORAGE_KEY = 'elt_invoice_store_v1';

export const defaultProfile = (): BusinessProfile => ({
  name: '',
  address: '',
  phone: '',
  email: '',
  bankName: '',
  bankAccount: '',
  bankHolder: '',
  logoDataUrl: '',
  qrisDataUrl: '',
  invoicePattern: 'INV/{YYYY}/{MM}/{NNN}',
  nextInvoiceSequence: 1,
  receiptPattern: 'KW/{YYYY}/{MM}/{NNN}',
  nextReceiptSequence: 1,
  template: 'modern',
  showFooterCredit: true,
});

export const emptyStore = (): InvoiceStore => ({
  version: 1,
  profile: defaultProfile(),
  invoices: [],
  receipts: [],
});

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Validates and normalizes an imported/stored payload. Unknown fields are
 * dropped, missing ones get defaults; anything that isn't a v1 store
 * throws a readable error.
 */
export const parseStore = (raw: unknown): InvoiceStore => {
  if (!isObject(raw) || raw['version'] !== 1) {
    throw new Error('File ini bukan cadangan data invoice yang valid.');
  }
  const profileRaw = isObject(raw['profile']) ? raw['profile'] : {};
  const base = defaultProfile();
  const profile = { ...base } as BusinessProfile;
  for (const key of Object.keys(base) as (keyof BusinessProfile)[]) {
    const value = profileRaw[key];
    if (typeof value === typeof base[key]) {
      (profile as unknown as Record<string, unknown>)[key] = value;
    }
  }
  const invoices = Array.isArray(raw['invoices'])
    ? (raw['invoices'].filter(
        (item) =>
          isObject(item) &&
          typeof item['id'] === 'string' &&
          Array.isArray(item['items']),
      ) as InvoiceDocument[])
    : [];
  const receipts = Array.isArray(raw['receipts'])
    ? (raw['receipts'].filter(
        (item) => isObject(item) && typeof item['id'] === 'string',
      ) as ReceiptDocument[])
    : [];
  return { version: 1, profile, invoices, receipts };
};

export const loadStore = (storage: Pick<Storage, 'getItem'>): InvoiceStore => {
  try {
    const text = storage.getItem(STORAGE_KEY);
    return text ? parseStore(JSON.parse(text)) : emptyStore();
  } catch {
    return emptyStore();
  }
};

export const saveStore = (
  storage: Pick<Storage, 'setItem'>,
  store: InvoiceStore,
): void => {
  storage.setItem(STORAGE_KEY, JSON.stringify(store));
};

export const exportStore = (store: InvoiceStore): string =>
  JSON.stringify(store, null, 2);

export const importStore = (text: string): InvoiceStore => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('File cadangan tidak bisa dibaca (bukan JSON).');
  }
  return parseStore(parsed);
};
