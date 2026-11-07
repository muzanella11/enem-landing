import { describe, expect, it } from 'vitest';
import { KALENDER_LIBUR } from '../../data/libur/index.js';
import {
  buatIcs,
  hariDalamMinggu,
  hitungHariKerja,
  saranLongWeekend,
} from './index.js';

const libur2026 = KALENDER_LIBUR[2026]!.entries.filter(
  (day) => day.jenis !== 'fakultatif-hindu',
);

describe('BI 2026 data', () => {
  it('weekday names in the PDF match the dates', () => {
    // Spot checks against the "Hari" column of the BI PDF.
    expect(hariDalamMinggu('2026-01-01')).toBe(4); // Kamis
    expect(hariDalamMinggu('2026-03-21')).toBe(6); // Sabtu
    expect(hariDalamMinggu('2026-12-25')).toBe(5); // Jumat
    expect(hariDalamMinggu('2026-02-16')).toBe(1); // Senin
  });

  it('has 17 holidays and 8 joint leave days', () => {
    expect(
      KALENDER_LIBUR[2026]!.entries.filter((day) => day.jenis === 'libur'),
    ).toHaveLength(17);
    expect(
      KALENDER_LIBUR[2026]!.entries.filter(
        (day) => day.jenis === 'cuti-bersama',
      ),
    ).toHaveLength(8);
  });

  it('2027 waits for the BI publication', () => {
    expect(KALENDER_LIBUR[2027]!.status).toBe('menunggu');
    expect(KALENDER_LIBUR[2027]!.entries).toHaveLength(0);
  });
});

describe('hitungHariKerja', () => {
  it('counts a plain week (5-day pattern)', () => {
    expect(
      hitungHariKerja('2026-11-02', '2026-11-08', 5, libur2026),
    ).toMatchObject({
      hariKalender: 7,
      hariKerja: 5,
      akhirPekan: 2,
    });
  });

  it('skips holidays and joint leave (Lebaran 2026)', () => {
    const result = hitungHariKerja('2026-03-16', '2026-03-27', 5, libur2026);
    // 16-27 Mar: 10 weekdays, minus 18 (cuti), 19 (Nyepi), 20, 23, 24 (cuti) = 5.
    expect(result.hariKerja).toBe(5);
    expect(result.liburTerlewati.map((day) => day.tanggal)).toEqual([
      '2026-03-18',
      '2026-03-19',
      '2026-03-20',
      '2026-03-23',
      '2026-03-24',
    ]);
  });

  it('6-day pattern works Saturdays', () => {
    expect(
      hitungHariKerja('2026-11-02', '2026-11-08', 6, libur2026).hariKerja,
    ).toBe(6);
  });

  it('accepts reversed dates', () => {
    expect(
      hitungHariKerja('2026-11-08', '2026-11-02', 5, libur2026).hariKerja,
    ).toBe(5);
  });
});

describe('saranLongWeekend', () => {
  it('finds the Lebaran 2026 block', () => {
    const suggestions = saranLongWeekend(2026, 5, libur2026);
    const lebaran = suggestions.find(
      (item) => item.mulai <= '2026-03-21' && item.selesai >= '2026-03-24',
    );
    expect(lebaran).toBeTruthy();
    expect(lebaran!.totalHari).toBeGreaterThanOrEqual(7);
  });

  it('suggests bridging leave next to a Thursday holiday', () => {
    // Kenaikan 14 Mei (Kamis) + cuti 15 Mei (Jumat) = 4-day weekend with no leave.
    const kenaikan = saranLongWeekend(2026, 5, libur2026).find(
      (item) => item.mulai === '2026-05-14',
    );
    expect(kenaikan).toMatchObject({
      selesai: '2026-05-17',
      totalHari: 4,
      cutiDiperlukan: [],
    });
  });
});

describe('buatIcs', () => {
  it('writes one all-day VEVENT per holiday', () => {
    const ics = buatIcs(libur2026.slice(0, 2), 'Libur 2026');
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain('DTSTART;VALUE=DATE:20260101');
    expect(ics).toContain('DTEND;VALUE=DATE:20260102');
    expect(ics).toContain('\r\n');
  });

  it('escapes commas, semicolons, and backslashes in names', () => {
    const ics = buatIcs(
      [
        {
          tanggal: '2026-01-01',
          nama: 'A, B; C\\D',
          jenis: 'libur',
          dapatBerubah: false,
        },
      ],
      'X',
    );
    expect(ics).toContain('SUMMARY:A\\, B\\; C\\\\D');
  });
});
