/**
 * Overtime pay per PP 35/2021 Pasal 31-32 (Story 26). Pure functions; the
 * page and its tests read only from here.
 */

export type PolaKerja = 5 | 6;
export type JenisHari = 'kerja' | 'libur' | 'libur-terpendek';

export interface LemburEntry {
  jenisHari: JenisHari;
  /** Overtime hours on one such day. */
  jamPerHari: number;
  /** How many days with this many overtime hours (default 1). */
  jumlahHari: number;
}

export interface LemburInput {
  upahPokok: number;
  tunjanganTetap: number;
  tunjanganTidakTetap: number;
  pola: PolaKerja;
  entries: LemburEntry[];
}

export interface LemburJam {
  jamKe: number;
  pengali: number;
  nominal: number;
}

export interface LemburEntryResult extends LemburEntry {
  perJam: LemburJam[];
  perHari: number;
  total: number;
  warnings: string[];
}

export interface LemburResult {
  dasarUpah: number;
  dasar75Persen: boolean;
  upahSejam: number;
  entries: LemburEntryResult[];
  total: number;
  totalJamHariKerja: number;
}

export const MAKS_JAM_PER_HARI = 4;
export const MAKS_JAM_PER_MINGGU = 18;

/**
 * Pasal 32: base is 100% of pokok + tunjangan tetap, except when those are
 * below 75% of total pay (with tunjangan tidak tetap), then 75% of total.
 */
export const dasarUpahLembur = (
  input: Pick<
    LemburInput,
    'upahPokok' | 'tunjanganTetap' | 'tunjanganTidakTetap'
  >,
): { dasar: number; pakai75: boolean } => {
  const tetap = input.upahPokok + input.tunjanganTetap;
  const total = tetap + input.tunjanganTidakTetap;
  if (input.tunjanganTidakTetap > 0 && tetap < 0.75 * total) {
    return { dasar: 0.75 * total, pakai75: true };
  }
  return { dasar: tetap, pakai75: false };
};

/** Multiplier for the n-th overtime hour (1-based) on one day. */
export const pengaliJam = (
  jenisHari: JenisHari,
  pola: PolaKerja,
  jamKe: number,
): number => {
  if (jenisHari === 'kerja') return jamKe === 1 ? 1.5 : 2;
  if (pola === 5) {
    if (jamKe <= 8) return 2;
    if (jamKe === 9) return 3;
    return 4;
  }
  if (jenisHari === 'libur-terpendek') {
    if (jamKe <= 5) return 2;
    if (jamKe === 6) return 3;
    return 4;
  }
  if (jamKe <= 7) return 2;
  if (jamKe === 8) return 3;
  return 4;
};

export const hitungLembur = (input: LemburInput): LemburResult => {
  const { dasar, pakai75 } = dasarUpahLembur(input);
  const upahSejam = dasar / 173;
  let totalJamHariKerja = 0;

  const entries = input.entries.map((entry) => {
    const jumlahHari = Math.max(0, Math.floor(entry.jumlahHari || 1));
    // Partial hours are paid pro rata within the hour they fall in.
    const jamUtuh = Math.floor(Math.max(0, entry.jamPerHari));
    const sisaJam = Math.max(0, entry.jamPerHari) - jamUtuh;
    const perJam: LemburJam[] = [];
    for (let jamKe = 1; jamKe <= jamUtuh + (sisaJam > 0 ? 1 : 0); jamKe += 1) {
      const porsi = jamKe <= jamUtuh ? 1 : sisaJam;
      const pengali = pengaliJam(entry.jenisHari, input.pola, jamKe);
      perJam.push({
        jamKe,
        pengali,
        nominal: Math.round(upahSejam * pengali * porsi),
      });
    }
    const perHari = perJam.reduce((sum, jam) => sum + jam.nominal, 0);
    const warnings: string[] = [];
    if (entry.jenisHari === 'kerja') {
      totalJamHariKerja += entry.jamPerHari * jumlahHari;
      if (entry.jamPerHari > MAKS_JAM_PER_HARI) {
        warnings.push(
          `Lembur di hari kerja maksimal ${MAKS_JAM_PER_HARI} jam per hari (PP 35/2021).`,
        );
      }
    }
    return {
      ...entry,
      jumlahHari,
      perJam,
      perHari,
      total: perHari * jumlahHari,
      warnings,
    };
  });

  return {
    dasarUpah: Math.round(dasar),
    dasar75Persen: pakai75,
    upahSejam: Math.round(upahSejam),
    entries,
    total: entries.reduce((sum, entry) => sum + entry.total, 0),
    totalJamHariKerja,
  };
};
