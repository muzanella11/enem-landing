import { PKB, SWDKLLJ, TARIF_DOKUMEN, type JenisRoda } from '../data/kendaraan';

/** Vehicle tax estimate (Story 42). Calendar dates are ISO strings. */

/** Whole months late, counting a started month as a full month, capped at 24. */
export const bulanTerlambat = (
  jatuhTempo: string,
  tanggalBayar: string,
): number => {
  if (!jatuhTempo || !tanggalBayar || tanggalBayar <= jatuhTempo) return 0;
  const [y1, m1, d1] = jatuhTempo.split('-').map(Number) as [
    number,
    number,
    number,
  ];
  const [y2, m2, d2] = tanggalBayar.split('-').map(Number) as [
    number,
    number,
    number,
  ];
  let bulan = (y2 - y1) * 12 + (m2 - m1);
  if (d2 > d1) bulan += 1;
  return Math.min(PKB.dendaMaksBulan, Math.max(1, bulan));
};

export interface InputPkb {
  roda: JenisRoda;
  njkb: number;
  /** Bobot (usually 1 for private cars and motorcycles). */
  bobot: number;
  /** Provincial PKB rate in percent (from the province's Perda or your STNK). */
  tarifPersen: number;
  /** DKI Jakarta: no opsen. */
  denganOpsen: boolean;
  tahunTerlambat?: number;
  bulanTerlambat: number;
  gantiPlat: boolean;
}

export interface HasilPkb {
  pkb: number;
  opsen: number;
  swdkllj: number;
  dendaPkb: number;
  dendaOpsen: number;
  dendaSwdkllj: number;
  stnk: number;
  tnkb: number;
  total: number;
}

const bulat = (n: number) => Math.round(n);

export const hitungPkb = (input: InputPkb): HasilPkb => {
  const pkb = bulat(input.njkb * input.bobot * (input.tarifPersen / 100));
  const opsen = input.denganOpsen ? bulat(pkb * PKB.opsen) : 0;
  const telat = Math.min(PKB.dendaMaksBulan, input.bulanTerlambat);
  const dendaPkb = bulat(pkb * PKB.dendaPerBulan * telat);
  const dendaOpsen = bulat(opsen * PKB.dendaPerBulan * telat);
  const sw = SWDKLLJ[input.roda];
  const dendaSwdkllj = telat > 0 ? sw.denda : 0;
  const stnk = input.gantiPlat ? TARIF_DOKUMEN[input.roda].stnk : 0;
  const tnkb = input.gantiPlat ? TARIF_DOKUMEN[input.roda].tnkb : 0;
  return {
    pkb,
    opsen,
    swdkllj: sw.iuran,
    dendaPkb,
    dendaOpsen,
    dendaSwdkllj,
    stnk,
    tnkb,
    total:
      pkb +
      opsen +
      sw.iuran +
      dendaPkb +
      dendaOpsen +
      dendaSwdkllj +
      stnk +
      tnkb,
  };
};
