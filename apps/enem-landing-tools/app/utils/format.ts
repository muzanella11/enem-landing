const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 0,
});

/** "Rp1.234.567" - always whole rupiah, rounded. */
export const formatRupiah = (value: number): string =>
  rupiahFormatter.format(Math.round(value)).replace(/\s/g, '');

/** "1.234.567" - the thousands-separated form shown inside inputs. */
export const formatThousands = (value: number): string =>
  numberFormatter.format(Math.round(value));

/**
 * Reads what a person typed into a Rupiah field: "Rp 1.250.000", "1250000",
 * or "1.250.000,50" all work. Dots are thousands separators (Indonesian
 * convention), a comma starts the decimals. Returns 0 for empty/garbage.
 */
export const parseRupiah = (input: string): number => {
  const cleaned = input.replace(/[^\d,.-]/g, '');
  if (!cleaned) return 0;
  const [whole = '', decimals = ''] = cleaned.split(',');
  const normalized = `${whole.replace(/\./g, '')}${decimals ? `.${decimals}` : ''}`;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
};

export const formatPercent = (value: number, fractionDigits = 2): string =>
  `${value.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  })}%`;

export const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;
