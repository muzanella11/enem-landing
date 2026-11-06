import { describe, expect, it } from 'vitest';
import {
  bulatkanFraksi,
  fraksi,
  hargaImpas,
  hargaRataRata,
  hargaTarget,
  hitungDividen,
  hitungTransaksi,
  lotDariModal,
  lotUntukTarget,
  nilaiJualReksaDana,
  unitReksaDana,
} from './saham.js';

describe('fraksi harga BEI', () => {
  it.each([
    [199, 1],
    [200, 2],
    [499, 2],
    [500, 5],
    [1995, 5],
    [2000, 10],
    [4990, 10],
    [5000, 25],
  ])('price %i -> tick %i', (harga, tick) => expect(fraksi(harga)).toBe(tick));

  it('rounds to valid prices, including across band edges', () => {
    expect(bulatkanFraksi(1003)).toBe(1005);
    expect(bulatkanFraksi(1003, false)).toBe(1000);
    expect(bulatkanFraksi(4995)).toBe(5000);
    expect(bulatkanFraksi(5010)).toBe(5025);
  });
});

describe('transaksi saham', () => {
  it('fees and the 0,1% sale tax', () => {
    const r = hitungTransaksi({
      hargaBeli: 1000,
      lot: 10,
      hargaJual: 1100,
      feeBeliPersen: 0.15,
      feeJualPersen: 0.25,
    });
    expect(r.lembar).toBe(1000);
    expect(r.modal).toBeCloseTo(1_001_500, 6);
    expect(r.pph).toBeCloseTo(1_100, 6);
    expect(r.diterima).toBeCloseTo(1_100_000 - 2_750 - 1_100, 6);
    expect(r.laba).toBeCloseTo(94_650, 6);
  });

  it('break-even and target prices land on valid ticks', () => {
    // 1000 x 1,0015 / 0,9965 = 1005,0... -> next tick 1010
    expect(hargaImpas(1000, 0.15, 0.25)).toBe(1010);
    expect(hargaTarget(1000, 10, 0.15, 0.25) % 5).toBe(0);
    expect(lotDariModal(10_000_000, 1000, 0.15)).toBe(99);
  });
});

describe('average down', () => {
  it('weighted average and lots needed for a target', () => {
    expect(
      hargaRataRata([
        { harga: 1000, lot: 10 },
        { harga: 800, lot: 10 },
      ]),
    ).toBe(900);
    // avg 1000 x 10 lots, buy at 800 to reach 900: 10 lots
    expect(lotUntukTarget(1000, 10, 800, 900)).toBe(10);
    expect(lotUntukTarget(1000, 10, 800, 750)).toBeNull();
  });
});

describe('dividen dan reksa dana', () => {
  it('dividend tax and yield', () => {
    expect(
      hitungDividen({
        dividenPerLembar: 50,
        lot: 10,
        hargaBeli: 1000,
        bebasPajak: false,
      }),
    ).toEqual({ bruto: 50_000, pajak: 5_000, bersih: 45_000, yieldPersen: 5 });
    expect(
      hitungDividen({
        dividenPerLembar: 50,
        lot: 10,
        hargaBeli: 1000,
        bebasPajak: true,
      }).pajak,
    ).toBe(0);
  });

  it('mutual fund units and redemption', () => {
    expect(unitReksaDana(1_000_000, 1250, 1)).toEqual({
      biaya: 10_000,
      unit: 792,
    });
    expect(nilaiJualReksaDana(792, 1500, 0.5).bersih).toBeCloseTo(
      1_188_000 * 0.995,
      6,
    );
  });
});
