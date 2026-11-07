import { describe, expect, it } from 'vitest';
import { SATUAN_LOKAL } from '../data/satuan/index.js';
import {
  bulatkan,
  konversi,
  konversiSuhu,
  luasPersegiPanjang,
  luasTrapesium,
} from './satuan.js';

describe('konversi', () => {
  it('length, weight, volume, area, speed', () => {
    expect(konversi(1, 'mi', 'km', 'panjang')).toBeCloseTo(1.609344, 9);
    expect(konversi(1, 'kuintal', 'kg', 'berat')).toBe(100);
    expect(konversi(1, 'ons', 'g', 'berat')).toBeCloseTo(100, 9);
    expect(konversi(1, 'm3', 'l', 'volume')).toBe(1000);
    expect(konversi(1, 'ha', 'are', 'luas')).toBe(100);
    expect(konversi(36, 'kmh', 'ms', 'kecepatan')).toBeCloseTo(10, 9);
  });

  it('round trips', () => {
    expect(
      konversi(konversi(123.45, 'ft', 'cm', 'panjang')!, 'cm', 'ft', 'panjang'),
    ).toBeCloseTo(123.45, 9);
  });

  it('unknown units return null', () => {
    expect(konversi(1, 'x', 'm', 'panjang')).toBeNull();
  });
});

describe('suhu', () => {
  it.each([
    [100, 'C', 'F', 212],
    [32, 'F', 'C', 0],
    [0, 'C', 'K', 273.15],
    [80, 'R', 'C', 100],
  ] as const)('%d %s -> %s', (value, from, to, expected) => {
    expect(konversiSuhu(value, from, to)).toBeCloseTo(expected, 9);
  });
});

describe('land', () => {
  it('every local unit has at least one sourced variant', () => {
    for (const satuan of SATUAN_LOKAL) {
      expect(satuan.varian.length).toBeGreaterThan(0);
      for (const varian of satuan.varian)
        expect(varian.sumber.url).toMatch(/^https:\/\//);
    }
  });

  it('area helpers', () => {
    expect(luasPersegiPanjang(10, 14)).toBe(140);
    expect(luasTrapesium(10, 14, 5)).toBe(60);
  });

  it('display rounding', () => {
    expect(bulatkan(1 / 3)).toBe('0,333333');
  });
});
