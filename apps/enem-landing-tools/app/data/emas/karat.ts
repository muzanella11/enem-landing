/**
 * Gold purity by karat (Story 38). Theoretical purity is karat/24; stores in
 * Indonesia often use their own kadar for "emas muda", so every value is a
 * starting point the user can change.
 */
export const KARAT = [
  { karat: 24, kadarPersen: 99.9, label: '24K (emas murni, 99,9%)' },
  { karat: 23, kadarPersen: 95.8, label: '23K (95,8%)' },
  { karat: 22, kadarPersen: 91.6, label: '22K (91,6%)' },
  { karat: 20, kadarPersen: 83.3, label: '20K (83,3%)' },
  { karat: 18, kadarPersen: 75, label: '18K (75%)' },
  { karat: 17, kadarPersen: 70, label: '17K (70%)' },
  { karat: 16, kadarPersen: 66.6, label: '16K (66,6%)' },
  { karat: 10, kadarPersen: 41.6, label: '10K (41,6%)' },
  { karat: 8, kadarPersen: 33.3, label: '8K (33,3%)' },
] as const;

export const SATUAN_GRAM = [1, 5, 10, 25, 50, 100] as const;
