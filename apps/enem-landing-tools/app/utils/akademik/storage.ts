import type { Semester } from './index';

/** GPA course history kept in this browser (Story 35). */
export const IPK_STORAGE_KEY = 'elt_ipk_v1';

export interface IpkStore {
  skala: string;
  semesters: Semester[];
}

export const parseIpkStore = (raw: unknown): IpkStore | null => {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Partial<IpkStore>;
  if (!Array.isArray(data.semesters)) return null;
  return {
    skala: typeof data.skala === 'string' ? data.skala : 'ab',
    semesters: data.semesters.slice(0, 20).map((semester, index) => ({
      nama:
        typeof semester?.nama === 'string'
          ? semester.nama
          : `Semester ${index + 1}`,
      matkul: (Array.isArray(semester?.matkul) ? semester.matkul : [])
        .slice(0, 40)
        .map((mk) => ({
          nama: typeof mk?.nama === 'string' ? mk.nama.slice(0, 120) : '',
          sks: Number.isFinite(Number(mk?.sks))
            ? Math.max(0, Math.min(24, Number(mk.sks)))
            : 0,
          bobot:
            mk?.bobot === null ||
            mk?.bobot === undefined ||
            !Number.isFinite(Number(mk.bobot))
              ? null
              : Math.max(0, Math.min(4, Number(mk.bobot))),
        })),
    })),
  };
};
