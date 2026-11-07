import { describe, expect, it } from 'vitest';
import {
  AHLI_WARIS_KOSONG,
  hartaBersih,
  hitungFaraid,
  type AhliWaris,
  type Grup,
} from './index.js';
import { jumlah, teks } from './pecahan.js';

/**
 * Cases follow the standard examples in faraid textbooks, e.g. Ash-Shabuni,
 * "Al-Mawarits fi asy-Syari'ah al-Islamiyyah" (Pembagian Waris Menurut
 * Islam), and Kompilasi Hukum Islam Buku II.
 */
const hitung = (sebagian: Partial<AhliWaris>) => {
  const hasil = hitungFaraid({ ...AHLI_WARIS_KOSONG, ...sebagian });
  const peta = Object.fromEntries(
    hasil.bagian.map((b) => [b.grup, teks(b.bagian)]),
  ) as Partial<Record<Grup, string>>;
  return {
    hasil,
    peta,
    total: teks(jumlah(hasil.bagian.map((b) => b.bagian))),
  };
};

describe('faraid: fixed shares and ashabah', () => {
  it('1. suami + anak laki-laki', () => {
    const { peta, total } = hitung({ suami: true, anakL: 1 });
    expect(peta).toEqual({ suami: '1/4', anakL: '3/4' });
    expect(total).toBe('1');
  });

  it('2. istri + anak laki-laki + anak perempuan (2:1)', () => {
    const { peta } = hitung({ istri: 1, anakL: 1, anakP: 1 });
    expect(peta).toEqual({ istri: '1/8', anakL: '7/12', anakP: '7/24' });
  });

  it('3. ayah + ibu + anak laki-laki', () => {
    expect(hitung({ ayah: true, ibu: true, anakL: 1 }).peta).toEqual({
      ibu: '1/6',
      ayah: '1/6',
      anakL: '2/3',
    });
  });

  it('4. ayah + anak perempuan: ayah 1/6 + sisa', () => {
    expect(hitung({ ayah: true, anakP: 1 }).peta).toEqual({
      anakP: '1/2',
      ayah: '1/2',
    });
  });

  it('5. ibu + 2 saudara seibu + saudara laki-laki kandung', () => {
    expect(hitung({ ibu: true, saudaraSeibu: 2, saudaraL: 1 }).peta).toEqual({
      ibu: '1/6',
      saudaraSeibu: '1/3',
      saudaraL: '1/2',
    });
  });

  it("6. anak perempuan + saudara perempuan kandung (ma'al ghair)", () => {
    expect(hitung({ anakP: 1, saudariP: 1 }).peta).toEqual({
      anakP: '1/2',
      saudariP: '1/2',
    });
  });

  it('7. 2 istri + anak laki-laki + 2 anak perempuan, per orang', () => {
    const { hasil } = hitung({ istri: 2, anakL: 1, anakP: 2 });
    const per = Object.fromEntries(
      hasil.bagian.map((b) => [b.grup, teks(b.perOrang)]),
    );
    expect(per).toEqual({ istri: '1/16', anakL: '7/16', anakP: '7/32' });
  });

  it('8. kakek (tanpa ayah) + anak laki-laki; nenek (tanpa ibu)', () => {
    expect(hitung({ kakek: true, nenekIbu: true, anakL: 1 }).peta).toEqual({
      nenek: '1/6',
      kakek: '1/6',
      anakL: '2/3',
    });
  });
});

describe('faraid: gharrawain', () => {
  it('9. suami + ayah + ibu', () => {
    expect(hitung({ suami: true, ayah: true, ibu: true }).peta).toEqual({
      suami: '1/2',
      ibu: '1/6',
      ayah: '1/3',
    });
  });

  it('10. istri + ayah + ibu', () => {
    expect(hitung({ istri: 1, ayah: true, ibu: true }).peta).toEqual({
      istri: '1/4',
      ibu: '1/4',
      ayah: '1/2',
    });
  });
});

