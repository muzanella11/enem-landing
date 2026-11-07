import { describe, expect, it } from 'vitest';
import {
  nisabBulanan,
  nisabTahunan,
  zakatFitrah,
  zakatMaal,
  zakatPenghasilan,
} from './index.js';

const GOLD = 2_000_000; // per gram, round number for readable tests

describe('nisab', () => {
  it('is 85 g of gold per year, 1/12 per month', () => {
    expect(nisabTahunan(GOLD)).toBe(170_000_000);
    expect(nisabBulanan(GOLD)).toBe(14_166_667);
  });
});

describe('zakatPenghasilan', () => {
  const base = {
    penghasilanBulanan: 0,
    penghasilanLain: 0,
    kebutuhanPokok: 0,
    mode: 'bruto' as const,
    goldPricePerGram: GOLD,
  };

  it('exactly at nisab is due', () => {
    const result = zakatPenghasilan({
      ...base,
      penghasilanBulanan: 14_166_667,
    });
    expect(result.wajib).toBe(true);
    expect(result.perBulan).toBe(354_167);
    expect(result.perTahun).toBe(354_167 * 12);
  });

  it('below nisab is not due', () => {
    const result = zakatPenghasilan({
      ...base,
      penghasilanBulanan: 14_166_666,
    });
    expect(result.wajib).toBe(false);
    expect(result.perBulan).toBe(0);
  });

  it('bruto vs neto', () => {
    const input = {
      ...base,
      penghasilanBulanan: 18_000_000,
      penghasilanLain: 2_000_000,
      kebutuhanPokok: 7_000_000,
    };
    expect(zakatPenghasilan(input).perBulan).toBe(500_000);
    const neto = zakatPenghasilan({ ...input, mode: 'neto' });
    expect(neto.dasar).toBe(13_000_000);
    expect(neto.wajib).toBe(false);
  });
});

describe('zakatMaal', () => {
  const base = {
    tabungan: 0,
    deposito: 0,
    emasGram: 0,
    investasi: 0,
    piutang: 0,
    utangJatuhTempo: 0,
    goldPricePerGram: GOLD,
  };

  it('sums assets including gold and subtracts debts due', () => {
    const result = zakatMaal({
      ...base,
      tabungan: 100_000_000,
      deposito: 50_000_000,
      emasGram: 10,
      investasi: 30_000_000,
      piutang: 5_000_000,
      utangJatuhTempo: 15_000_000,
    });
    expect(result.nilaiEmas).toBe(20_000_000);
    expect(result.totalHarta).toBe(190_000_000);
    expect(result.wajib).toBe(true);
    expect(result.zakat).toBe(4_750_000);
  });

  it('at nisab is due, just below is not', () => {
    expect(zakatMaal({ ...base, tabungan: 170_000_000 }).wajib).toBe(true);
    expect(zakatMaal({ ...base, tabungan: 169_999_999 }).wajib).toBe(false);
  });

  it('debts larger than assets never go negative', () => {
    expect(
      zakatMaal({ ...base, tabungan: 1, utangJatuhTempo: 10 }).totalHarta,
    ).toBe(0);
  });
});

describe('zakatFitrah', () => {
  it('money per person', () => {
    expect(
      zakatFitrah({
        jiwa: 4,
        mode: 'uang',
        uangPerJiwa: 47_000,
        berasKgPerJiwa: 2.5,
      }).totalUang,
    ).toBe(188_000);
  });

  it('rice in kg and liter', () => {
    const result = zakatFitrah({
      jiwa: 3,
      mode: 'beras',
      uangPerJiwa: 0,
      berasKgPerJiwa: 2.5,
    });
    expect(result.totalBerasKg).toBe(7.5);
    expect(result.totalBerasLiter).toBe(10.5);
  });
});
