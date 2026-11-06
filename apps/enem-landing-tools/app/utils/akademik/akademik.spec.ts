import { describe, expect, it } from 'vitest';
import { SKD_2024 } from '../../data/cpns/skd.js';
import {
  cekSkd,
  hitungIpk,
  hitungIps,
  ipsDibutuhkan,
  predikat,
  skorDariJawaban,
  skorMaksimum,
  type Semester,
} from './index.js';

const formasi = (id: string) =>
  SKD_2024.formasi.find((item) => item.id === id)!;

describe('IPK', () => {
  const smt1: Semester = {
    nama: 'Semester 1',
    matkul: [
      { nama: 'Kalkulus', sks: 3, bobot: 2 },
      { nama: 'Bahasa Indonesia', sks: 2, bobot: 4 },
      { nama: 'Fisika', sks: 4, bobot: 3.5 },
      { nama: 'Belum keluar', sks: 2, bobot: null },
    ],
  };
  it('weights by credits and skips ungraded courses', () => {
    // (6 + 8 + 14) / 9 = 3.111
    expect(hitungIps(smt1)).toEqual({ sks: 9, mutu: 28, ip: 3.11 });
  });

  it('repeated course keeps the best grade only', () => {
    const smt2: Semester = {
      nama: 'Semester 2',
      matkul: [{ nama: 'kalkulus ', sks: 3, bobot: 3.7 }],
    };
    // Kalkulus 3.7 replaces 2: (11.1 + 8 + 14) / 9 = 3.677
    expect(hitungIpk([smt1, smt2])).toMatchObject({
      sks: 9,
      ip: 3.68,
      predikat: 'Pujian (cumlaude)',
    });
  });

  it('custom weights work as plain numbers', () => {
    expect(
      hitungIps({ nama: '', matkul: [{ nama: 'X', sks: 2, bobot: 3.75 }] }).ip,
    ).toBe(3.75);
  });

  it('honors', () => {
    expect(predikat(3.51)).toBe('Pujian (cumlaude)');
    expect(predikat(3.5)).toBe('Sangat memuaskan');
    expect(predikat(2.76)).toBe('Memuaskan');
    expect(predikat(2.75)).toBeNull();
  });

  it('target simulation', () => {
    // 60 SKS at 3.20 (192), 20 SKS next: (3.30 * 80 - 192) / 20 = 3.6
    expect(ipsDibutuhkan(60, 192, 20, 3.3)).toBe(3.6);
    expect(ipsDibutuhkan(60, 192, 20, 3.9)).toBeNull();
    expect(ipsDibutuhkan(60, 240, 20, 2)).toBe(0);
  });
});

describe('SKD 2024', () => {
  it('maximum scores', () => {
    expect(skorMaksimum(SKD_2024)).toEqual({ twk: 150, tiu: 175, tkp: 225 });
  });

  it('exactly at the general thresholds passes', () => {
    const skor = skorDariJawaban(13, 16, 166);
    expect(skor).toEqual({ twk: 65, tiu: 80, tkp: 166 });
    expect(cekSkd(skor, formasi('umum')).lulus).toBe(true);
  });

  it('one subtest below fails even with a high total', () => {
    const result = cekSkd({ twk: 60, tiu: 175, tkp: 225 }, formasi('umum'));
    expect(result.lulus).toBe(false);
    expect(result.cek.find((item) => item.label === 'TWK')).toMatchObject({
      lulus: false,
      selisih: -5,
    });
  });

  it.each([
    ['umum', { twk: 65, tiu: 80, tkp: 166 }, true],
    ['kalimantan', { twk: 65, tiu: 80, tkp: 165 }, false],
    ['cumlaude', { twk: 50, tiu: 85, tkp: 176 }, true],
    ['cumlaude', { twk: 50, tiu: 80, tkp: 200 }, false],
    ['diaspora', { twk: 50, tiu: 85, tkp: 175 }, false],
    ['disabilitas', { twk: 40, tiu: 60, tkp: 186 }, true],
    ['papua', { twk: 40, tiu: 55, tkp: 200 }, false],
    ['tertinggal', { twk: 40, tiu: 60, tkp: 185 }, false],
  ] as const)('%s %o -> %s', (id, skor, lulus) => {
    expect(cekSkd(skor, formasi(id)).lulus).toBe(lulus);
  });
});

describe('IPK storage', async () => {
  const { parseIpkStore } = await import('./storage.js');
  it('sanitizes imported data', () => {
    expect(
      parseIpkStore({
        semesters: [
          {
            matkul: [
              { nama: 'A', sks: '3', bobot: 9 },
              { sks: 2, bobot: null },
            ],
          },
        ],
      }),
    ).toEqual({
      skala: 'ab',
      semesters: [
        {
          nama: 'Semester 1',
          matkul: [
            { nama: 'A', sks: 3, bobot: 4 },
            { nama: '', sks: 2, bobot: null },
          ],
        },
      ],
    });
    expect(parseIpkStore('x')).toBeNull();
  });
});
