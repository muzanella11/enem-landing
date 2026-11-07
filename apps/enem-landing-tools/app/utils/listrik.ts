import { TARIF_LISTRIK, type GolonganTarif } from '../data/listrik/tarif';

/**
 * Prepaid token math (Story 37). The nominal paid covers, in this order:
 * admin fee, then electricity value plus regional tax (and PPN for R-3):
 *   nominal - admin = kWh x tarif x (1 + pajakDaerah + ppn)
 */
export interface TokenInput {
  golongan: GolonganTarif;
  /** Rupiah paid. */
  nominal: number;
  admin: number;
  pajakDaerahPersen: number;
}

export interface TokenResult {
  kwh: number;
  nilaiListrik: number;
  pajakDaerah: number;
  ppn: number;
  admin: number;
  hargaEfektifPerKwh: number;
}

const ppnPersen = (golongan: GolonganTarif) =>
  golongan.kenaPpn ? TARIF_LISTRIK.ppnPersen : 0;

export const kwhDariNominal = ({
  golongan,
  nominal,
  admin,
  pajakDaerahPersen,
}: TokenInput): TokenResult => {
  const bersih = Math.max(0, nominal - admin);
  const faktor = 1 + pajakDaerahPersen / 100 + ppnPersen(golongan) / 100;
  const nilaiListrik = bersih / faktor;
  const kwh = Math.floor((nilaiListrik / golongan.rupiahPerKwh) * 10) / 10;
  return {
    kwh,
    nilaiListrik: Math.round(nilaiListrik),
    pajakDaerah: Math.round((nilaiListrik * pajakDaerahPersen) / 100),
    ppn: Math.round((nilaiListrik * ppnPersen(golongan)) / 100),
    admin: Math.min(admin, nominal),
    hargaEfektifPerKwh: kwh > 0 ? Math.round(nominal / kwh) : 0,
  };
};

/** Rupiah to pay for a given kWh (rounded up to the rupiah). */
export const nominalDariKwh = (
  golongan: GolonganTarif,
  kwh: number,
  admin: number,
  pajakDaerahPersen: number,
): number =>
  Math.ceil(
    kwh *
      golongan.rupiahPerKwh *
      (1 + pajakDaerahPersen / 100 + ppnPersen(golongan) / 100) +
      admin,
  );

export interface Peralatan {
  nama: string;
  watt: number;
  jam: number;
  jumlah: number;
}

/** kWh per month (30 days) for a list of appliances. */
export const kwhBulanan = (peralatan: Peralatan[]): number =>
  Math.round(
    peralatan.reduce(
      (sum, alat) => sum + (alat.watt * alat.jam * alat.jumlah * 30) / 1000,
      0,
    ) * 10,
  ) / 10;
