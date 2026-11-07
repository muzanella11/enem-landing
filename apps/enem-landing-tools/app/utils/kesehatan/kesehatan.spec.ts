import { describe, expect, it } from 'vitest';
import {
  beratNormal,
  bmrMifflin,
  hitungHpl,
  hitungImt,
  hitungKalori,
  kategoriKemenkes,
  kategoriWhoAsia,
  masaSubur,
} from './index.js';

describe('IMT', () => {
  it('computes and rounds to one decimal', () => {
    expect(hitungImt(70, 175)).toBe(22.9);
    expect(hitungImt(0, 170)).toBe(0);
  });

  it.each([
    [16.9, 'Kurus (kekurangan berat badan tingkat berat)'],
    [17.0, 'Kurus (kekurangan berat badan tingkat ringan)'],
    [18.4, 'Kurus (kekurangan berat badan tingkat ringan)'],
    [18.5, 'Normal'],
    [25.0, 'Normal'],
    [25.1, 'Gemuk (kelebihan berat badan tingkat ringan)'],
    [27.0, 'Gemuk (kelebihan berat badan tingkat ringan)'],
    [27.1, 'Gemuk (kelebihan berat badan tingkat berat)'],
  ])('Kemenkes boundary %d', (imt, label) => {
    expect(kategoriKemenkes(imt).label).toBe(label);
  });

  it.each([
    [18.4, 'Berat badan kurang'],
    [22.9, 'Normal'],
    [23.0, 'Berisiko (overweight)'],
    [25.0, 'Obesitas I'],
    [30.0, 'Obesitas II'],
  ])('WHO Asia-Pacific boundary %d', (imt, label) => {
    expect(kategoriWhoAsia(imt).label).toBe(label);
  });

  it('normal weight range for 160 cm', () => {
    expect(beratNormal(160)).toEqual({ min: 47.4, max: 64 });
  });
});

describe('kalori (Mifflin-St Jeor)', () => {
  it('matches the published equation', () => {
    // 10*70 + 6.25*175 - 5*30 + 5 = 1648.75
    expect(bmrMifflin('pria', 70, 175, 30)).toBeCloseTo(1648.75);
    // 10*60 + 6.25*160 - 5*30 - 161 = 1289
    expect(bmrMifflin('wanita', 60, 160, 30)).toBe(1289);
  });

  it('activity factor and safe targets', () => {
    const result = hitungKalori('wanita', 60, 160, 30, 'sedenter');
    expect(result.tdee).toBe(Math.round(1289 * 1.2));
    const turun = result.target[0]!;
    expect(turun.kkal).toBe(Math.round(1289 * 1.2 - 550));
    expect(turun.dibawahMinimum).toBe(true); // 997 < 1.200
  });
});

describe('HPL (Naegele)', () => {
  it('HPHT + 280 days for a 28-day cycle', () => {
    expect(hitungHpl('2026-01-01').hpl).toBe('2026-10-08');
  });

  it('shifts for longer and shorter cycles', () => {
    expect(hitungHpl('2026-01-01', 35).hpl).toBe('2026-10-15');
    expect(hitungHpl('2026-01-01', 25).hpl).toBe('2026-10-05');
  });

  it('gestational age and trimester', () => {
    const result = hitungHpl('2026-01-01', 28, '2026-04-09'); // day 98
    expect(result.usia).toEqual({ minggu: 14, hari: 0 });
    expect(result.trimester).toBe(2);
    expect(hitungHpl('2026-01-01', 28, '2026-04-08').usia).toEqual({
      minggu: 13,
      hari: 6,
    });
    expect(hitungHpl('2026-01-01', 28, '2026-04-08').trimester).toBe(1);
    expect(hitungHpl('2026-01-01', 28, '2025-12-31').usia).toBeNull();
  });
});

describe('masa subur', () => {
  it('28-day cycle: ovulation day 14, window day 9-15', () => {
    const [first] = masaSubur('2026-11-01', 28);
    expect(first).toEqual({
      haid: '2026-11-01',
      ovulasi: '2026-11-15',
      suburMulai: '2026-11-10',
      suburSelesai: '2026-11-16',
      haidBerikut: '2026-11-29',
    });
  });

  it('32-day cycle shifts ovulation later and repeats per cycle', () => {
    const cycles = masaSubur('2026-11-01', 32, 2);
    expect(cycles[0]!.ovulasi).toBe('2026-11-19');
    expect(cycles[1]!.haid).toBe('2026-12-03');
    expect(cycles[1]!.ovulasi).toBe('2026-12-21');
  });
});
