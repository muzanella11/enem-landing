import { describe, expect, it } from 'vitest';
import { TARIF_LISTRIK } from '../data/listrik/tarif.js';
import { kwhBulanan, kwhDariNominal, nominalDariKwh } from './listrik.js';

const golongan = (id: string) =>
  TARIF_LISTRIK.golongan.find((item) => item.id === id)!;

describe('kwhDariNominal', () => {
  it('1.300 VA, Rp100.000, 3% regional tax, no admin', () => {
    const result = kwhDariNominal({
      golongan: golongan('r1-1300'),
      nominal: 100_000,
      admin: 0,
      pajakDaerahPersen: 3,
    });
    // 100.000 / 1,03 = 97.087,4 -> / 1.444,70 = 67,2 kWh
    expect(result.kwh).toBe(67.2);
    expect(result.nilaiListrik).toBe(97_087);
    expect(result.pajakDaerah).toBe(2_913);
  });

  it('admin fee is taken first', () => {
    const tanpa = kwhDariNominal({
      golongan: golongan('r1-900'),
      nominal: 50_000,
      admin: 0,
      pajakDaerahPersen: 0,
    });
    const dengan = kwhDariNominal({
      golongan: golongan('r1-900'),
      nominal: 50_000,
      admin: 2_500,
      pajakDaerahPersen: 0,
    });
    expect(tanpa.kwh).toBe(82.6);
    expect(dengan.kwh).toBe(78.5);
  });

  it('adds PPN only for R-3', () => {
    const r2 = kwhDariNominal({
      golongan: golongan('r2-3500'),
      nominal: 500_000,
      admin: 0,
      pajakDaerahPersen: 0,
    });
    const r3 = kwhDariNominal({
      golongan: golongan('r3-6600'),
      nominal: 500_000,
      admin: 0,
      pajakDaerahPersen: 0,
    });
    expect(r2.ppn).toBe(0);
    expect(r3.ppn).toBeGreaterThan(0);
    expect(r3.kwh).toBeLessThan(r2.kwh);
  });

  it('nominal below the admin fee gives zero kWh', () => {
    expect(
      kwhDariNominal({
        golongan: golongan('r1-450'),
        nominal: 1_000,
        admin: 2_500,
        pajakDaerahPersen: 3,
      }).kwh,
    ).toBe(0);
  });
});

describe('nominalDariKwh', () => {
  it('is the inverse of kwhDariNominal (within rounding)', () => {
    const tarif = golongan('r1-2200');
    const nominal = nominalDariKwh(tarif, 100, 0, 5);
    expect(
      kwhDariNominal({
        golongan: tarif,
        nominal,
        admin: 0,
        pajakDaerahPersen: 5,
      }).kwh,
    ).toBe(100);
  });
});

describe('kwhBulanan', () => {
  it('sums watt x hours x count over 30 days', () => {
    expect(
      kwhBulanan([
        { nama: 'AC', watt: 350, jam: 8, jumlah: 1 },
        { nama: 'Lampu', watt: 10, jam: 8, jumlah: 6 },
      ]),
    ).toBe(98.4);
  });
});
