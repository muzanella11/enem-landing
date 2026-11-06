import { KCA } from '../data/gadai';

/** Gold pawn (Story 53). Money in rupiah. */
export const taksiranEmas = (
  gram: number,
  kadarPersen: number,
  hargaPerGram24k: number,
) => gram * (kadarPersen / 100) * hargaPerGram24k;

/** 15-day periods started by day `hari` (day 1-15 = 1 period, day 16 = 2). */
export const jumlahPeriode = (
  hari: number,
  hariPerPeriode = KCA.hariPerPeriode,
) => Math.max(1, Math.ceil(hari / hariPerPeriode));

export const adminKca = (pinjaman: number) =>
  pinjaman <= 500_000
    ? KCA.adminTerkecil
    : pinjaman > 20_000_000
      ? KCA.adminTerbesar
      : null;

/** Redeeming a KCA pawn after `hari` days. */
export const tebusKca = (
  pinjaman: number,
  sewaModalPersen: number,
  hari: number,
  admin: number,
) => {
  const periode = jumlahPeriode(hari);
  const sewaModal = Math.round((pinjaman * sewaModalPersen * periode) / 100);
  return {
    periode,
    sewaModal,
    admin,
    tebusan: pinjaman + sewaModal,
    totalBiaya: sewaModal + admin,
  };
};

/** Redemption cost at each period up to the 120-day term. */
export const tabelTebusKca = (pinjaman: number, sewaModalPersen: number) =>
  Array.from({ length: KCA.tenorHari / KCA.hariPerPeriode }, (_, i) => {
    const hari = (i + 1) * KCA.hariPerPeriode;
    return {
      sampaiHari: hari,
      ...tebusKca(pinjaman, sewaModalPersen, hari, 0),
    };
  });

/** Flat monthly instalment (pokok/tenor + pokok x rate), as in Pegadaian's simulations. */
export const angsuranFlat = (
  pinjaman: number,
  persenPerBulan: number,
  tenorBulan: number,
) => {
  const pokok = pinjaman / tenorBulan;
  const sewa = (pinjaman * persenPerBulan) / 100;
  return {
    angsuran: Math.round(pokok + sewa),
    totalSewa: Math.round(sewa * tenorBulan),
    totalBayar: Math.round((pokok + sewa) * tenorBulan),
  };
};

/** Gold installment purchase: down payment, then flat instalments with the provider's margin. */
export const cicilEmas = (input: {
  gram: number;
  hargaPerGram: number;
  dpPersen: number;
  tenorBulan: number;
  marginPersenPerBulan: number;
  admin: number;
}) => {
  const harga = input.gram * input.hargaPerGram;
  const dp = (harga * input.dpPersen) / 100;
  const sisa = harga - dp;
  const cicilan = angsuranFlat(
    sisa,
    input.marginPersenPerBulan,
    input.tenorBulan,
  );
  return {
    harga,
    dp,
    sisa,
    ...cicilan,
    totalSemua: dp + cicilan.totalBayar + input.admin,
    selisihDariTunai: dp + cicilan.totalBayar + input.admin - harga,
  };
};
