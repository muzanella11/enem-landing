import { describe, expect, it } from 'vitest';
import { getPtkp, pasal17Tax } from './payroll/index.js';
import { PPH_23 } from '../data/tax/usaha.js';
import {
  hitungPph23,
  hitungPphSewa,
  hitungPpn,
  sewaBrutoDariNeto,
  simulasiSpt,
} from './pajak-usaha.js';

describe('PPN', () => {
  it('non-luxury: DPP 11/12, effective 11%, both directions', () => {
    const r = hitungPpn({
      harga: 1_000_000,
      sudahTermasuk: false,
      mewah: false,
    });
    expect(r.dpp).toBeCloseTo(916_666.67, 2);
    expect(r.ppn).toBeCloseTo(110_000, 6);
    expect(r.tarifEfektif).toBeCloseTo(11, 10);
    const balik = hitungPpn({
      harga: 1_110_000,
      sudahTermasuk: true,
      mewah: false,
    });
    expect(balik.hargaJual).toBeCloseTo(1_000_000, 6);
  });

  it('luxury goods: full 12%', () => {
    expect(
      hitungPpn({ harga: 1_000_000, sudahTermasuk: false, mewah: true }).ppn,
    ).toBeCloseTo(120_000, 6);
    expect(
      hitungPpn({ harga: 1_120_000, sudahTermasuk: true, mewah: true })
        .hargaJual,
    ).toBeCloseTo(1_000_000, 6);
  });
});

describe('PPh 23 dan sewa', () => {
  it('2% services, 15% royalties, doubled without NPWP', () => {
    expect(hitungPph23(10_000_000, 'jasa', true)).toEqual({
      tarif: 2,
      pph: 200_000,
      diterima: 9_800_000,
    });
    expect(hitungPph23(10_000_000, 'jasa', false).pph).toBe(400_000);
    expect(hitungPph23(10_000_000, 'royalti', true).pph).toBe(1_500_000);
  });

  it.each(PPH_23.map((j) => [j.id, j.tarif] as const))(
    '%s at %d%%, doubled without NPWP',
    (id, tarif) => {
      expect(hitungPph23(1_000_000, id, true).pph).toBeCloseTo(
        10_000 * tarif,
        6,
      );
      expect(hitungPph23(1_000_000, id, false).pph).toBeCloseTo(
        20_000 * tarif,
        6,
      );
    },
  );

  it('rent 10% final and gross-up', () => {
    expect(hitungPphSewa(50_000_000)).toEqual({
      tarif: 10,
      pph: 5_000_000,
      diterima: 45_000_000,
    });
    expect(sewaBrutoDariNeto(45_000_000)).toBeCloseTo(50_000_000, 6);
  });
});

describe('SPT tahunan', () => {
  it('one employer: withheld equals due -> nihil', () => {
    const neto = 120_000_000;
    const due = pasal17Tax(Math.floor((neto - getPtkp('TK/0')) / 1000) * 1000);
    expect(
      simulasiSpt({
        buktiPotong: [{ neto, pph21: due }],
        penghasilanLain: 0,
        zakat: 0,
        ptkp: 'TK/0',
      }).status,
    ).toBe('nihil');
  });

  it('two employers each withheld as if alone -> kurang bayar', () => {
    const satu = (neto: number) =>
      pasal17Tax(Math.floor((neto - getPtkp('TK/0')) / 1000) * 1000);
    const r = simulasiSpt({
      buktiPotong: [
        { neto: 120_000_000, pph21: satu(120_000_000) },
        { neto: 120_000_000, pph21: satu(120_000_000) },
      ],
      penghasilanLain: 0,
      zakat: 0,
      ptkp: 'TK/0',
    });
    expect(r.status).toBe('kurang-bayar');
    // PKP 240jt - 54jt = 186jt -> 5% x 60jt + 15% x 126jt = 21,9jt
    expect(r.pkp).toBe(186_000_000);
    expect(r.terutang).toBe(3_000_000 + (186_000_000 - 60_000_000) * 0.15);
  });

  it('other income raises tax; zakat lowers it; over-withholding gives lebih bayar', () => {
    const base = {
      buktiPotong: [{ neto: 100_000_000, pph21: 5_000_000 }],
      penghasilanLain: 0,
      zakat: 0,
      ptkp: 'K/1' as const,
    };
    expect(simulasiSpt(base).status).toBe('lebih-bayar');
    expect(
      simulasiSpt({ ...base, penghasilanLain: 50_000_000 }).terutang,
    ).toBeGreaterThan(simulasiSpt(base).terutang);
    expect(simulasiSpt({ ...base, zakat: 2_500_000 }).neto).toBe(97_500_000);
  });
});
