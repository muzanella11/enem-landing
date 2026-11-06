/** VAT, withholding taxes, and rental tax (Story 55). Checked 2026-11-06. */
export const CHECKED_AT = '2026-11-06';

/** PPN 12% (UU 7/2021 HPP). PMK 131/2024: non-luxury goods/services use DPP = 11/12 of the price (effective 11%). */
export const PPN = {
  tarif: 12,
  dppNilaiLainPembilang: 11,
  dppNilaiLainPenyebut: 12,
};

/** PPh Pasal 23 rates (percent of gross); without NPWP the rate is 100% higher (Pasal 23 ayat 1a). */
export const PPH_23 = [
  {
    id: 'jasa',
    label: 'Jasa (teknik, manajemen, konsultan, dan jasa lain)',
    tarif: 2,
  },
  {
    id: 'sewa-harta',
    label: 'Sewa harta selain tanah dan/atau bangunan (mis. kendaraan, alat)',
    tarif: 2,
  },
  { id: 'royalti', label: 'Royalti', tarif: 15 },
  {
    id: 'bunga',
    label: 'Bunga (selain dari bank/koperasi tertentu)',
    tarif: 15,
  },
  {
    id: 'hadiah',
    label: 'Hadiah dan penghargaan (selain yang dipotong PPh 21)',
    tarif: 15,
  },
  {
    id: 'dividen',
    label: 'Dividen kepada badan (bila tidak dikecualikan)',
    tarif: 15,
  },
] as const;
export type JenisPph23 = (typeof PPH_23)[number]['id'];
export const KENAIKAN_TANPA_NPWP = 100;

/** PPh final Pasal 4 ayat (2) on renting land and/or buildings: 10% of gross rent (PP 34/2017). */
export const PPH_SEWA_TANAH_BANGUNAN = 10;

export const SUMBER_PAJAK_USAHA = [
  {
    label:
      'DDTC: tarif efektif PPN setelah PPN 12% dan DPP nilai lain 11/12 (PMK 131/2024)',
    url: 'https://news.ddtc.co.id/literasi/kamus/1807955/memahami-sekilas-soal-tarif-efektif-setelah-ppn-12-berlaku',
  },
  {
    label: 'DJP: PMK 131/2024 tentang perlakuan PPN 12%',
    url: 'https://www.pajak.go.id/index.php/en/node/113886',
  },
  {
    label:
      'UU No. 36 Tahun 2008 Pasal 23 (tarif PPh 23 dan kenaikan 100% tanpa NPWP)',
    url: 'https://peraturan.bpk.go.id/Details/39704/uu-no-36-tahun-2008',
  },
  {
    label:
      'PP No. 34 Tahun 2017: PPh atas penghasilan dari persewaan tanah dan/atau bangunan',
    url: 'https://peraturan.bpk.go.id/Details/64646/pp-no-34-tahun-2017',
  },
];

export const SUMBER_SPT = [
  {
    label: 'UU No. 7 Tahun 2021 (HPP): tarif Pasal 17 orang pribadi',
    url: 'https://peraturan.bpk.go.id/Details/185162/uu-no-7-tahun-2021',
  },
  {
    label: 'PMK 168/2023: PPh 21 setahun dan bukti potong 1721-A1',
    url: 'https://jdih.kemenkeu.go.id/',
  },
  {
    label:
      'PP 60/2010: zakat atau sumbangan keagamaan wajib sebagai pengurang penghasilan bruto',
    url: 'https://peraturan.bpk.go.id/Details/5110/pp-no-60-tahun-2010',
  },
];
