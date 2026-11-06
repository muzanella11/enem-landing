import { describe, expect, it } from 'vitest';
import { hitungBphtb } from './loan/index.js';
import { biayaBalikNama, biayaBangun, hitungPbb } from './properti.js';

describe('biaya bangun', () => {
  it('area x cost plus contingency', () => {
    expect(biayaBangun([60, 40], 4_000_000, 10)).toEqual({
      luas: 100,
      dasar: 400_000_000,
      cadangan: 40_000_000,
      total: 440_000_000,
    });
  });
});

describe('PBB-P2', () => {
  it('NJOP minus NJOPTKP, assessment %, rate', () => {
    // NJOP 100 x 2jt + 50 x 1,5jt = 275jt; minus 10jt = 265jt; 100%; 0,1% -> 265.000
    expect(
      hitungPbb({
        luasTanah: 100,
        njopTanahM2: 2_000_000,
        luasBangunan: 50,
        njopBangunanM2: 1_500_000,
        njoptkp: 10_000_000,
        tarifPersen: 0.1,
        persenNjop: 100,
      }).pbb,
    ).toBe(265_000);
    // 40% assessment, 0,5% rate: 265jt x 40% x 0,5% = 530.000
    expect(
      hitungPbb({
        luasTanah: 100,
        njopTanahM2: 2_000_000,
        luasBangunan: 50,
        njopBangunanM2: 1_500_000,
        njoptkp: 10_000_000,
        tarifPersen: 0.5,
        persenNjop: 40,
      }).pbb,
    ).toBe(530_000);
  });
});

describe('balik nama', () => {
  it('BPHTB uses the shared Story 21 function and NPOP = max(price, NJOP)', () => {
    const result = biayaBalikNama({
      hargaTransaksi: 500_000_000,
      njop: 600_000_000,
      npoptkp: 80_000_000,
      tarifBphtbPersen: 5,
      honorPpatPersen: 1,
    });
    expect(result.npop).toBe(600_000_000);
    expect(result.bphtb).toBe(hitungBphtb(600_000_000, 80_000_000, 5));
    expect(result.bphtb).toBe(26_000_000);
    expect(result.pphPenjual).toBe(12_500_000);
    expect(result.honorPpat).toBe(5_000_000);
    // 600jt / 1000 + 50rb + cek 50rb
    expect(result.pnbpBpn).toBe(700_000);
  });

  it('BPHTB is zero below NPOPTKP', () => {
    expect(hitungBphtb(70_000_000, 80_000_000)).toBe(0);
  });
});
