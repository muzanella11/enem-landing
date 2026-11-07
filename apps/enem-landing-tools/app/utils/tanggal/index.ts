/**
 * Date tools (Story 31): Javanese weton, Hijri conversion, age, and date
 * differences. Calendar dates only (YYYY-MM-DD), no time zones involved.
 */

const toDays = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
};
const fromDays = (days: number) =>
  new Date(days * 86_400_000).toISOString().slice(0, 10);
const mod = (n: number, m: number) => ((n % m) + m) % m;

export const HARI = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
] as const;
export const PASARAN = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'] as const;
/** Neptu (Javanese day values), in the order of HARI and PASARAN. */
export const NEPTU_HARI = [5, 4, 3, 7, 8, 6, 9] as const;
export const NEPTU_PASARAN = [5, 9, 7, 4, 8] as const;

/** Anchor: 17 August 1945 was Jumat Legi. */
const ANCHOR = toDays('1945-08-17');

export interface Weton {
  hari: (typeof HARI)[number];
  pasaran: (typeof PASARAN)[number];
  neptuHari: number;
  neptuPasaran: number;
  neptu: number;
}

export const weton = (tanggal: string): Weton => {
  const days = toDays(tanggal);
  const hariIndex = mod(days + 4, 7); // 1970-01-01 (day 0) was a Thursday
  const pasaranIndex = mod(days - ANCHOR, 5);
  const neptuHari = NEPTU_HARI[hariIndex]!;
  const neptuPasaran = NEPTU_PASARAN[pasaranIndex]!;
  return {
    hari: HARI[hariIndex]!,
    pasaran: PASARAN[pasaranIndex]!,
    neptuHari,
    neptuPasaran,
    neptu: neptuHari + neptuPasaran,
  };
};

export const BULAN_HIJRIAH = [
  'Muharram',
  'Safar',
  'Rabiul Awal',
  'Rabiul Akhir',
  'Jumadil Awal',
  'Jumadil Akhir',
  'Rajab',
  'Syakban',
  'Ramadan',
  'Syawal',
  'Zulkaidah',
  'Zulhijah',
] as const;

export interface TanggalHijriah {
  hari: number;
  bulan: number;
  tahun: number;
  namaBulan: string;
}

/** Gregorian -> Hijri by the Umm al-Qura calendar (Intl, no library). */
export const keHijriah = (tanggal: string): TanggalHijriah => {
  const [y, m, d] = tanggal.split('-').map(Number) as [number, number, number];
  const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).formatToParts(new Date(Date.UTC(y, m - 1, d)));
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value.replace(/\D/g, ''));
  const bulan = get('month');
  return {
    hari: get('day'),
    bulan,
    tahun: get('year'),
    namaBulan: BULAN_HIJRIAH[bulan - 1] ?? '',
  };
};

/** Hijri -> Gregorian: searches around the approximate date. Null if the day doesn't exist. */
export const dariHijriah = (
  tahun: number,
  bulan: number,
  hari: number,
): string | null => {
  const approx = Math.round(
    -492_148 + (tahun - 1) * 354.367 + (bulan - 1) * 29.53 + hari,
  );
  for (let offset = -40; offset <= 40; offset += 1) {
    const candidate = fromDays(approx + offset);
    const hijri = keHijriah(candidate);
    if (hijri.tahun === tahun && hijri.bulan === bulan && hijri.hari === hari)
      return candidate;
  }
  return null;
};

export interface Umur {
  tahun: number;
  bulan: number;
  hari: number;
  totalHari: number;
  ulangTahunBerikutnya: string;
  hariMenujuUlangTahun: number;
}

const daysInMonth = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

export const hitungUmur = (lahir: string, padaTanggal: string): Umur => {
  const [y1, m1, d1] = lahir.split('-').map(Number) as [number, number, number];
  const [y2, m2, d2] = padaTanggal.split('-').map(Number) as [
    number,
    number,
    number,
  ];
  // Whole months first (adding months to the birth date, clamped to the
  // month length), then the remaining days - never negative.
  let months = (y2 - y1) * 12 + (m2 - m1);
  if (d2 < d1) months -= 1;
  const anchorYear = y1 + Math.floor((m1 - 1 + months) / 12);
  const anchorMonth = ((m1 - 1 + months) % 12) + 1;
  const anchor = `${anchorYear}-${String(anchorMonth).padStart(2, '0')}-${String(Math.min(d1, daysInMonth(anchorYear, anchorMonth))).padStart(2, '0')}`;
  const tahun = Math.floor(months / 12);
  const bulan = months % 12;
  const hari = toDays(padaTanggal) - toDays(anchor);
  // Birthday on 29 Feb is celebrated on 28 Feb in non-leap years.
  const birthdayIn = (year: number) => {
    const day = Math.min(d1, daysInMonth(year, m1));
    return `${year}-${String(m1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };
  let next = birthdayIn(y2);
  if (next <= padaTanggal) next = birthdayIn(y2 + 1);
  return {
    tahun,
    bulan,
    hari,
    totalHari: toDays(padaTanggal) - toDays(lahir),
    ulangTahunBerikutnya: next,
    hariMenujuUlangTahun: toDays(next) - toDays(padaTanggal),
  };
};

export const selisihHari = (a: string, b: string): number =>
  toDays(b) - toDays(a);
export const tambahHari = (tanggal: string, n: number): string =>
  fromDays(toDays(tanggal) + n);
