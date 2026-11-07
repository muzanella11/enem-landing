/**
 * Unit conversion data (Story 40). Metric/imperial factors are exact SI
 * definitions. Traditional Indonesian land units vary by region and by
 * source; every variant is kept with where it came from, and the pages
 * show all of them instead of picking one.
 */
export interface Satuan {
  id: string;
  label: string;
  /** Multiply by this to get the base unit of the category. */
  faktor: number;
}

export interface Kategori {
  id: 'panjang' | 'berat' | 'volume' | 'luas' | 'kecepatan';
  label: string;
  dasar: string;
  satuan: Satuan[];
}

export const KATEGORI: Kategori[] = [
  {
    id: 'panjang',
    label: 'Panjang',
    dasar: 'meter',
    satuan: [
      { id: 'mm', label: 'milimeter (mm)', faktor: 0.001 },
      { id: 'cm', label: 'sentimeter (cm)', faktor: 0.01 },
      { id: 'm', label: 'meter (m)', faktor: 1 },
      { id: 'km', label: 'kilometer (km)', faktor: 1000 },
      { id: 'in', label: 'inci (in)', faktor: 0.0254 },
      { id: 'ft', label: 'kaki (ft)', faktor: 0.3048 },
      { id: 'yd', label: 'yard (yd)', faktor: 0.9144 },
      { id: 'mi', label: 'mil (mi)', faktor: 1609.344 },
    ],
  },
  {
    id: 'berat',
    label: 'Berat',
    dasar: 'kilogram',
    satuan: [
      { id: 'mg', label: 'miligram (mg)', faktor: 0.000001 },
      { id: 'g', label: 'gram (g)', faktor: 0.001 },
      { id: 'ons', label: 'ons (100 g)', faktor: 0.1 },
      { id: 'kg', label: 'kilogram (kg)', faktor: 1 },
      { id: 'kuintal', label: 'kuintal (100 kg)', faktor: 100 },
      { id: 'ton', label: 'ton (1.000 kg)', faktor: 1000 },
      { id: 'lb', label: 'pon (lb)', faktor: 0.45359237 },
      { id: 'oz', label: 'ounce (oz)', faktor: 0.028349523125 },
    ],
  },
  {
    id: 'volume',
    label: 'Volume',
    dasar: 'liter',
    satuan: [
      { id: 'ml', label: 'mililiter (ml)', faktor: 0.001 },
      { id: 'l', label: 'liter (l)', faktor: 1 },
      { id: 'm3', label: 'meter kubik (m³)', faktor: 1000 },
      { id: 'cc', label: 'cc', faktor: 0.001 },
      { id: 'gal', label: 'galon AS (gal)', faktor: 3.785411784 },
      { id: 'floz', label: 'fluid ounce AS (fl oz)', faktor: 0.0295735295625 },
    ],
  },
  {
    id: 'luas',
    label: 'Luas',
    dasar: 'meter persegi',
    satuan: [
      { id: 'cm2', label: 'sentimeter persegi (cm²)', faktor: 0.0001 },
      { id: 'm2', label: 'meter persegi (m²)', faktor: 1 },
      { id: 'are', label: 'are (100 m²)', faktor: 100 },
      { id: 'ha', label: 'hektare (10.000 m²)', faktor: 10_000 },
      { id: 'km2', label: 'kilometer persegi (km²)', faktor: 1_000_000 },
      { id: 'ft2', label: 'kaki persegi (ft²)', faktor: 0.09290304 },
      { id: 'acre', label: 'acre', faktor: 4046.8564224 },
    ],
  },
  {
    id: 'kecepatan',
    label: 'Kecepatan',
    dasar: 'meter per detik',
    satuan: [
      { id: 'ms', label: 'meter per detik (m/s)', faktor: 1 },
      { id: 'kmh', label: 'kilometer per jam (km/jam)', faktor: 1000 / 3600 },
      { id: 'mph', label: 'mil per jam (mph)', faktor: 1609.344 / 3600 },
      { id: 'knot', label: 'knot', faktor: 1852 / 3600 },
    ],
  },
];

export interface SatuanLokal {
  slug: string;
  nama: string;
  varian: {
    m2: number;
    daerah: string;
    sumber: { label: string; url: string };
  }[];
}

const AKURAT = {
  label: 'Akurat.co: hitungan satuan tanah di Pulau Jawa (2025)',
  url: 'https://akurat.co/pendidikan/800094/ukuran-1-bata-berapa-meter-ini-hitungan-resmi-satuan-tanah-di-pulau-jawa-tahun-2025',
};
const SCRIBD_TUMBAK = {
  label: 'Dokumen Scribd: 125 tumbak = 1.750 m² (Jawa Barat)',
  url: 'https://www.scribd.com/presentation/511560280/eracs',
};

export const SATUAN_LOKAL: SatuanLokal[] = [
  {
    slug: 'tumbak',
    nama: 'Tumbak',
    varian: [
      { m2: 14, daerah: 'Jawa Barat (paling umum)', sumber: SCRIBD_TUMBAK },
      { m2: 56, daerah: 'Sebagian sumber (1 tumbak = 4 bata)', sumber: AKURAT },
    ],
  },
  {
    slug: 'bata',
    nama: 'Bata',
    varian: [{ m2: 14, daerah: 'Pulau Jawa', sumber: AKURAT }],
  },
  {
    slug: 'ubin',
    nama: 'Ubin',
    varian: [
      {
        m2: 14,
        daerah: 'Jawa Tengah, DI Yogyakarta, Jawa Timur',
        sumber: AKURAT,
      },
    ],
  },
  {
    slug: 'bahu',
    nama: 'Bahu (bau)',
    varian: [{ m2: 7000, daerah: 'Jawa (500 ubin x 14 m²)', sumber: AKURAT }],
  },
  {
    slug: 'are',
    nama: 'Are',
    varian: [
      {
        m2: 100,
        daerah: 'Satuan baku',
        sumber: {
          label: 'Definisi satuan SI (1 are = 100 m²)',
          url: 'https://www.bipm.org/',
        },
      },
    ],
  },
  {
    slug: 'hektare',
    nama: 'Hektare',
    varian: [
      {
        m2: 10_000,
        daerah: 'Satuan baku',
        sumber: {
          label: 'Definisi satuan SI (1 ha = 10.000 m²)',
          url: 'https://www.bipm.org/',
        },
      },
    ],
  },
];
