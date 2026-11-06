import { describe, expect, it } from 'vitest';
import {
  hargaDariMargin,
  hargaDariMarkup,
  hargaMinimal,
  hitungBep,
  hitungPphUmkm,
  hppPerUnit,
  marginDariMarkup,
  markupDariMargin,
  pendapatanBersih,
} from './index.js';

describe('HPP, margin, markup', () => {
  it('HPP per unit', () => {
    expect(
      hppPerUnit(
        { bahan: 500_000, tenagaKerja: 200_000, overhead: 100_000 },
        100,
      ),
    ).toBe(8_000);
    expect(hppPerUnit({ bahan: 1, tenagaKerja: 0, overhead: 0 }, 0)).toBe(0);
  });

  it('margin vs markup', () => {
    expect(hargaDariMargin(8_000, 20)).toBe(10_000);
    expect(hargaDariMarkup(8_000, 25)).toBe(10_000);
    expect(marginDariMarkup(25)).toBeCloseTo(20);
    expect(markupDariMargin(20)).toBeCloseTo(25);
    expect(hargaDariMargin(1, 100)).toBe(Infinity);
  });
});

describe('BEP', () => {
  it('units and rupiah', () => {
    expect(hitungBep(5_000_000, 25_000, 15_000)).toEqual({
      unit: 500,
      rupiah: 12_500_000,
      kontribusiPerUnit: 10_000,
    });
    expect(hitungBep(1_000, 10_000, 3_000)!.unit).toBe(1);
    expect(hitungBep(1_000, 10_000, 10_000)).toBeNull();
  });
});

describe('marketplace', () => {
  const fee = {
    adminPersen: 8,
    layananPersen: 2,
    biayaPerPesanan: 1_000,
    voucherPenjual: 0,
    ongkirDitanggung: 0,
  };
  it('net income and the minimum price round-trip', () => {
    const net = pendapatanBersih(100_000, 60_000, fee);
    expect(net.potongan).toBe(11_000);
    expect(net.laba).toBe(29_000);
    const harga = hargaMinimal(
      60_000,
      { ...fee, voucherPenjual: 5_000 },
      10_000,
    );
    expect(
      pendapatanBersih(harga, 60_000, { ...fee, voucherPenjual: 5_000 }).laba,
    ).toBeGreaterThanOrEqual(10_000);
    expect(
      pendapatanBersih(harga - 1, 60_000, { ...fee, voucherPenjual: 5_000 })
        .laba,
    ).toBeLessThan(10_000);
  });
});

describe('PPh final UMKM', () => {
  it('individual: nothing due until cumulative turnover passes Rp500 juta', () => {
    expect(hitungPphUmkm('op', 100_000_000, 300_000_000)).toMatchObject({
      pph: 0,
      sisaBebas: 100_000_000,
    });
    // Exactly at the limit: still zero.
    expect(hitungPphUmkm('op', 100_000_000, 400_000_000).pph).toBe(0);
    // Crossing: only the part above Rp500 juta is taxed.
    expect(hitungPphUmkm('op', 100_000_000, 450_000_000)).toMatchObject({
      omzetKenaPajak: 50_000_000,
      pph: 250_000,
    });
    expect(hitungPphUmkm('op', 100_000_000, 600_000_000).pph).toBe(500_000);
  });

  it('perseroan perorangan and koperasi have no exemption', () => {
    expect(hitungPphUmkm('pp', 100_000_000, 0).pph).toBe(500_000);
    expect(hitungPphUmkm('koperasi', 10_000_000, 0).pph).toBe(50_000);
  });

  it('other entities are not eligible; Rp4,8 miliar is flagged', () => {
    expect(hitungPphUmkm('badan-lain', 100_000_000, 0).berhak).toBe(false);
    expect(hitungPphUmkm('op', 100_000_000, 4_750_000_000).melewatiBatas).toBe(
      true,
    );
  });
});
