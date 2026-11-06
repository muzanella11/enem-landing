import { describe, expect, it } from 'vitest';
import {
  gramDariRupiah,
  nilaiEmas,
  nilaiPerhiasan,
  perubahanHarian,
  untungRugi,
} from './emas.js';

describe('emas', () => {
  it('converts gram and rupiah both ways', () => {
    expect(nilaiEmas(2.5, 2_000_000)).toBe(5_000_000);
    expect(gramDariRupiah(5_000_000, 2_000_000)).toBe(2.5);
    expect(gramDariRupiah(1_000_000, 0)).toBe(0);
  });

  it('values jewelry by purity minus making charge', () => {
    expect(nilaiPerhiasan(10, 75, 2_000_000)).toBe(15_000_000);
    expect(nilaiPerhiasan(10, 75, 2_000_000, 500_000)).toBe(14_500_000);
    expect(nilaiPerhiasan(1, 10, 100, 1_000)).toBe(0);
  });

  it('profit and loss', () => {
    expect(untungRugi(10, 1_500_000, 2_000_000)).toEqual({
      modal: 15_000_000,
      nilai: 20_000_000,
      selisih: 5_000_000,
      persen: (5 / 15) * 100,
    });
  });

  it('daily change needs two points', () => {
    expect(perubahanHarian([{ pricePerGram: 100 }])).toBeNull();
    expect(
      perubahanHarian([{ pricePerGram: 100 }, { pricePerGram: 110 }]),
    ).toEqual({ rupiah: 10, persen: 10 });
  });
});
