import { describe, expect, it } from 'vitest';
import { dasarUpahLembur, hitungLembur, pengaliJam } from './lembur.js';
import {
  batasBayarThr,
  hitungThr,
  masaKerjaBulan,
  pajakThr,
  rataRataUpah,
} from './thr.js';

describe('lembur', () => {
  it('uses 1/173 of monthly pay as the hourly rate', () => {
    const result = hitungLembur({
      upahPokok: 5_190_000,
      tunjanganTetap: 0,
      tunjanganTidakTetap: 0,
      pola: 5,
      entries: [],
    });
    expect(result.upahSejam).toBe(30_000);
  });

  it('working day: first hour 1.5x, next hours 2x', () => {
    const result = hitungLembur({
      upahPokok: 5_190_000,
      tunjanganTetap: 0,
      tunjanganTidakTetap: 0,
      pola: 5,
      entries: [{ jenisHari: 'kerja', jamPerHari: 3, jumlahHari: 2 }],
    });
    expect(result.entries[0]!.perJam.map((jam) => jam.pengali)).toEqual([
      1.5, 2, 2,
    ]);
    expect(result.entries[0]!.perHari).toBe(45_000 + 60_000 + 60_000);
    expect(result.total).toBe(2 * 165_000);
  });

  it.each([
    [6, 'libur', [2, 2, 2, 2, 2, 2, 2, 3, 4, 4, 4]],
    [6, 'libur-terpendek', [2, 2, 2, 2, 2, 3, 4, 4, 4]],
    [5, 'libur', [2, 2, 2, 2, 2, 2, 2, 2, 3, 4, 4, 4]],
  ] as const)(
    'rest day multipliers for a %d-day week (%s)',
    (pola, jenis, expected) => {
      expect(
        expected.map((_, index) => pengaliJam(jenis, pola, index + 1)),
      ).toEqual(expected);
    },
  );

  it('uses 75% of total pay when fixed pay is below 75%', () => {
    expect(
      dasarUpahLembur({
        upahPokok: 3_000_000,
        tunjanganTetap: 0,
        tunjanganTidakTetap: 2_000_000,
      }),
    ).toEqual({ dasar: 3_750_000, pakai75: true });
    expect(
      dasarUpahLembur({
        upahPokok: 4_000_000,
        tunjanganTetap: 0,
        tunjanganTidakTetap: 1_000_000,
      }),
    ).toEqual({ dasar: 4_000_000, pakai75: false });
  });

  it('warns above 4 hours on a working day and pays partial hours pro rata', () => {
    const result = hitungLembur({
      upahPokok: 5_190_000,
      tunjanganTetap: 0,
      tunjanganTidakTetap: 0,
      pola: 5,
      entries: [{ jenisHari: 'kerja', jamPerHari: 4.5, jumlahHari: 1 }],
    });
    expect(result.entries[0]!.warnings).toHaveLength(1);
    expect(result.entries[0]!.perJam[4]).toEqual({
      jamKe: 5,
      pengali: 2,
      nominal: 30_000,
    });
    expect(result.totalJamHariKerja).toBe(4.5);
  });
});

describe('THR', () => {
  it.each([
    ['2025-03-10', '2026-03-10', 12],
    ['2025-03-11', '2026-03-10', 11],
    ['2026-02-10', '2026-03-10', 1],
    ['2026-02-11', '2026-03-10', 0],
    ['2026-04-01', '2026-03-10', 0],
  ])('masa kerja from %s to %s is %d months', (mulai, sampai, months) => {
    expect(masaKerjaBulan(mulai, sampai)).toBe(months);
  });

  it('12 months or more: one month of pay', () => {
    expect(hitungThr(12, 6_000_000)).toEqual({
      berhak: true,
      masaKerja: 12,
      proporsional: false,
      thr: 6_000_000,
    });
    expect(hitungThr(40, 6_000_000).thr).toBe(6_000_000);
  });

  it('1 to 11 months: pro rata', () => {
    expect(hitungThr(11, 6_000_000).thr).toBe(5_500_000);
    expect(hitungThr(1, 6_000_000).thr).toBe(500_000);
  });

  it('less than one month: not entitled', () => {
    expect(hitungThr(0, 6_000_000)).toEqual({
      berhak: false,
      masaKerja: 0,
      proporsional: false,
      thr: 0,
    });
  });

  it('daily workers use the average monthly pay', () => {
    expect(rataRataUpah([3_000_000, 3_600_000, 0, 3_300_000])).toBe(3_300_000);
  });

  it('extra PPh 21 in the THR month matches the TER calculator', () => {
    const result = pajakThr(
      {
        gajiPokok: 10_000_000,
        tunjanganTetap: 0,
        tunjanganTidakTetap: 0,
        ptkp: 'TK/0',
        jkkRiskIndex: 0,
        ikutBpjsKesehatan: false,
        ikutBpjsKetenagakerjaan: false,
      },
      10_000_000,
      3,
    );
    // Bruto 20 jt -> TER A 9% = 1,8 jt; without THR 2% = 200 rb.
    expect(result.pph21DenganThr).toBe(1_800_000);
    expect(result.pph21TanpaThr).toBe(200_000);
    expect(result.thrBersih).toBe(10_000_000 - 1_600_000);
  });

  it('payment deadline is H-7', () => {
    expect(batasBayarThr('2027-03-10')).toBe('2027-03-03');
    expect(batasBayarThr('2027-01-05')).toBe('2026-12-29');
  });
});
