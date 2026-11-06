import { describe, expect, it } from 'vitest';
import {
  adminKca,
  angsuranFlat,
  cicilEmas,
  jumlahPeriode,
  tabelTebusKca,
  taksiranEmas,
  tebusKca,
} from './gadai.js';

describe('gadai emas KCA', () => {
  it('15-day periods: exactly on the boundary and one day after', () => {
    expect(jumlahPeriode(1)).toBe(1);
    expect(jumlahPeriode(15)).toBe(1);
    expect(jumlahPeriode(16)).toBe(2);
    expect(jumlahPeriode(120)).toBe(8);
  });

  it('redemption after one month at 1,2% per 15 days', () => {
    expect(tebusKca(10_000_000, 1.2, 30, 0)).toMatchObject({
      periode: 2,
      sewaModal: 240_000,
      tebusan: 10_240_000,
    });
    expect(tabelTebusKca(1_000_000, 1)).toHaveLength(8);
    expect(tabelTebusKca(1_000_000, 1)[7]!.sewaModal).toBe(80_000);
  });

  it('known admin fees and the gold value', () => {
    expect(adminKca(500_000)).toBe(2_000);
    expect(adminKca(30_000_000)).toBe(125_000);
    expect(adminKca(5_000_000)).toBeNull();
    expect(taksiranEmas(10, 75, 2_000_000)).toBe(15_000_000);
  });
});

describe('angsuran flat (Pegadaian simulations)', () => {
  it('Rp20 juta at 1,25% per month: 12 and 24 months', () => {
    // Pegadaian Customer Care: Rp1.916.667 (12 months) and Rp1.083.333 (24 months)
    expect(angsuranFlat(20_000_000, 1.25, 12).angsuran).toBe(1_916_667);
    expect(angsuranFlat(20_000_000, 1.25, 24).angsuran).toBe(1_083_333);
  });

  it('gold installment purchase', () => {
    const r = cicilEmas({
      gram: 10,
      hargaPerGram: 2_000_000,
      dpPersen: 20,
      tenorBulan: 12,
      marginPersenPerBulan: 1,
      admin: 50_000,
    });
    expect(r.dp).toBe(4_000_000);
    expect(r.angsuran).toBe(Math.round(16_000_000 / 12 + 160_000));
    expect(r.selisihDariTunai).toBe(160_000 * 12 + 50_000);
  });
});
