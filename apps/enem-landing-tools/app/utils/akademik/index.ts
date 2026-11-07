import type { AmbangFormasi, AturanSkd } from '../../data/cpns/skd';
import { PREDIKAT } from '../../data/ipk';

// --- IPK -----------------------------------------------------------------

export interface MataKuliah {
  nama: string;
  sks: number;
  /** Grade weight (0-4). Null = not graded yet, ignored. */
  bobot: number | null;
}
export interface Semester {
  nama: string;
  matkul: MataKuliah[];
}

const bulat2 = (n: number) => Math.round(n * 100) / 100;

const ringkas = (matkul: MataKuliah[]) => {
  const valid = matkul.filter((mk) => mk.sks > 0 && mk.bobot !== null);
  const sks = valid.reduce((sum, mk) => sum + mk.sks, 0);
  const mutu = valid.reduce((sum, mk) => sum + mk.sks * (mk.bobot ?? 0), 0);
  return { sks, mutu, ip: sks ? bulat2(mutu / sks) : 0 };
};

export const hitungIps = (semester: Semester) => ringkas(semester.matkul);

/**
 * Cumulative GPA. A course taken again (same name, case-insensitive)
 * counts once, with its best grade, as most campuses do.
 */
export const hitungIpk = (semesters: Semester[]) => {
  const terbaik = new Map<string, MataKuliah>();
  const tanpaNama: MataKuliah[] = [];
  for (const semester of semesters) {
    for (const mk of semester.matkul) {
      if (mk.bobot === null || mk.sks <= 0) continue;
      const key = mk.nama.trim().toLowerCase();
      if (!key) {
        tanpaNama.push(mk);
        continue;
      }
      const lama = terbaik.get(key);
      if (!lama || (mk.bobot ?? 0) > (lama.bobot ?? 0)) terbaik.set(key, mk);
    }
  }
  const hasil = ringkas([...terbaik.values(), ...tanpaNama]);
  return { ...hasil, predikat: predikat(hasil.ip) };
};

export const predikat = (ipk: number): string | null =>
  PREDIKAT.find((item) => ipk >= item.min)?.label ?? null;

/** Semester GPA needed over `sksDepan` credits to reach `target`. Null = impossible (> 4). */
export const ipsDibutuhkan = (
  sksSekarang: number,
  mutuSekarang: number,
  sksDepan: number,
  target: number,
): number | null => {
  if (sksDepan <= 0) return null;
  const perlu = (target * (sksSekarang + sksDepan) - mutuSekarang) / sksDepan;
  if (perlu > 4) return null;
  return Math.max(0, Math.ceil(perlu * 100) / 100);
};

// --- SKD -----------------------------------------------------------------

export interface SkorSkd {
  twk: number;
  tiu: number;
  tkp: number;
}

/** TWK/TIU: 5 per correct answer. TKP is entered as a total score (1-5 per question). */
export const skorDariJawaban = (
  benarTwk: number,
  benarTiu: number,
  skorTkp: number,
): SkorSkd => ({
  twk: benarTwk * 5,
  tiu: benarTiu * 5,
  tkp: skorTkp,
});

export const skorMaksimum = (aturan: AturanSkd): SkorSkd => ({
  twk: aturan.soal.twk * 5,
  tiu: aturan.soal.tiu * 5,
  tkp: aturan.soal.tkp * 5,
});

export interface HasilSkd {
  total: number;
  lulus: boolean;
  cek: {
    label: string;
    skor: number;
    ambang: number;
    lulus: boolean;
    selisih: number;
  }[];
}

export const cekSkd = (skor: SkorSkd, formasi: AmbangFormasi): HasilSkd => {
  const total = skor.twk + skor.tiu + skor.tkp;
  const cek: HasilSkd['cek'] = [];
  const add = (label: string, nilai: number, ambang: number | null) => {
    if (ambang === null) return;
    cek.push({
      label,
      skor: nilai,
      ambang,
      lulus: nilai >= ambang,
      selisih: nilai - ambang,
    });
  };
  add('TWK', skor.twk, formasi.twk);
  add('TIU', skor.tiu, formasi.tiu);
  add('TKP', skor.tkp, formasi.tkp);
  add('Total', total, formasi.totalMin);
  return { total, cek, lulus: cek.every((item) => item.lulus) };
};
