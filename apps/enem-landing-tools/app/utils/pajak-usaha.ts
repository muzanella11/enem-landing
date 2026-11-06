import {
  KENAIKAN_TANPA_NPWP,
  PPH_23,
  PPH_SEWA_TANAH_BANGUNAN,
  PPN,
  type JenisPph23,
} from '../data/tax/usaha';
import { getPtkp, pasal17Tax } from './payroll';
import type { PtkpStatus } from '../data/tax/2026';

/** VAT, withholding taxes, annual return (Story 55). */
export const hitungPpn = (input: {
  harga: number;
  sudahTermasuk: boolean;
  mewah: boolean;
}) => {
  // Effective share of the price taxed: 12% x 11/12 = 11% for non-luxury.
  const faktor = input.mewah
    ? PPN.tarif / 100
    : (PPN.tarif / 100) *
      (PPN.dppNilaiLainPembilang / PPN.dppNilaiLainPenyebut);
  const hargaJual = input.sudahTermasuk
    ? input.harga / (1 + faktor)
    : input.harga;
  const dpp = input.mewah
    ? hargaJual
    : (hargaJual * PPN.dppNilaiLainPembilang) / PPN.dppNilaiLainPenyebut;
  const ppn = (dpp * PPN.tarif) / 100;
  return {
    hargaJual,
    dpp,
    ppn,
    total: hargaJual + ppn,
    tarifEfektif: faktor * 100,
  };
};

export const hitungPph23 = (
  bruto: number,
  jenis: JenisPph23,
  punyaNpwp: boolean,
) => {
  const dasar = PPH_23.find((j) => j.id === jenis)!.tarif;
  const tarif = punyaNpwp ? dasar : dasar * (1 + KENAIKAN_TANPA_NPWP / 100);
  const pph = (bruto * tarif) / 100;
  return { tarif, pph, diterima: bruto - pph };
};

export const hitungPphSewa = (bruto: number) => {
  const pph = (bruto * PPH_SEWA_TANAH_BANGUNAN) / 100;
  return { tarif: PPH_SEWA_TANAH_BANGUNAN, pph, diterima: bruto - pph };
};

/** Gross rent when the agreed amount is net of the 10% tax (grossed up). */
export const sewaBrutoDariNeto = (neto: number) =>
  neto / (1 - PPH_SEWA_TANAH_BANGUNAN / 100);

export interface BuktiPotong {
  /** Net income per form 1721-A1 (after biaya jabatan and pension contributions). */
  neto: number;
  /** PPh 21 withheld for the year per the same form. */
  pph21: number;
}

/**
 * Annual individual return for employees: combine net income from every
 * employer and other non-final income, subtract zakat and PTKP, round PKP
 * down to the thousand, apply Pasal 17, then credit what was withheld.
 */
export const simulasiSpt = (input: {
  buktiPotong: BuktiPotong[];
  penghasilanLain: number;
  zakat: number;
  ptkp: PtkpStatus;
}) => {
  const neto =
    input.buktiPotong.reduce((s, b) => s + b.neto, 0) +
    input.penghasilanLain -
    input.zakat;
  const ptkp = getPtkp(input.ptkp);
  const pkp = Math.max(0, Math.floor((neto - ptkp) / 1000) * 1000);
  const terutang = pasal17Tax(pkp);
  const kredit = input.buktiPotong.reduce((s, b) => s + b.pph21, 0);
  const selisih = terutang - kredit;
  return {
    neto,
    ptkp,
    pkp,
    terutang,
    kredit,
    selisih,
    status:
      selisih > 0
        ? ('kurang-bayar' as const)
        : selisih < 0
          ? ('lebih-bayar' as const)
          : ('nihil' as const),
  };
};
