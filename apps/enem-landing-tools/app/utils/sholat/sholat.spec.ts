import { describe, expect, it } from 'vitest';
import { KOTA } from '../../data/sholat/kota.js';
import {
  arahKiblat,
  formatJam,
  hariIniDiKota,
  jadwalBulanan,
  jadwalSholat,
  tanggalRamadan,
  WAKTU,
} from './index.js';

/**
 * Reference schedules from api.myquran.com (Kemenag RI data), fetched
 * 2026-11-06. Order: imsak subuh terbit dzuhur ashar maghrib isya.
 */
const REFERENCE: [string, string, string][] = [
  [
    'kota-jakarta-pusat',
    '2026-11-06',
    '03:57 04:07 05:23 11:40 14:57 17:50 19:02',
  ],
  [
    'kota-jakarta-pusat',
    '2027-02-15',
    '04:31 04:41 05:55 12:10 15:23 18:19 19:29',
  ],
  ['kota-bandung', '2026-11-06', '03:53 04:03 05:14 11:37 14:54 17:52 19:00'],
  ['kota-bandung', '2027-02-15', '04:27 04:37 05:47 12:07 15:19 18:21 19:27'],
  ['kota-surabaya', '2026-11-06', '03:32 03:42 04:58 11:16 14:33 17:28 18:40'],
  ['kota-surabaya', '2027-02-15', '04:06 04:16 05:30 11:47 14:58 17:57 19:07'],
  ['kota-makassar', '2026-11-06', '04:08 04:18 05:33 11:49 15:07 17:59 19:10'],
  ['kota-makassar', '2027-02-15', '04:41 04:51 06:05 12:20 15:34 18:28 19:38'],
  ['kota-jayapura', '2026-11-06', '03:47 03:57 05:11 11:24 14:44 17:30 18:42'],
  ['kota-jayapura', '2027-02-15', '04:19 04:29 05:42 11:55 15:11 18:00 19:10'],
  [
    'kota-banda-aceh',
    '2026-11-06',
    '04:58 05:08 06:22 12:26 15:46 18:23 19:34',
  ],
  [
    'kota-banda-aceh',
    '2027-02-15',
    '05:28 05:38 06:51 12:56 16:16 18:54 20:04',
  ],
];

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number) as [number, number];
  return h * 60 + m;
};

describe('jadwalSholat vs Kemenag reference', () => {
  it.each(REFERENCE)(
    '%s on %s is within 2 minutes',
    (slug, tanggal, expected) => {
      const kota = KOTA.find((item) => item.slug === slug)!;
      expect(kota).toBeTruthy();
      const { waktu } = jadwalSholat(kota, tanggal);
      const ours = [
        waktu.imsak,
        waktu.subuh,
        waktu.terbit,
        waktu.dzuhur,
        waktu.ashar,
        waktu.maghrib,
        waktu.isya,
      ];
      expected.split(' ').forEach((reference, index) => {
        expect(
          Math.abs(toMinutes(ours[index]!) - toMinutes(reference)),
        ).toBeLessThanOrEqual(2);
      });
    },
  );
});

describe('helpers', () => {
  it('returns every prayer in order', () => {
    const { waktu } = jadwalSholat(KOTA[0]!, '2027-01-01');
    const minutes = WAKTU.map((key) => toMinutes(waktu[key]));
    expect([...minutes].sort((a, b) => a - b)).toEqual(minutes);
  });

  it('formats in the city zone regardless of the machine zone', () => {
    expect(formatJam(new Date('2026-11-05T21:07:00Z'), 7)).toBe('04:07');
    expect(formatJam(new Date('2026-11-05T21:07:00Z'), 9)).toBe('06:07');
  });

  it('builds a full month', () => {
    expect(jadwalBulanan(KOTA[0]!, 2027, 2)).toHaveLength(28);
  });

  it('today in a city zone', () => {
    expect(hariIniDiKota(9, new Date('2026-11-05T16:00:00Z'))).toBe(
      '2026-11-06',
    );
    expect(hariIniDiKota(7, new Date('2026-11-05T16:00:00Z'))).toBe(
      '2026-11-05',
    );
  });

  it('qibla from Jakarta points north-west (about 295 degrees)', () => {
    expect(arahKiblat(-6.1754, 106.8272)).toBeCloseTo(295.15, 0);
  });

  it('Ramadan 1448 H spans 29 or 30 days starting February 2027', () => {
    const days = tanggalRamadan(1448);
    expect(days.length).toBeGreaterThanOrEqual(29);
    expect(days[0]!.hari).toBe(1);
    expect(days[0]!.tanggal.startsWith('2027-02')).toBe(true);
  });

  it('city slugs are unique and every zone is valid', () => {
    expect(new Set(KOTA.map((kota) => kota.slug)).size).toBe(KOTA.length);
    expect(KOTA.every((kota) => [7, 8, 9].includes(kota.zona))).toBe(true);
    expect(KOTA.length).toBeGreaterThan(500);
  });
});
