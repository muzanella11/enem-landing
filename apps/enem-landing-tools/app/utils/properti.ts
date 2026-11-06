import { PNBP_BPN, PPH_PENJUAL_PERSEN } from '../data/properti';
import { hitungBphtb } from './loan';

/** Property calculators (Story 47). */

export const biayaBangun = (
  luasPerLantai: number[],
  biayaPerM2: number,
  takTerdugaPersen: number,
) => {
  const luas = luasPerLantai.reduce((s, l) => s + Math.max(0, l), 0);
  const dasar = luas * biayaPerM2;
  const cadangan = (dasar * takTerdugaPersen) / 100;
  return { luas, dasar, cadangan, total: dasar + cadangan };
};

/**
 * PBB-P2 (UU 1/2022): rate x (persenNjop% x (NJOP - NJOPTKP)).
 */
export const hitungPbb = (input: {
  luasTanah: number;
  njopTanahM2: number;
  luasBangunan: number;
  njopBangunanM2: number;
  njoptkp: number;
  tarifPersen: number;
  persenNjop: number;
}) => {
  const njop =
    input.luasTanah * input.njopTanahM2 +
    input.luasBangunan * input.njopBangunanM2;
  const kenaPajak = Math.max(0, njop - input.njoptkp);
  const dasar = (kenaPajak * input.persenNjop) / 100;
  return {
    njop,
    kenaPajak,
    dasar,
    pbb: Math.round((dasar * input.tarifPersen) / 100),
  };
};

/** Costs of a sale: buyer pays BPHTB, seller pays PPh; PPAT and BPN costs are usually agreed between them. */
export const biayaBalikNama = (input: {
  hargaTransaksi: number;
  njop: number;
  npoptkp: number;
  tarifBphtbPersen: number;
  honorPpatPersen: number;
  nilaiTanahBpn?: number;
}) => {
  // NPOP: the transaction value, or NJOP when that is higher.
  const npop = Math.max(input.hargaTransaksi, input.njop);
  const bphtb = hitungBphtb(npop, input.npoptkp, input.tarifBphtbPersen);
  const pphPenjual = Math.round(
    (input.hargaTransaksi * PPH_PENJUAL_PERSEN) / 100,
  );
  const honorPpat = Math.round(
    (input.hargaTransaksi * input.honorPpatPersen) / 100,
  );
  const nilaiTanah = input.nilaiTanahBpn ?? input.njop;
  const pnbpBpn =
    Math.round(nilaiTanah / PNBP_BPN.pembagi + PNBP_BPN.tetap) +
    PNBP_BPN.cekSertifikat;
  return {
    npop,
    bphtb,
    pphPenjual,
    honorPpat,
    pnbpBpn,
    totalPembeli: bphtb + honorPpat + pnbpBpn,
  };
};
