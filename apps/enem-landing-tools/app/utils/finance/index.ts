/**
 * Time-value-of-money helpers (Story 41), matching spreadsheet FV/PV/PMT
 * with payments at the end of each period. Rates are per period (decimal).
 * Results are positive amounts rather than spreadsheet sign conventions.
 */

/** Future value of `pv` today plus `pmt` each period for `n` periods. */
export const fv = (rate: number, n: number, pmt: number, pv = 0): number =>
  rate === 0
    ? pv + pmt * n
    : pv * (1 + rate) ** n + pmt * (((1 + rate) ** n - 1) / rate);

/** Present value of `pmt` each period for `n` periods (an annuity). */
export const pv = (rate: number, n: number, pmt: number): number =>
  rate === 0 ? pmt * n : (pmt * (1 - (1 + rate) ** -n)) / rate;

/** Payment per period to grow `pv` into `target` in `n` periods. */
export const pmt = (
  rate: number,
  n: number,
  target: number,
  pv = 0,
): number => {
  if (n <= 0) return 0;
  const gap = target - pv * (1 + rate) ** n;
  if (gap <= 0) return 0;
  return rate === 0 ? gap / n : (gap * rate) / ((1 + rate) ** n - 1);
};

/** Annual rate (decimal) to an equivalent monthly compounding rate. */
export const bulananEfektif = (tahunan: number) =>
  (1 + tahunan) ** (1 / 12) - 1;

/** Value of `nominal` after `tahun` years in today's money. */
export const nilaiRiil = (nominal: number, inflasi: number, tahun: number) =>
  nominal / (1 + inflasi) ** tahun;

// --- Deposito ------------------------------------------------------------

export interface HasilDeposito {
  bungaKotor: number;
  pajak: number;
  bungaBersih: number;
  saldoAkhir: number;
}

/**
 * Deposit interest (bank practice: simple interest per tenor on actual
 * days/365 is approximated by months/12). With ARO the net amount is
 * rolled over for `putaran` tenors.
 */
export const hitungDeposito = (
  nominal: number,
  bungaTahunan: number,
  tenorBulan: number,
  opsi: { kenaPajak: boolean; tarifPajak: number; putaran?: number },
): HasilDeposito => {
  let saldo = nominal;
  let kotor = 0;
  let pajak = 0;
  for (let i = 0; i < (opsi.putaran ?? 1); i += 1) {
    const bunga = saldo * bungaTahunan * (tenorBulan / 12);
    const potong = opsi.kenaPajak ? bunga * opsi.tarifPajak : 0;
    kotor += bunga;
    pajak += potong;
    saldo += bunga - potong;
  }
  return {
    bungaKotor: kotor,
    pajak,
    bungaBersih: kotor - pajak,
    saldoAkhir: saldo,
  };
};

// --- Investasi rutin -----------------------------------------------------

export interface TitikPertumbuhan {
  tahun: number;
  modal: number;
  nilai: number;
}

export const pertumbuhanInvestasi = (
  awal: number,
  setoranBulanan: number,
  imbalTahunan: number,
  tahun: number,
): TitikPertumbuhan[] => {
  const r = bulananEfektif(imbalTahunan);
  return Array.from({ length: tahun + 1 }, (_, t) => ({
    tahun: t,
    modal: awal + setoranBulanan * 12 * t,
    nilai: fv(r, 12 * t, setoranBulanan, awal),
  }));
};

// --- Pensiun -------------------------------------------------------------

export interface HasilPensiun {
  tahunMenabung: number;
  pengeluaranSaatPensiun: number;
  danaDibutuhkan: number;
  setoranBulanan: number;
}

/**
 * Fund needed at retirement to pay inflation-adjusted monthly expenses for
 * `lamaPensiun` years, assuming the fund keeps earning `imbalPensiun`
 * (a growing annuity, approximated monthly with real return).
 */
export const hitungPensiun = (input: {
  usia: number;
  usiaPensiun: number;
  lamaPensiun: number;
  pengeluaranBulanan: number;
  inflasi: number;
  imbalSebelum: number;
  imbalPensiun: number;
  danaSekarang: number;
}): HasilPensiun => {
  const tahunMenabung = Math.max(0, input.usiaPensiun - input.usia);
  const pengeluaranSaatPensiun =
    input.pengeluaranBulanan * (1 + input.inflasi) ** tahunMenabung;
  const riil = (1 + input.imbalPensiun) / (1 + input.inflasi) - 1;
  // Withdrawals at the start of each month, growing with inflation.
  const danaDibutuhkan =
    pv(bulananEfektif(riil), input.lamaPensiun * 12, pengeluaranSaatPensiun) *
    (1 + bulananEfektif(riil));
  const setoranBulanan = pmt(
    bulananEfektif(input.imbalSebelum),
    tahunMenabung * 12,
    danaDibutuhkan,
    input.danaSekarang,
  );
  return {
    tahunMenabung,
    pengeluaranSaatPensiun,
    danaDibutuhkan,
    setoranBulanan,
  };
};
