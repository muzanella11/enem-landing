import {
  AKTIVITAS,
  IMT_KEMENKES,
  IMT_WHO_ASIA,
  KALORI_MINIMUM,
  KKAL_PER_KG,
  type Aktivitas,
  type KategoriImt,
} from '../../data/kesehatan';
import { tambahHari } from '../kalender';

/** Health calculators (Story 34). Dates are ISO calendar dates. */

const hari = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d) / 86_400_000;
};

// --- IMT / BMI -----------------------------------------------------------

/** BMI rounded to one decimal, the precision the category tables use. */
export const hitungImt = (beratKg: number, tinggiCm: number): number => {
  if (beratKg <= 0 || tinggiCm <= 0) return 0;
  const m = tinggiCm / 100;
  return Math.round((beratKg / (m * m)) * 10) / 10;
};

export const kategoriImt = (imt: number, tabel: KategoriImt[]): KategoriImt =>
  [...tabel].reverse().find((item) => imt >= item.min) ?? tabel[0]!;

export const kategoriKemenkes = (imt: number) => kategoriImt(imt, IMT_KEMENKES);
export const kategoriWhoAsia = (imt: number) => kategoriImt(imt, IMT_WHO_ASIA);

/** Weight range for a "normal" BMI (Kemenkes 18,5-25,0) at this height. */
export const beratNormal = (tinggiCm: number) => {
  const m2 = (tinggiCm / 100) ** 2;
  return {
    min: Math.ceil(18.5 * m2 * 10) / 10,
    max: Math.floor(25 * m2 * 10) / 10,
  };
};

// --- Kalori --------------------------------------------------------------

export type JenisKelamin = 'pria' | 'wanita';

/** Mifflin-St Jeor resting energy (kcal/day). */
export const bmrMifflin = (
  jenis: JenisKelamin,
  beratKg: number,
  tinggiCm: number,
  usia: number,
) => 10 * beratKg + 6.25 * tinggiCm - 5 * usia + (jenis === 'pria' ? 5 : -161);

export interface HasilKalori {
  bmr: number;
  tdee: number;
  target: {
    label: string;
    kkal: number;
    perMinggu: number;
    dibawahMinimum: boolean;
  }[];
}

export const hitungKalori = (
  jenis: JenisKelamin,
  beratKg: number,
  tinggiCm: number,
  usia: number,
  aktivitas: Aktivitas,
): HasilKalori => {
  const bmr = bmrMifflin(jenis, beratKg, tinggiCm, usia);
  const faktor = AKTIVITAS.find((item) => item.id === aktivitas)!.faktor;
  const tdee = bmr * faktor;
  const minimum = KALORI_MINIMUM[jenis];
  const target = [
    { label: 'Turun 0,5 kg/minggu', perMinggu: -0.5 },
    { label: 'Turun 0,25 kg/minggu', perMinggu: -0.25 },
    { label: 'Pertahankan berat', perMinggu: 0 },
    { label: 'Naik 0,25 kg/minggu', perMinggu: 0.25 },
  ].map((item) => {
    const kkal = Math.round(tdee + (item.perMinggu * KKAL_PER_KG) / 7);
    return { ...item, kkal, dibawahMinimum: kkal < minimum };
  });
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), target };
};

// --- HPL -----------------------------------------------------------------

export interface HasilHpl {
  hpl: string;
  /** Gestational age today. Null before HPHT. */
  usia: { minggu: number; hari: number } | null;
  trimester: 1 | 2 | 3 | null;
  konsepsi: string;
  sisaHari: number;
}

/**
 * Naegele's rule: HPHT + 280 days, shifted by (cycle - 28) days for
 * regular cycles that are not 28 days long.
 */
export const hitungHpl = (
  hpht: string,
  siklus = 28,
  hariIni?: string,
): HasilHpl => {
  const koreksi = siklus - 28;
  const hpl = tambahHari(hpht, 280 + koreksi);
  const today = hariIni ?? hpht;
  // Gestational age is counted from the (cycle-adjusted) LMP.
  const umur = hari(today) - hari(hpht) - koreksi;
  const usia =
    umur >= 0 ? { minggu: Math.floor(umur / 7), hari: umur % 7 } : null;
  const trimester = !usia
    ? null
    : usia.minggu < 14
      ? 1
      : usia.minggu < 28
        ? 2
        : 3;
  return {
    hpl,
    usia,
    trimester,
    konsepsi: tambahHari(hpht, siklus - 14),
    sisaHari: hari(hpl) - hari(today),
  };
};

// --- Masa subur ----------------------------------------------------------

export interface SiklusSubur {
  haid: string;
  ovulasi: string;
  suburMulai: string;
  suburSelesai: string;
  haidBerikut: string;
}

/**
 * Ovulation about 14 days before the next period; fertile window from 5
 * days before to 1 day after ovulation (Wilcox 1995). Only an estimate:
 * not a contraceptive method.
 */
export const masaSubur = (
  hpht: string,
  siklus: number,
  jumlah = 3,
): SiklusSubur[] =>
  Array.from({ length: jumlah }, (_, index) => {
    const haid = tambahHari(hpht, index * siklus);
    const ovulasi = tambahHari(haid, siklus - 14);
    return {
      haid,
      ovulasi,
      suburMulai: tambahHari(ovulasi, -5),
      suburSelesai: tambahHari(ovulasi, 1),
      haidBerikut: tambahHari(haid, siklus),
    };
  });
