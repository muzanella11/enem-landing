import {
  CalculationParameters,
  Coordinates,
  Madhab,
  PrayerTimes,
  Qibla,
  Rounding,
} from 'adhan';
import { KEMENAG_PARAMS } from '../../data/sholat/kemenag';
import type { Kota } from '../../data/sholat/kota';

/** Prayer times, Ramadan imsakiyah, and qibla direction (Story 36). Runs in the browser. */

export const WAKTU = [
  'imsak',
  'subuh',
  'terbit',
  'dhuha',
  'dzuhur',
  'ashar',
  'maghrib',
  'isya',
] as const;
export type Waktu = (typeof WAKTU)[number];

export const WAKTU_LABEL: Record<Waktu, string> = {
  imsak: 'Imsak',
  subuh: 'Subuh',
  terbit: 'Terbit',
  dhuha: 'Dhuha',
  dzuhur: 'Dzuhur',
  ashar: 'Ashar',
  maghrib: 'Maghrib',
  isya: 'Isya',
};

export interface JadwalHari {
  tanggal: string;
  waktu: Record<Waktu, string>;
  /** Same times as instants, for countdowns. */
  instan: Record<Waktu, Date>;
}

const ZONA_LABEL = { 7: 'WIB', 8: 'WITA', 9: 'WIT' } as const;
export const zonaLabel = (zona: 7 | 8 | 9) => ZONA_LABEL[zona];

const params = (elevasi: number) => {
  const p = new CalculationParameters(
    'Other',
    KEMENAG_PARAMS.fajrAngle,
    KEMENAG_PARAMS.ishaAngle,
  );
  p.madhab = Madhab.Shafi;
  p.rounding = Rounding.Up;
  const dipMinutes = Math.round(
    KEMENAG_PARAMS.dipPerSqrtMeter * Math.sqrt(Math.max(0, elevasi)) * 4,
  );
  const ih = KEMENAG_PARAMS.ihtiyat;
  p.adjustments = {
    fajr: ih.fajr,
    sunrise: ih.sunrise - dipMinutes,
    dhuhr: ih.dhuhr,
    asr: ih.asr,
    maghrib: ih.maghrib + dipMinutes,
    isha: ih.isha,
  };
  return p;
};

/** "HH:MM" in the city's own time zone, whatever the browser's zone is. */
export const formatJam = (instant: Date, zona: number): string => {
  const shifted = new Date(instant.getTime() + zona * 3_600_000);
  return `${String(shifted.getUTCHours()).padStart(2, '0')}:${String(shifted.getUTCMinutes()).padStart(2, '0')}`;
};

/** Prayer times for a calendar date (YYYY-MM-DD) in the city. */
export const jadwalSholat = (
  kota: Pick<Kota, 'lat' | 'lon' | 'elevasi' | 'zona'>,
  tanggal: string,
): JadwalHari => {
  const [y, m, d] = tanggal.split('-').map(Number) as [number, number, number];
  // adhan reads the local calendar date of this Date; build it at local noon
  // so every browser time zone lands on the same day.
  const date = new Date(y, m - 1, d, 12);
  const times = new PrayerTimes(
    new Coordinates(kota.lat, kota.lon),
    date,
    params(kota.elevasi),
  );
  const minutes = (n: number) => n * 60_000;
  const instan: Record<Waktu, Date> = {
    imsak: new Date(
      times.fajr.getTime() - minutes(KEMENAG_PARAMS.imsakBeforeFajrMinutes),
    ),
    subuh: times.fajr,
    terbit: times.sunrise,
    dhuha: new Date(
      times.sunrise.getTime() +
        minutes(KEMENAG_PARAMS.dhuhaAfterSunriseMinutes),
    ),
    dzuhur: times.dhuhr,
    ashar: times.asr,
    maghrib: times.maghrib,
    isya: times.isha,
  };
  const waktu = Object.fromEntries(
    WAKTU.map((key) => [key, formatJam(instan[key], kota.zona)]),
  ) as Record<Waktu, string>;
  return { tanggal, waktu, instan };
};

/** All days of a month (month 1-12). */
export const jadwalBulanan = (
  kota: Pick<Kota, 'lat' | 'lon' | 'elevasi' | 'zona'>,
  tahun: number,
  bulan: number,
): JadwalHari[] => {
  const days = new Date(Date.UTC(tahun, bulan, 0)).getUTCDate();
  return Array.from({ length: days }, (_, index) =>
    jadwalSholat(
      kota,
      `${tahun}-${String(bulan).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`,
    ),
  );
};

/** Qibla direction in degrees from true north. */
export const arahKiblat = (lat: number, lon: number): number =>
  Qibla(new Coordinates(lat, lon));

/** Today's date (YYYY-MM-DD) in the city's time zone. */
export const hariIniDiKota = (zona: number, now = new Date()): string =>
  new Date(now.getTime() + zona * 3_600_000).toISOString().slice(0, 10);

const hijriParts = (tanggal: string) => {
  const [y, m, d] = tanggal.split('-').map(Number) as [number, number, number];
  const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).formatToParts(new Date(Date.UTC(y, m - 1, d)));
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value.replace(/\D/g, ''));
  return { day: get('day'), month: get('month'), year: get('year') };
};

/**
 * Days of Ramadan for a Hijri year, by the Umm al-Qura calendar. Indonesia
 * fixes the start by sidang isbat, so these dates are an estimate until
 * then (the page labels them).
 */
export const tanggalRamadan = (
  tahunHijriah: number,
): { tanggal: string; hari: number }[] => {
  const result: { tanggal: string; hari: number }[] = [];
  const cursor = new Date(Date.UTC(tahunHijriah - 1448 + 2027, 0, 1));
  for (let i = 0; i < 400 && result.length < 30; i += 1) {
    const iso = cursor.toISOString().slice(0, 10);
    const hijri = hijriParts(iso);
    if (hijri.year === tahunHijriah && hijri.month === 9)
      result.push({ tanggal: iso, hari: hijri.day });
    else if (result.length > 0) break;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
};
