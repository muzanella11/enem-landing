/** Stock and mutual fund rules (Story 54). Checked 2026-11-06. */
export const CHECKED_AT = '2026-11-06';

/** 1 lot = 100 shares on the Indonesia Stock Exchange. */
export const LEMBAR_PER_LOT = 100;

/** Price ticks (fraksi harga), BEI Peraturan II-A (Kep-00055/BEI/03-2023): [price from, tick]. */
export const FRAKSI_HARGA: [number, number][] = [
  [0, 1],
  [200, 2],
  [500, 5],
  [2000, 10],
  [5000, 25],
];

/** Final income tax on share sales on the exchange: 0,1% of the gross sale value. */
export const PPH_JUAL_SAHAM_PERSEN = 0.1;
/** Domestic dividends to resident individuals: 10% final, or exempt when reinvested in Indonesia for the required period. */
export const PPH_DIVIDEN_PERSEN = 10;

/** Example broker fees; every broker differs, so these are only defaults. */
export const FEE_CONTOH = { beli: 0.15, jual: 0.25 };

export const SUMBER_INVESTASI = [
  {
    label:
      'BEI: Jam dan Mekanisme Perdagangan (satuan perdagangan dan fraksi harga)',
    url: 'https://www.idx.co.id/id/produk/mekanisme-dan-jam-perdagangan',
  },
  {
    label:
      'BEI: Peraturan II-A Kep-00055/BEI/03-2023 tentang Perdagangan Efek Bersifat Ekuitas',
    url: 'https://www.idx.co.id/',
  },
  {
    label:
      'DDTC: rekap peraturan PPh atas transaksi penjualan saham (PPh final 0,1%)',
    url: 'https://perpajakan.ddtc.co.id/id/panduan-pajak/rekap-peraturan/rekap-peraturan-atas-transaksi-penjualan-saham',
  },
  {
    label:
      'PP 9/2021 dan PMK 18/PMK.03/2021: PPh dividen orang pribadi dalam negeri dan pengecualiannya',
    url: 'https://jdih.kemenkeu.go.id/',
  },
];

export const DISCLAIMER_SAHAM =
  'Simulasi hitungan, bukan rekomendasi membeli atau menjual efek apa pun. Harga saham dan reksa dana bisa naik dan turun.';
