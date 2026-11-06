import { PPH_UMKM, type JenisWp } from '../../data/umkm';

/** UMKM calculators (Story 43). Money in Rupiah. */

export const hppPerUnit = (
  biaya: { bahan: number; tenagaKerja: number; overhead: number },
  jumlah: number,
) =>
  jumlah > 0 ? (biaya.bahan + biaya.tenagaKerja + biaya.overhead) / jumlah : 0;

/** Margin is profit / price; markup is profit / cost. */
export const hargaDariMargin = (hpp: number, marginPersen: number) =>
  marginPersen >= 100 ? Infinity : hpp / (1 - marginPersen / 100);
export const hargaDariMarkup = (hpp: number, markupPersen: number) =>
  hpp * (1 + markupPersen / 100);
export const marginDariMarkup = (markupPersen: number) =>
  (markupPersen / (100 + markupPersen)) * 100;
export const markupDariMargin = (marginPersen: number) =>
  marginPersen >= 100 ? Infinity : (marginPersen / (100 - marginPersen)) * 100;

export interface HasilBep {
  unit: number;
  rupiah: number;
  kontribusiPerUnit: number;
}
/** Break-even: fixed costs / (price - variable cost per unit). Null when each sale loses money. */
export const hitungBep = (
  biayaTetap: number,
  harga: number,
  biayaVariabel: number,
): HasilBep | null => {
  const kontribusi = harga - biayaVariabel;
  if (kontribusi <= 0) return null;
  const unit = Math.ceil(biayaTetap / kontribusi);
  return { unit, rupiah: unit * harga, kontribusiPerUnit: kontribusi };
};

export interface FeeMarketplace {
  /** Percent of the item price. */
  adminPersen: number;
  layananPersen: number;
  /** Fixed fee per order (e.g. processing fee). */
  biayaPerPesanan: number;
  /** Seller-funded discount/voucher and shipping subsidy, in Rupiah. */
  voucherPenjual: number;
  ongkirDitanggung: number;
}

export const pendapatanBersih = (
  harga: number,
  hpp: number,
  fee: FeeMarketplace,
) => {
  const dasar = Math.max(0, harga - fee.voucherPenjual);
  const potongan =
    dasar * ((fee.adminPersen + fee.layananPersen) / 100) + fee.biayaPerPesanan;
  const diterima = dasar - potongan - fee.ongkirDitanggung;
  return { potongan, diterima, laba: diterima - hpp };
};

/** Lowest price where profit >= target (Rupiah), solving the fee formula. */
export const hargaMinimal = (
  hpp: number,
  fee: FeeMarketplace,
  targetLaba = 0,
) => {
  const persen = (fee.adminPersen + fee.layananPersen) / 100;
  if (persen >= 1) return Infinity;
  const dasar =
    (hpp + targetLaba + fee.biayaPerPesanan + fee.ongkirDitanggung) /
    (1 - persen);
  return Math.ceil(dasar + fee.voucherPenjual);
};

export interface HasilPphUmkm {
  berhak: boolean;
  /** Turnover this month that is taxed after the individual exemption. */
  omzetKenaPajak: number;
  pph: number;
  sisaBebas: number;
  melewatiBatas: boolean;
}

/**
 * Monthly final tax. `omzetSebelumnya` is the turnover from January up to
 * the previous month of the same tax year (the Rp500 juta exemption is
 * cumulative from the first month).
 */
export const hitungPphUmkm = (
  jenis: JenisWp,
  omzetBulanIni: number,
  omzetSebelumnya: number,
): HasilPphUmkm => {
  const berhak = jenis !== 'badan-lain';
  const kumulatif = omzetSebelumnya + omzetBulanIni;
  const melewatiBatas = kumulatif > PPH_UMKM.batasOmzetTahunan;
  if (!berhak)
    return { berhak, omzetKenaPajak: 0, pph: 0, sisaBebas: 0, melewatiBatas };
  const bebas = jenis === 'op' ? PPH_UMKM.bebasOrangPribadi : 0;
  const sisaSebelum = Math.max(0, bebas - omzetSebelumnya);
  const omzetKenaPajak = Math.max(0, omzetBulanIni - sisaSebelum);
  return {
    berhak,
    omzetKenaPajak,
    pph: Math.round(omzetKenaPajak * PPH_UMKM.tarif),
    sisaBebas: Math.max(0, bebas - kumulatif),
    melewatiBatas,
  };
};
