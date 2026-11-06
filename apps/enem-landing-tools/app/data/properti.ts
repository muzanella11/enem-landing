/** Property tax and transfer cost rules with sources (Story 47). Checked 2026-11-06. */
export const CHECKED_AT = '2026-11-06';

export const PBB = {
  /** UU 1/2022 Pasal 41: PBB-P2 rate at most 0,5%. */
  tarifMaksPersen: 0.5,
  /** Pasal 40: NJOPTKP at least Rp10 juta per taxpayer. */
  njoptkpMin: 10_000_000,
  /** Pasal 40: the NJOP used is 20% to 100% of NJOP after NJOPTKP, set per region. */
  persenNjopMin: 20,
};

export const BPHTB = {
  /** UU 1/2022 Pasal 47: at most 5%. */
  tarifMaksPersen: 5,
  /** Pasal 46: NPOPTKP at least Rp80 juta (Rp300 juta for inheritance/grant within the family). */
  npoptkpMin: 80_000_000,
  npoptkpWarisMin: 300_000_000,
};

/** PP 34/2016: final income tax on land/building transfer paid by the seller. */
export const PPH_PENJUAL_PERSEN = 2.5;
/** PP 24/2016 Pasal 32: PPAT fee at most 1% of the transaction value. */
export const HONOR_PPAT_MAKS_PERSEN = 1;
/** PP 128/2015: PNBP for transfer registration = land value / 1000 + Rp50.000; certificate check Rp50.000. */
export const PNBP_BPN = { pembagi: 1000, tetap: 50_000, cekSertifikat: 50_000 };

export const SUMBER_PROPERTI = [
  {
    label: 'UU No. 1 Tahun 2022 (HKPD): PBB-P2 dan BPHTB',
    url: 'https://peraturan.bpk.go.id/Details/195682/uu-no-1-tahun-2022',
  },
  {
    label:
      'PP No. 34 Tahun 2016: PPh atas pengalihan hak atas tanah dan/atau bangunan',
    url: 'https://peraturan.bpk.go.id/Details/5770/pp-no-34-tahun-2016',
  },
  {
    label:
      'PP No. 24 Tahun 2016: perubahan peraturan jabatan PPAT (honor maks 1%)',
    url: 'https://peraturan.bpk.go.id/Details/5764/pp-no-24-tahun-2016',
  },
  {
    label: 'PP No. 128 Tahun 2015: tarif PNBP di Kementerian ATR/BPN',
    url: 'https://peraturan.bpk.go.id/Details/5682/pp-no-128-tahun-2015',
  },
];
