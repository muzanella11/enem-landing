import { describe, expect, it } from 'vitest';
import {
  cariKategori,
  hitungPremi,
  premiTjh,
  simulasiTahunan,
  wilayahProvinsi,
} from './asuransi.js';

const dasar = {
  jenis: 'penumpang' as const,
  wilayah: 2 as const,
  jaminan: 'comprehensive' as const,
  usia: 1,
  perluasan: [],
};

describe('kategori dan wilayah', () => {
  it('categories by vehicle type and value', () => {
    expect(cariKategori('penumpang', 125_000_000).kategori).toBe(1);
    expect(cariKategori('penumpang', 125_000_001).kategori).toBe(2);
    expect(cariKategori('penumpang', 400_000_000).kategori).toBe(3);
    expect(cariKategori('penumpang', 900_000_000).kategori).toBe(5);
    expect(cariKategori('truk', 1).kategori).toBe(6);
    expect(cariKategori('bus', 1).kategori).toBe(7);
    expect(cariKategori('motor', 1).kategori).toBe(8);
  });

  it('regions', () => {
    expect(wilayahProvinsi('Aceh')).toBe(1);
    expect(wilayahProvinsi('Banten')).toBe(2);
    expect(wilayahProvinsi('Jawa Timur')).toBe(3);
  });
});

describe('premi (examples from insurer RIPLAY quoting SEOJK 6/2017)', () => {
  it('Rp250 juta kategori 3 wilayah 2 at the lower bound 2,08% = Rp5.200.000', () => {
    expect(hitungPremi({ ...dasar, nilai: 250_000_000 }).total[0]).toBeCloseTo(
      5_200_000,
      6,
    );
  });

  it('Rp205 juta, plat B: Rp4.264.000 at 2,08%', () => {
    expect(hitungPremi({ ...dasar, nilai: 205_000_000 }).total[0]).toBeCloseTo(
      4_264_000,
      6,
    );
  });

  it('RIPLAY example with SRCC, terrorism, and TJH Rp10 juta totals Rp5.550.000', () => {
    const r = hitungPremi({
      ...dasar,
      nilai: 250_000_000,
      perluasan: ['srcc', 'terorisme'],
      tjhLimit: 10_000_000,
    });
    expect(r.total[0]).toBeCloseTo(5_550_000, 6);
  });

  it('TLO motor wilayah 3 and comprehensive age loading', () => {
    expect(
      hitungPremi({
        ...dasar,
        jenis: 'motor',
        wilayah: 3,
        jaminan: 'tlo',
        nilai: 20_000_000,
      }).total,
    ).toEqual([134_000, 160_000]);
    // 7-year-old car: 2 years over 5 -> +10% of the rate
    const r = hitungPremi({ ...dasar, nilai: 100_000_000, usia: 7 });
    expect(r.total[0]).toBeCloseTo(3_260_000 * 1.1, 4);
    // no loading for TLO
    expect(
      hitungPremi({ ...dasar, jaminan: 'tlo', nilai: 100_000_000, usia: 7 })
        .rincian,
    ).toHaveLength(1);
  });

  it('progressive TJH', () => {
    expect(premiTjh(10_000_000)).toBe(100_000);
    expect(premiTjh(50_000_000)).toBe(250_000 + 125_000);
    expect(premiTjh(100_000_000)).toBe(250_000 + 125_000 + 250_000);
  });

  it('multi-year with depreciation moves categories', () => {
    const rows = simulasiTahunan({ ...dasar, nilai: 210_000_000 }, 3, 10);
    expect(rows.map((r) => r.kategori)).toEqual([3, 2, 2]);
    expect(rows[1]!.nilai).toBeCloseTo(189_000_000, 4);
  });
});
