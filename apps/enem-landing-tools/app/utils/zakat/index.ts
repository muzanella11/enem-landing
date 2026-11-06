import { ZAKAT_RULES } from '../../data/zakat/rules.js';

const zakatOf = (amount: number): number =>
  Math.round((amount * ZAKAT_RULES.ratePct) / 100);

export const nisabTahunan = (goldPricePerGram: number): number =>
  Math.round(ZAKAT_RULES.nisabGoldGrams * goldPricePerGram);

export const nisabBulanan = (goldPricePerGram: number): number =>
  Math.round(nisabTahunan(goldPricePerGram) / 12);

export interface PenghasilanInput {
  penghasilanBulanan: number;
  penghasilanLain: number;
  /** Used only in `neto` mode. */
  kebutuhanPokok: number;
  mode: 'bruto' | 'neto';
  goldPricePerGram: number;
}

export interface PenghasilanResult {
  dasar: number;
  nisabBulanan: number;
  wajib: boolean;
  perBulan: number;
  perTahun: number;
}

/**
 * Zakat penghasilan: due monthly when the month's income reaches 1/12 of
 * the 85 g gold nisab. `bruto` (BAZNAS default) uses gross income; `neto`
 * subtracts basic needs first.
 */
export const zakatPenghasilan = (
  input: PenghasilanInput,
): PenghasilanResult => {
  const gross = input.penghasilanBulanan + input.penghasilanLain;
  const dasar =
    input.mode === 'neto' ? Math.max(0, gross - input.kebutuhanPokok) : gross;
  const nisab = nisabBulanan(input.goldPricePerGram);
  const wajib = dasar > 0 && dasar >= nisab;
  const perBulan = wajib ? zakatOf(dasar) : 0;
  return {
    dasar,
    nisabBulanan: nisab,
    wajib,
    perBulan,
    perTahun: perBulan * 12,
  };
};

export interface MaalInput {
  tabungan: number;
  deposito: number;
  emasGram: number;
  investasi: number;
  piutang: number;
  utangJatuhTempo: number;
  goldPricePerGram: number;
}

export interface MaalResult {
  nilaiEmas: number;
  totalHarta: number;
  nisab: number;
  wajib: boolean;
  zakat: number;
}

/** Zakat maal on wealth held for one hijri year (haul), net of debts due. */
export const zakatMaal = (input: MaalInput): MaalResult => {
  const nilaiEmas = Math.round(input.emasGram * input.goldPricePerGram);
  const totalHarta = Math.max(
    0,
    input.tabungan +
      input.deposito +
      nilaiEmas +
      input.investasi +
      input.piutang -
      input.utangJatuhTempo,
  );
  const nisab = nisabTahunan(input.goldPricePerGram);
  const wajib = totalHarta > 0 && totalHarta >= nisab;
  return {
    nilaiEmas,
    totalHarta,
    nisab,
    wajib,
    zakat: wajib ? zakatOf(totalHarta) : 0,
  };
};

export interface FitrahInput {
  jiwa: number;
  mode: 'uang' | 'beras';
  uangPerJiwa: number;
  berasKgPerJiwa: number;
}

export interface FitrahResult {
  totalUang: number | null;
  totalBerasKg: number | null;
  totalBerasLiter: number | null;
}

export const zakatFitrah = (input: FitrahInput): FitrahResult => {
  const jiwa = Math.max(0, Math.floor(input.jiwa));
  if (input.mode === 'uang') {
    return {
      totalUang: jiwa * input.uangPerJiwa,
      totalBerasKg: null,
      totalBerasLiter: null,
    };
  }
  const kg = Math.round(jiwa * input.berasKgPerJiwa * 100) / 100;
  const literPerKg =
    ZAKAT_RULES.fitrah.berasLiterPerJiwa / ZAKAT_RULES.fitrah.berasKgPerJiwa;
  return {
    totalUang: null,
    totalBerasKg: kg,
    totalBerasLiter: Math.round(kg * literPerKg * 100) / 100,
  };
};
