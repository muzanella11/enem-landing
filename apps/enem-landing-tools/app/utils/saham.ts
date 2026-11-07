import {
  FRAKSI_HARGA,
  LEMBAR_PER_LOT,
  PPH_DIVIDEN_PERSEN,
  PPH_JUAL_SAHAM_PERSEN,
} from '../data/investasi';

/** Stock calculators (Story 54). */
export const fraksi = (harga: number) =>
  [...FRAKSI_HARGA].reverse().find(([dari]) => harga >= dari)![1];

/** Nearest valid price at or above (`atas`) or at or below the given price. */
export const bulatkanFraksi = (harga: number, atas = true) => {
  const f = fraksi(harga);
  const hasil = (atas ? Math.ceil(harga / f) : Math.floor(harga / f)) * f;
  // Crossing a band boundary can change the tick; re-check once.
  const f2 = fraksi(hasil);
  return f2 === f
    ? hasil
    : (atas ? Math.ceil(harga / f2) : Math.floor(harga / f2)) * f2;
};

export const hitungTransaksi = (input: {
  hargaBeli: number;
  lot: number;
  hargaJual: number;
  feeBeliPersen: number;
  feeJualPersen: number;
}) => {
  const lembar = input.lot * LEMBAR_PER_LOT;
  const nilaiBeli = lembar * input.hargaBeli;
  const feeBeli = (nilaiBeli * input.feeBeliPersen) / 100;
  const modal = nilaiBeli + feeBeli;
  const nilaiJual = lembar * input.hargaJual;
  const feeJual = (nilaiJual * input.feeJualPersen) / 100;
  const pph = (nilaiJual * PPH_JUAL_SAHAM_PERSEN) / 100;
  const diterima = nilaiJual - feeJual - pph;
  const laba = diterima - modal;
  return {
    lembar,
    nilaiBeli,
    feeBeli,
    modal,
    nilaiJual,
    feeJual,
    pph,
    diterima,
    laba,
    persen: modal ? (laba / modal) * 100 : 0,
  };
};

/** Break-even sale price after buy fee, sell fee, and the 0,1% tax, rounded up to a valid tick. */
export const hargaImpas = (
  hargaBeli: number,
  feeBeliPersen: number,
  feeJualPersen: number,
) =>
  bulatkanFraksi(
    (hargaBeli * (1 + feeBeliPersen / 100)) /
      (1 - (feeJualPersen + PPH_JUAL_SAHAM_PERSEN) / 100),
  );

/** Sale price for a target net profit percent, rounded up to a valid tick. */
export const hargaTarget = (
  hargaBeli: number,
  targetPersen: number,
  feeBeliPersen: number,
  feeJualPersen: number,
) =>
  bulatkanFraksi(
    (hargaBeli * (1 + feeBeliPersen / 100) * (1 + targetPersen / 100)) /
      (1 - (feeJualPersen + PPH_JUAL_SAHAM_PERSEN) / 100),
  );

export const lotDariModal = (
  modal: number,
  harga: number,
  feeBeliPersen: number,
) => Math.floor(modal / (harga * LEMBAR_PER_LOT * (1 + feeBeliPersen / 100)));

/** Average price (excluding fees) of several buys. */
export const hargaRataRata = (pembelian: { harga: number; lot: number }[]) => {
  const lot = pembelian.reduce((s, p) => s + p.lot, 0);
  return lot ? pembelian.reduce((s, p) => s + p.harga * p.lot, 0) / lot : 0;
};

/** Lots to buy at `hargaBaru` to bring the average down (or up) to `target`. Null when impossible. */
export const lotUntukTarget = (
  rataRata: number,
  lotSekarang: number,
  hargaBaru: number,
  target: number,
) => {
  if (hargaBaru === target) return null;
  const lot = (lotSekarang * (rataRata - target)) / (target - hargaBaru);
  return lot > 0 && Number.isFinite(lot) ? Math.ceil(lot) : null;
};

export const hitungDividen = (input: {
  dividenPerLembar: number;
  lot: number;
  hargaBeli: number;
  bebasPajak: boolean;
}) => {
  const bruto = input.dividenPerLembar * input.lot * LEMBAR_PER_LOT;
  const pajak = input.bebasPajak ? 0 : (bruto * PPH_DIVIDEN_PERSEN) / 100;
  return {
    bruto,
    pajak,
    bersih: bruto - pajak,
    yieldPersen: input.hargaBeli
      ? (input.dividenPerLembar / input.hargaBeli) * 100
      : 0,
  };
};

/** Mutual fund units bought at a NAV, after the subscription fee. */
export const unitReksaDana = (
  nominal: number,
  nab: number,
  biayaBeliPersen: number,
) => {
  const biaya = (nominal * biayaBeliPersen) / 100;
  return { biaya, unit: nab > 0 ? (nominal - biaya) / nab : 0 };
};

export const nilaiJualReksaDana = (
  unit: number,
  nab: number,
  biayaJualPersen: number,
) => {
  const bruto = unit * nab;
  const biaya = (bruto * biayaJualPersen) / 100;
  return { bruto, biaya, bersih: bruto - biaya };
};
