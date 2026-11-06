import type { HariLibur } from '../../data/libur';

/** Date helpers for the holiday and working-day tools (Story 30). Calendar dates only (YYYY-MM-DD, UTC math). */

const parse = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d));
};
const iso = (date: Date) => date.toISOString().slice(0, 10);
export const tambahHari = (tanggal: string, n: number) => {
  const date = parse(tanggal);
  date.setUTCDate(date.getUTCDate() + n);
  return iso(date);
};
/** 0 = Minggu ... 6 = Sabtu */
export const hariDalamMinggu = (tanggal: string) => parse(tanggal).getUTCDay();

export type PolaKerja = 5 | 6;
export const isAkhirPekan = (tanggal: string, pola: PolaKerja) => {
  const day = hariDalamMinggu(tanggal);
  return day === 0 || (pola === 5 && day === 6);
};

export interface HariKerjaResult {
  hariKalender: number;
  hariKerja: number;
  akhirPekan: number;
  liburTerlewati: HariLibur[];
}

/** Working days between two dates, inclusive; swaps reversed dates. */
export const hitungHariKerja = (
  mulai: string,
  selesai: string,
  pola: PolaKerja,
  libur: HariLibur[],
): HariKerjaResult => {
  let [start, end] = [mulai, selesai];
  if (start > end) [start, end] = [end, start];
  const holidays = new Map<string, HariLibur>();
  for (const day of libur)
    if (!holidays.has(day.tanggal)) holidays.set(day.tanggal, day);
  let hariKalender = 0;
  let hariKerja = 0;
  let akhirPekan = 0;
  const liburTerlewati: HariLibur[] = [];
  for (let day = start; day <= end; day = tambahHari(day, 1)) {
    hariKalender += 1;
    if (isAkhirPekan(day, pola)) akhirPekan += 1;
    else if (holidays.has(day)) liburTerlewati.push(holidays.get(day)!);
    else hariKerja += 1;
  }
  return { hariKalender, hariKerja, akhirPekan, liburTerlewati };
};

export interface LongWeekend {
  mulai: string;
  selesai: string;
  totalHari: number;
  cutiDiperlukan: string[];
  libur: HariLibur[];
}

/**
 * Runs of days off (weekend + holiday + joint leave), and runs that become
 * possible by taking up to `maksCuti` days of personal leave to bridge a gap.
 */
export const saranLongWeekend = (
  tahun: number,
  pola: PolaKerja,
  libur: HariLibur[],
  maksCuti = 2,
): LongWeekend[] => {
  const holidayMap = new Map(libur.map((day) => [day.tanggal, day]));
  const off = (day: string) => isAkhirPekan(day, pola) || holidayMap.has(day);
  const days: string[] = [];
  for (
    let day = `${tahun}-01-01`;
    day <= `${tahun}-12-31`;
    day = tambahHari(day, 1)
  )
    days.push(day);

  // Blocks of consecutive days off.
  const blocks: { mulai: string; selesai: string }[] = [];
  for (const day of days) {
    if (!off(day)) continue;
    const last = blocks[blocks.length - 1];
    if (last && tambahHari(last.selesai, 1) === day) last.selesai = day;
    else blocks.push({ mulai: day, selesai: day });
  }

  const result: LongWeekend[] = [];
  const hariAntara = (a: string, b: string) =>
    Math.round((parse(b).getTime() - parse(a).getTime()) / 86_400_000) + 1;
  for (let i = 0; i < blocks.length; i += 1) {
    let mulai = blocks[i]!.mulai;
    let selesai = blocks[i]!.selesai;
    const cutiDiperlukan: string[] = [];
    // Bridge forward into the next block while the gap fits the leave budget.
    for (let j = i + 1; j < blocks.length; j += 1) {
      const gapStart = tambahHari(selesai, 1);
      const gap = hariAntara(gapStart, tambahHari(blocks[j]!.mulai, -1));
      if (cutiDiperlukan.length + gap > maksCuti) break;
      for (let day = gapStart; day < blocks[j]!.mulai; day = tambahHari(day, 1))
        cutiDiperlukan.push(day);
      selesai = blocks[j]!.selesai;
    }
    const totalHari = hariAntara(mulai, selesai);
    const liburDalam = libur.filter(
      (day) => day.tanggal >= mulai && day.tanggal <= selesai,
    );
    if (totalHari >= 3 && liburDalam.length > 0) {
      result.push({
        mulai,
        selesai,
        totalHari,
        cutiDiperlukan,
        libur: liburDalam,
      });
    }
    mulai = selesai;
  }
  // Keep the best (longest per leave day) suggestion for each overlapping span.
  return result
    .filter(
      (item, index, all) =>
        !all.some(
          (other, otherIndex) =>
            otherIndex !== index &&
            other.mulai <= item.mulai &&
            other.selesai >= item.selesai &&
            other.cutiDiperlukan.length <= item.cutiDiperlukan.length &&
            (other.mulai !== item.mulai || other.selesai !== item.selesai),
        ),
    )
    .filter(
      (item, index, all) =>
        all.findIndex(
          (other) =>
            other.mulai === item.mulai && other.selesai === item.selesai,
        ) === index,
    );
};

/** iCalendar file with one all-day event per holiday. */
export const buatIcs = (libur: HariLibur[], namaKalender: string): string => {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d+Z$/, 'Z');
  const escape = (text: string) =>
    text.replace(/[\\;,]/g, (char) => `\\${char}`);
  const events = libur.map((day) => {
    const start = day.tanggal.replace(/-/g, '');
    const end = tambahHari(day.tanggal, 1).replace(/-/g, '');
    const label =
      day.jenis === 'cuti-bersama'
        ? 'Cuti bersama: '
        : day.jenis === 'fakultatif-hindu'
          ? 'Libur fakultatif: '
          : '';
    return [
      'BEGIN:VEVENT',
      `UID:${day.tanggal}-${day.jenis}-${start}@tools.muzanella.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${escape(label + day.nama)}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    ].join('\r\n');
  });
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//tools.muzanella.com//Libur Nasional//ID',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escape(namaKalender)}`,
    ...events,
    'END:VCALENDAR',
    '',
  ].join('\r\n');
};
