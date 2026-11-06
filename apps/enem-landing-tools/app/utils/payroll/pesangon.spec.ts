import { describe, expect, it } from 'vitest';
import {
  ALASAN_PHK,
  tabelUp,
  tabelUpmk,
} from '../../data/pesangon/pp-35-2021.js';
import { hitungPesangon, pphPesangon } from './pesangon.js';

const base = {
  masaKerjaBulan: 0,
  upah: 10_000_000,
  alasanId: 'efisiensi-cegah-rugi',
  sisaCutiHari: 0,
  hariKerjaSebulan: 21,
  biayaPulang: 0,
  uangPisah: 0,
};

describe('UP and UPMK tables (Pasal 40)', () => {
  it.each([
    [0, 1, 0],
    [0.9, 1, 0],
    [1, 2, 0],
    [2, 3, 0],
    [3, 4, 2],
    [5, 6, 2],
    [6, 7, 3],
    [8, 9, 3],
    [9, 9, 4],
    [12, 9, 5],
    [15, 9, 6],
    [18, 9, 7],
    [21, 9, 8],
    [23, 9, 8],
    [24, 9, 10],
  ])('%d years -> UP %d, UPMK %d months', (tahun, up, upmk) => {
    expect(tabelUp(tahun)).toBe(up);
    expect(tabelUpmk(tahun)).toBe(upmk);
  });
});

describe('hitungPesangon', () => {
  it('efisiensi to prevent loss, 10 years: 1x UP (9) + 1x UPMK (4)', () => {
    const result = hitungPesangon({ ...base, masaKerjaBulan: 120 });
    expect(result.up).toBe(90_000_000);
    expect(result.upmk).toBe(40_000_000);
    expect(result.bruto).toBe(130_000_000);
  });

  it('applies the reason multiplier (pensiun 1,75x UP)', () => {
    const result = hitungPesangon({
      ...base,
      masaKerjaBulan: 120,
      alasanId: 'pensiun',
    });
    expect(result.up).toBe(157_500_000);
  });

  it('uses full years only (35 months = 2 years)', () => {
    const result = hitungPesangon({ ...base, masaKerjaBulan: 35 });
    expect(result.masaKerjaTahun).toBe(2);
    expect(result.bulanUp).toBe(3);
    expect(result.bulanUpmk).toBe(0);
  });

  it('resignation: no UP/UPMK, but UPH and uang pisah', () => {
    const result = hitungPesangon({
      ...base,
      masaKerjaBulan: 60,
      alasanId: 'mengundurkan-diri',
      sisaCutiHari: 6,
      uangPisah: 2_000_000,
    });
    expect(result.up + result.upmk).toBe(0);
    expect(result.uph).toBe(Math.round(6 * (10_000_000 / 21)));
    expect(result.uangPisah).toBe(2_000_000);
  });

  it('every reason exists and has sane multipliers', () => {
    for (const alasan of ALASAN_PHK) {
      expect(alasan.up).toBeGreaterThanOrEqual(0);
      expect(alasan.up).toBeLessThanOrEqual(2);
    }
  });
});

describe('pphPesangon (PP 68/2009)', () => {
  it.each([
    [50_000_000, 0],
    [100_000_000, 2_500_000],
    [130_000_000, 2_500_000 + 4_500_000],
    [600_000_000, 2_500_000 + 60_000_000 + 25_000_000],
  ])('bruto %d -> %d', (bruto, pajak) => {
    expect(pphPesangon(bruto).total).toBe(pajak);
  });
});
