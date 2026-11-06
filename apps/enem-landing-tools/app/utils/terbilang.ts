const UNITS = [
  '',
  'satu',
  'dua',
  'tiga',
  'empat',
  'lima',
  'enam',
  'tujuh',
  'delapan',
  'sembilan',
  'sepuluh',
  'sebelas',
];

const SCALES: [number, string][] = [
  [1e12, 'triliun'],
  [1e9, 'miliar'],
  [1e6, 'juta'],
  [1e3, 'ribu'],
];

/** Words for 0 < n < 1000. */
const belowThousand = (n: number): string => {
  if (n < 12) return UNITS[n] ?? '';
  if (n < 20) return `${UNITS[n - 10]} belas`;
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const rest = n % 10;
    return `${UNITS[tens]} puluh${rest ? ` ${UNITS[rest]}` : ''}`;
  }
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const head = hundreds === 1 ? 'seratus' : `${UNITS[hundreds]} ratus`;
  return rest ? `${head} ${belowThousand(rest)}` : head;
};

const integerWords = (n: number): string => {
  if (n === 0) return 'nol';
  const parts: string[] = [];
  let remaining = n;
  for (const [size, name] of SCALES) {
    if (remaining >= size) {
      const count = Math.floor(remaining / size);
      remaining %= size;
      // "seribu", not "satu ribu" - the only scale with this contraction.
      parts.push(
        size === 1e3 && count === 1
          ? 'seribu'
          : `${integerWords(count)} ${name}`,
      );
    }
  }
  if (remaining > 0) parts.push(belowThousand(remaining));
  return parts.join(' ');
};

export interface TerbilangOptions {
  /** Append "rupiah" (and "sen" for decimals). Default true. */
  currency?: boolean;
  /** Capitalize each word, the usual style on kwitansi. Default false. */
  titleCase?: boolean;
}

/**
 * Indonesian number-to-words, e.g. 1_250_000 -> "satu juta dua ratus lima
 * puluh ribu rupiah". Supports up to 999 triliun and two decimals, which
 * are read as "sen" in currency mode ("koma ..." otherwise).
 */
export const terbilang = (
  value: number,
  options: TerbilangOptions = {},
): string => {
  const { currency = true, titleCase = false } = options;
  if (!Number.isFinite(value)) return '';
  if (Math.abs(value) >= 1e15) {
    throw new RangeError('Angka terlalu besar (maksimal 999 triliun)');
  }

  const negative = value < 0;
  const absolute = Math.abs(value);
  const whole = Math.floor(absolute);
  const cents = Math.round((absolute - whole) * 100);

  let words = integerWords(whole);
  if (currency) words += ' rupiah';
  if (cents > 0) {
    words += currency
      ? ` ${integerWords(cents)} sen`
      : ` koma ${String(cents)
          .padStart(2, '0')
          .replace(/0$/, '')
          .split('')
          .map((digit) => (digit === '0' ? 'nol' : UNITS[Number(digit)]))
          .join(' ')}`;
  }
  if (negative) words = `minus ${words}`;

  return titleCase
    ? words.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase())
    : words;
};
