import { describe, expect, it } from 'vitest';
import { terbilang } from './terbilang.js';

describe('terbilang', () => {
  it.each([
    [0, 'nol rupiah'],
    [1, 'satu rupiah'],
    [9, 'sembilan rupiah'],
    [10, 'sepuluh rupiah'],
    [11, 'sebelas rupiah'],
    [15, 'lima belas rupiah'],
    [20, 'dua puluh rupiah'],
    [99, 'sembilan puluh sembilan rupiah'],
    [100, 'seratus rupiah'],
    [101, 'seratus satu rupiah'],
    [115, 'seratus lima belas rupiah'],
    [250, 'dua ratus lima puluh rupiah'],
    [1000, 'seribu rupiah'],
    [1001, 'seribu satu rupiah'],
    [2000, 'dua ribu rupiah'],
    [11_000, 'sebelas ribu rupiah'],
    [100_000, 'seratus ribu rupiah'],
    [111_111, 'seratus sebelas ribu seratus sebelas rupiah'],
    [1_000_000, 'satu juta rupiah'],
    [1_250_000, 'satu juta dua ratus lima puluh ribu rupiah'],
    [12_500_000, 'dua belas juta lima ratus ribu rupiah'],
    [1_000_000_000, 'satu miliar rupiah'],
    [2_005_000_000, 'dua miliar lima juta rupiah'],
    [1_000_000_000_000, 'satu triliun rupiah'],
    [
      999_999_999_999_999,
      'sembilan ratus sembilan puluh sembilan triliun sembilan ratus sembilan puluh sembilan miliar sembilan ratus sembilan puluh sembilan juta sembilan ratus sembilan puluh sembilan ribu sembilan ratus sembilan puluh sembilan rupiah',
    ],
  ])('%d -> %s', (value, expected) => {
    expect(terbilang(value)).toBe(expected);
  });

  it('reads two decimals as sen', () => {
    expect(terbilang(1500.5)).toBe('seribu lima ratus rupiah lima puluh sen');
    expect(terbilang(10.05)).toBe('sepuluh rupiah lima sen');
  });

  it('reads decimals digit by digit without currency', () => {
    expect(terbilang(3.25, { currency: false })).toBe('tiga koma dua lima');
    expect(terbilang(3.5, { currency: false })).toBe('tiga koma lima');
  });

  it('supports title case and negatives', () => {
    expect(terbilang(1_200_000, { titleCase: true })).toBe(
      'Satu Juta Dua Ratus Ribu Rupiah',
    );
    expect(terbilang(-5)).toBe('minus lima rupiah');
  });

  it('rejects numbers above 999 triliun', () => {
    expect(() => terbilang(1e15)).toThrow(RangeError);
  });
});
