import { describe, expect, it } from 'vitest';
import { bungaKur } from '../data/kur/index.js';
import { jenisDariPlafon, simulasiKur } from './kur.js';

describe('KUR', () => {
  it('type from plafon', () => {
    expect(jenisDariPlafon(10_000_000)).toBe('super-mikro');
    expect(jenisDariPlafon(10_000_001)).toBe('mikro');
    expect(jenisDariPlafon(100_000_000)).toBe('mikro');
    expect(jenisDariPlafon(100_000_001)).toBe('kecil');
  });

  it('tiered rates', () => {
    expect(bungaKur('super-mikro', 'perdagangan', 3)).toBe(3);
    expect(bungaKur('mikro', 'produksi', 4)).toBe(6);
    expect(
      [1, 2, 3, 4, 5].map((n) => bungaKur('kecil', 'perdagangan', n)),
    ).toEqual([6, 7, 8, 9, 9]);
  });

  it.each([
    [12, 8_606_643],
    [24, 4_432_061],
    [36, 3_042_194],
    [48, 2_348_503],
    [60, 1_933_280],
  ])(
    'matches the BNI Rp100 juta table at 6%%, %i months',
    (tenor, angsuran) => {
      const r = simulasiKur({
        plafon: 100_000_000,
        tenorBulan: tenor,
        tujuan: 'investasi',
        sektor: 'produksi',
        urutan: 1,
      });
      expect(Math.abs(r.angsuran - angsuran)).toBeLessThanOrEqual(1);
    },
  );

  it('principal adds up and tenor limits warn', () => {
    const r = simulasiKur({
      plafon: 50_000_000,
      tenorBulan: 48,
      tujuan: 'modal-kerja',
      sektor: 'perdagangan',
      urutan: 2,
    });
    expect(r.bunga).toBe(7);
    expect(r.schedule.reduce((s, row) => s + row.principal, 0)).toBeCloseTo(
      50_000_000,
      2,
    );
    expect(r.peringatan[0]).toContain('paling lama 36 bulan');
  });
});
