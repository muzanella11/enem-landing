import { describe, expect, it } from 'vitest';
import {
  dendaPelayanan,
  hitungTunggakan,
  iuranKeluarga,
} from './bpjs-mandiri.js';
import { bagiBulat, hitungPatungan, teksPatungan } from './patungan.js';

describe('BPJS mandiri', () => {
  it('family contribution uses what members pay (kelas 3 after subsidy)', () => {
    expect(iuranKeluarga({ 1: 0, 2: 2, 3: 0 })).toBe(200_000);
    expect(iuranKeluarga({ 1: 1, 2: 0, 3: 3 })).toBe(150_000 + 3 * 35_000);
  });

  it('arrears are capped at 24 months', () => {
    expect(hitungTunggakan(100_000, 6)).toBe(600_000);
    expect(hitungTunggakan(100_000, 30)).toBe(2_400_000);
  });

  it('service penalty: 5% x cost x months (max 12), capped at Rp30 juta', () => {
    expect(dendaPelayanan(10_000_000, 6)).toBe(3_000_000);
    expect(dendaPelayanan(10_000_000, 20)).toBe(6_000_000);
    expect(dendaPelayanan(100_000_000, 12)).toBe(30_000_000);
  });
});

describe('patungan', () => {
  it('rounding keeps the exact total', () => {
    const parts = bagiBulat([33_333.4, 33_333.3, 33_333.3], 100_000, 500);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(100_000);
    expect(parts).toEqual([33_500, 33_500, 33_000]);
    expect(bagiBulat([10, 10, 10], 31, 1).reduce((a, b) => a + b, 0)).toBe(31);
  });

  it('items per person, shared items, proportional tax and service', () => {
    const hasil = hitungPatungan({
      orang: ['Ana', 'Budi'],
      item: [
        { nama: 'Steak', harga: 100_000, untuk: [0] },
        { nama: 'Nasi goreng', harga: 50_000, untuk: [1] },
        { nama: 'Es teh', harga: 20_000, untuk: [] },
      ],
      pajakPersen: 10,
      servicePersen: 5,
      diskon: 0,
      ongkir: 0,
      pembulatan: 1,
    });
    // 170.000 + 5% service = 178.500, + 10% tax = 196.350
    expect(hasil.total).toBe(196_350);
    expect(hasil.perOrang.map((p) => p.item)).toEqual([110_000, 60_000]);
    expect(hasil.perOrang[0]!.bayar + hasil.perOrang[1]!.bayar).toBe(196_350);
    expect(hasil.perOrang[0]!.bayar).toBe(
      Math.round((110_000 / 170_000) * 196_350),
    );
  });

  it('discount and delivery spread proportionally; text for WhatsApp', () => {
    const hasil = hitungPatungan({
      orang: ['A', 'B', 'C'],
      item: [{ nama: 'Pizza', harga: 150_000, untuk: [] }],
      pajakPersen: 0,
      servicePersen: 0,
      diskon: 30_000,
      ongkir: 10_000,
      pembulatan: 1000,
    });
    expect(hasil.total).toBe(130_000);
    expect(hasil.perOrang.map((p) => p.bayar).reduce((a, b) => a + b)).toBe(
      130_000,
    );
    expect(teksPatungan(hasil, 'Makan malam', (n) => `Rp${n}`)).toContain(
      '- A: Rp',
    );
  });
});