describe('faraid: aul', () => {
  it('11. suami + 2 saudara perempuan kandung (aul 6 -> 7)', () => {
    const { hasil, peta } = hitung({ suami: true, saudariP: 2 });
    expect(hasil.aul).toBe(true);
    expect(peta).toEqual({ suami: '3/7', saudariP: '4/7' });
  });

  it('12. suami + ibu + 2 saudara perempuan kandung (aul 6 -> 8)', () => {
    expect(hitung({ suami: true, ibu: true, saudariP: 2 }).peta).toEqual({
      suami: '3/8',
      saudariP: '1/2',
      ibu: '1/8',
    });
  });

  it('13. minbariyyah: istri + 2 anak perempuan + ayah + ibu (aul 24 -> 27)', () => {
    const { peta, total } = hitung({
      istri: 1,
      anakP: 2,
      ayah: true,
      ibu: true,
    });
    expect(peta).toEqual({
      istri: '1/9',
      anakP: '16/27',
      ibu: '4/27',
      ayah: '4/27',
    });
    expect(total).toBe('1');
  });
});

describe('faraid: radd', () => {
  it('14. ibu + anak perempuan', () => {
    const { hasil, peta } = hitung({ ibu: true, anakP: 1 });
    expect(hasil.radd).toBe(true);
    expect(peta).toEqual({ anakP: '3/4', ibu: '1/4' });
  });

  it('15. istri + anak perempuan: istri tidak menerima radd', () => {
    expect(hitung({ istri: 1, anakP: 1 }).peta).toEqual({
      istri: '1/8',
      anakP: '7/8',
    });
  });

  it('16. anak perempuan + cucu perempuan (takmilah) lalu radd', () => {
    expect(hitung({ anakP: 1, cucuP: 1 }).peta).toEqual({
      anakP: '3/4',
      cucuP: '1/4',
    });
  });

  it('17. saudara perempuan kandung + saudara perempuan seayah', () => {
    expect(hitung({ saudariP: 1, saudariSeayah: 1 }).peta).toEqual({
      saudariP: '3/4',
      saudariSeayah: '1/4',
    });
  });
});

describe('faraid: hajb and disputed cases', () => {
  it('18. anak laki-laki menghalangi saudara dan cucu', () => {
    const { hasil, peta } = hitung({
      ibu: true,
      anakL: 1,
      saudaraL: 2,
      cucuL: 1,
    });
    expect(peta).toEqual({ ibu: '1/6', anakL: '5/6' });
    expect(hasil.terhalang.map((t) => t.label)).toEqual([
      'Cucu laki-laki (dari anak laki-laki)',
      'Saudara laki-laki kandung',
    ]);
  });

  it('19. dua anak perempuan menghalangi cucu perempuan', () => {
    expect(hitung({ anakP: 2, cucuP: 1, ayah: true }).peta).toEqual({
      anakP: '2/3',
      ayah: '1/3',
    });
  });

  it('20. kakek bersama saudara dan musytarakah ditandai, tidak dihitung', () => {
    expect(hitung({ kakek: true, saudaraL: 1 }).hasil.perselisihan).toMatch(
      /Kakek/,
    );
    expect(
      hitung({ suami: true, ibu: true, saudaraSeibu: 2, saudaraL: 1 }).hasil
        .perselisihan,
    ).toMatch(/musytarakah/);
  });

  it('21. hanya suami: sisa tidak punya penerima (jumhur: baitul mal)', () => {
    const { hasil, peta } = hitung({ suami: true });
    expect(peta).toEqual({ suami: '1/2' });
    expect(teks(hasil.sisaTanpaPewaris)).toBe('1/2');
  });

  it('every non-disputed case sums to exactly 1 when someone can take the residue', () => {
    const kasus: Partial<AhliWaris>[] = [
      { suami: true, anakP: 3, ibu: true },
      { istri: 4, anakL: 3, anakP: 5, ayah: true, ibu: true },
      { saudaraLSeayah: 2, saudariSeayah: 1, ibu: true },
      { cucuL: 1, cucuP: 2, anakP: 1, istri: 1 },
    ];
    for (const k of kasus) expect(hitung(k).total).toBe('1');
  });
});

describe('harta bersih', () => {
  it('bequest is capped at one third after debts', () => {
    expect(hartaBersih(120_000_000, 5_000_000, 15_000_000, 50_000_000)).toEqual(
      {
        wasiatBerlaku: 100_000_000 / 3,
        bersih: 100_000_000 - 100_000_000 / 3,
        wasiatDipotong: true,
      },
    );
  });
});
