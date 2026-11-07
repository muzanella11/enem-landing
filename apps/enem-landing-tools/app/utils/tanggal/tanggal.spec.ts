import { describe, expect, it } from 'vitest';
import {
  dariHijriah,
  hitungUmur,
  keHijriah,
  selisihHari,
  tambahHari,
  weton,
} from './index.js';

describe('weton', () => {
  it('anchor: 17 Agustus 1945 is Jumat Legi (neptu 11)', () => {
    expect(weton('1945-08-17')).toMatchObject({
      hari: 'Jumat',
      pasaran: 'Legi',
      neptu: 11,
    });
  });

  it('the pasaran cycles every 5 days, days of the week every 7', () => {
    expect(weton('1945-08-18').pasaran).toBe('Pahing');
    expect(weton('1945-08-22').pasaran).toBe('Legi');
    expect(weton('1945-08-12').pasaran).toBe('Legi');
    // 35 days later the same weton returns.
    expect(weton('1945-09-21')).toMatchObject({
      hari: 'Jumat',
      pasaran: 'Legi',
    });
  });

  it('works far from the anchor and across leap years', () => {
    expect(weton('2000-02-29').hari).toBe('Selasa');
    expect(weton('2026-11-06').hari).toBe('Jumat');
    const days = (Date.UTC(2026, 10, 6) - Date.UTC(1945, 7, 17)) / 86_400_000;
    expect(weton('2026-11-06').pasaran).toBe(
      ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'][days % 5],
    );
  });

  it('neptu values', () => {
    expect(weton('1945-08-20')).toMatchObject({
      hari: 'Senin',
      pasaran: 'Wage',
      neptu: 8,
    });
  });
});

describe('hijriah', () => {
  it('converts both ways', () => {
    const hijri = keHijriah('2026-11-06');
    expect(hijri.tahun).toBe(1448);
    expect(dariHijriah(hijri.tahun, hijri.bulan, hijri.hari)).toBe(
      '2026-11-06',
    );
  });

  it('1 Ramadan 1448 falls in February 2027', () => {
    expect(dariHijriah(1448, 9, 1)?.startsWith('2027-02')).toBe(true);
  });

  it('returns null for a day that does not exist', () => {
    expect(dariHijriah(1448, 9, 31)).toBeNull();
  });
});

describe('umur and dates', () => {
  it('age in years, months, days', () => {
    expect(hitungUmur('1990-05-20', '2026-11-06')).toMatchObject({
      tahun: 36,
      bulan: 5,
      hari: 17,
    });
  });

  it('end-of-month borrow uses the previous month length', () => {
    expect(hitungUmur('2026-01-31', '2026-03-01')).toMatchObject({
      tahun: 0,
      bulan: 1,
      hari: 1,
    });
  });

  it('29 February birthday falls on 28 February in common years', () => {
    expect(hitungUmur('2000-02-29', '2026-11-06').ulangTahunBerikutnya).toBe(
      '2027-02-28',
    );
  });

  it('differences and additions', () => {
    expect(selisihHari('2026-01-01', '2026-12-31')).toBe(364);
    expect(tambahHari('2026-12-30', 3)).toBe('2027-01-02');
  });
});
