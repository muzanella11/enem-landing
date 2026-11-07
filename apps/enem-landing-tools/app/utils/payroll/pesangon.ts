import {
  ALASAN_PHK,
  LAPISAN_PPH_PESANGON,
  tabelUp,
  tabelUpmk,
  type AlasanPhk,
} from '../../data/pesangon/pp-35-2021';

/** Severance pay (Story 28). */

export interface PesangonInput {
  /** Months of service (whole months). */
  masaKerjaBulan: number;
  /** Upah pokok + tunjangan tetap per month. */
  upah: number;
  alasanId: string;
  sisaCutiHari: number;
  /** Working days per month used to value unused leave (21 for 5-day weeks, 25 for 6-day). */
  hariKerjaSebulan: number;
  biayaPulang: number;
  /** From the employment contract/company rules, for resignations and the like. */
  uangPisah: number;
}

export interface PesangonResult {
  alasan: AlasanPhk;
  masaKerjaTahun: number;
  bulanUp: number;
  bulanUpmk: number;
  up: number;
  upmk: number;
  uph: number;
  uangPisah: number;
  bruto: number;
  pph: number;
  lapisanPph: { dari: number; sampai: number; tarif: number; pajak: number }[];
  bersih: number;
}

export const pphPesangon = (bruto: number) => {
  let lower = 0;
  let total = 0;
  const lapisan: PesangonResult['lapisanPph'] = [];
  for (const [upper, tarif] of LAPISAN_PPH_PESANGON) {
    if (bruto <= lower) break;
    const kena = Math.min(bruto, upper) - lower;
    const pajak = Math.floor((kena * tarif) / 100);
    lapisan.push({ dari: lower, sampai: Math.min(bruto, upper), tarif, pajak });
    total += pajak;
    lower = upper;
  }
  return { total, lapisan };
};

export const hitungPesangon = (input: PesangonInput): PesangonResult => {
  const alasan =
    ALASAN_PHK.find((item) => item.id === input.alasanId) ?? ALASAN_PHK[0]!;
  const tahun = Math.floor(Math.max(0, input.masaKerjaBulan) / 12);
  const bulanUp = tabelUp(tahun);
  const bulanUpmk = tabelUpmk(tahun);
  const up = Math.round(alasan.up * bulanUp * input.upah);
  const upmk = Math.round(alasan.upmk * bulanUpmk * input.upah);
  const upahHarian =
    input.hariKerjaSebulan > 0 ? input.upah / input.hariKerjaSebulan : 0;
  const uph = Math.round(
    Math.max(0, input.sisaCutiHari) * upahHarian +
      Math.max(0, input.biayaPulang),
  );
  const uangPisah = alasan.uangPisah ? Math.max(0, input.uangPisah) : 0;
  const bruto = up + upmk + uph + uangPisah;
  const pph = pphPesangon(bruto);
  return {
    alasan,
    masaKerjaTahun: tahun,
    bulanUp,
    bulanUpmk,
    up,
    upmk,
    uph,
    uangPisah,
    bruto,
    pph: pph.total,
    lapisanPph: pph.lapisan,
    bersih: bruto - pph.total,
  };
};
