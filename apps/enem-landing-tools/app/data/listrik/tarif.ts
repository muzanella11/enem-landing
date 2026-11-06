/**
 * PLN household tariffs for prepaid tokens (Story 37), Triwulan IV 2026
 * (Oktober-Desember), unchanged from Triwulan III per the government's
 * tariff adjustment announcement. Reported consistently by Kompas, CNBC
 * Indonesia, and CNN Indonesia (November 2026); verify against PLN's own
 * "Tariff Adjustment Oktober-Desember 2026" document each quarter.
 */
export interface GolonganTarif {
  id: string;
  label: string;
  rupiahPerKwh: number;
  /** PPN on electricity applies to households of 6.600 VA and above. */
  kenaPpn: boolean;
}

export const TARIF_LISTRIK = {
  periode: 'Triwulan IV 2026 (Oktober-Desember)',
  checkedAt: '2026-11-06',
  golongan: [
    {
      id: 'r1-450',
      label: 'R-1 450 VA (subsidi)',
      rupiahPerKwh: 415,
      kenaPpn: false,
    },
    {
      id: 'r1-900',
      label: 'R-1 900 VA (subsidi)',
      rupiahPerKwh: 605,
      kenaPpn: false,
    },
    {
      id: 'r1-900-rtm',
      label: 'R-1 900 VA RTM (nonsubsidi)',
      rupiahPerKwh: 1352,
      kenaPpn: false,
    },
    {
      id: 'r1-1300',
      label: 'R-1 1.300 VA',
      rupiahPerKwh: 1444.7,
      kenaPpn: false,
    },
    {
      id: 'r1-2200',
      label: 'R-1 2.200 VA',
      rupiahPerKwh: 1444.7,
      kenaPpn: false,
    },
    {
      id: 'r2-3500',
      label: 'R-2 3.500 sampai 5.500 VA',
      rupiahPerKwh: 1699.53,
      kenaPpn: false,
    },
    {
      id: 'r3-6600',
      label: 'R-3 6.600 VA ke atas',
      rupiahPerKwh: 1699.53,
      kenaPpn: true,
    },
  ] satisfies GolonganTarif[],
  /** Effective PPN on electricity for R-3 (dicek ulang saat pembaruan tarif). */
  ppnPersen: 11,
  /** Regional tax on electricity (PBJT tenaga listrik, dulu PPJ) varies per region; this is only the starting value. */
  pajakDaerahBawaanPersen: 3,
  sources: [
    {
      label:
        'CNBC Indonesia: Daftar tarif listrik PLN per kWh berlaku hingga Desember 2026',
      url: 'https://www.cnbcindonesia.com/news/20261104072435-4-782094/resmi-daftar-tarif-listrik-pln-per-kwh-berlaku-hingga-desember-2026',
    },
    {
      label: 'Kompas: Tarif listrik PLN November 2026, semua golongan',
      url: 'https://money.kompas.com/read/2026/11/02/083952426/tarif-listrik-pln-november-2026-cek-daftar-lengkap-semua-golongan',
    },
    {
      label: 'PLN: penyesuaian tarif tenaga listrik (tariff adjustment)',
      url: 'https://web.pln.co.id/',
    },
  ],
  caveats: [
    'Pajak daerah atas listrik (PBJT, dulu PPJ) berbeda per kabupaten/kota. Cek baris PPJ/PBJT di struk tokenmu dan isi persentasenya sendiri.',
    'Biaya admin tergantung tempat membeli (bank, e-wallet, minimarket).',
  ],
} as const;

/** Common token nominals with their own answer pages. */
export const NOMINAL_TOKEN = [
  20_000, 50_000, 100_000, 200_000, 500_000, 1_000_000,
] as const;

/** Typical appliance wattage presets; users can edit every value. */
export const PERALATAN_PRESET = [
  { nama: 'Lampu LED', watt: 10, jam: 8, jumlah: 6 },
  { nama: 'Kulkas', watt: 100, jam: 24, jumlah: 1 },
  { nama: 'TV LED', watt: 60, jam: 5, jumlah: 1 },
  { nama: 'AC 1/2 PK', watt: 350, jam: 8, jumlah: 1 },
  { nama: 'Rice cooker (menghangatkan)', watt: 50, jam: 10, jumlah: 1 },
  { nama: 'Mesin cuci', watt: 300, jam: 1, jumlah: 1 },
  { nama: 'Pompa air', watt: 125, jam: 2, jumlah: 1 },
  { nama: 'Kipas angin', watt: 45, jam: 8, jumlah: 2 },
  { nama: 'Charger HP/laptop', watt: 30, jam: 4, jumlah: 2 },
] as const;
