import { describe, expect, it } from 'vitest';
import { bulanTerlambat, hitungPkb } from './kendaraan.js';

describe('bulanTerlambat', () => {
  it('counts started months and caps at 24', () => {
    expect(bulanTerlambat('2026-05-10', '2026-05-10')).toBe(0);
    expect(bulanTerlambat('2026-05-10', '2026-05-11')).toBe(1);
    expect(bulanTerlambat('2026-05-10', '2026-06-10')).toBe(1);
    expect(bulanTerlambat('2026-05-10', '2026-06-11')).toBe(2);
    expect(bulanTerlambat('2020-01-01', '2026-01-01')).toBe(24);
  });
});

describe('hitungPkb', () => {
  const base = {
    roda: 'r2' as const,
    njkb: 20_000_000,
    bobot: 1,
    tarifPersen: 1.2,
    denganOpsen: true,
    bulanTerlambat: 0,
    gantiPlat: false,
  };

  it('PKB plus 66% opsen plus SWDKLLJ', () => {
    const result = hitungPkb(base);
    expect(result.pkb).toBe(240_000);
    expect(result.opsen).toBe(158_400);
    expect(result.swdkllj).toBe(35_000);
    expect(result.total).toBe(433_400);
  });

  it('no opsen (DKI) and the 5-yearly plate change adds STNK and TNKB', () => {
    const result = hitungPkb({
      ...base,
      roda: 'r4',
      njkb: 200_000_000,
      tarifPersen: 2,
      denganOpsen: false,
      gantiPlat: true,
    });
    expect(result.pkb).toBe(4_000_000);
    expect(result.opsen).toBe(0);
    expect(result.total).toBe(4_000_000 + 143_000 + 200_000 + 100_000);
  });

  it('late penalty: 1% per month on PKB and opsen, plus SWDKLLJ penalty', () => {
    const result = hitungPkb({ ...base, bulanTerlambat: 3 });
    expect(result.dendaPkb).toBe(7_200);
    expect(result.dendaOpsen).toBe(4_752);
    expect(result.dendaSwdkllj).toBe(32_000);
  });
});
