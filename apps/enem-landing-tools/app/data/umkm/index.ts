/** UMKM rules with sources (Story 43). Checked 2026-11-06. */
export const CHECKED_AT = '2026-11-06';

/**
 * PPh final 0,5% for certain gross turnover: PP 55/2022 as amended by
 * PP 20/2026 (in force 22 April 2026).
 */
export const PPH_UMKM = {
  tarif: 0.005,
  batasOmzetTahunan: 4_800_000_000,
  /** Individuals: the first Rp500 juta of turnover in a tax year is not taxed (PP 55/2022 Pasal 60 ayat (2)). */
  bebasOrangPribadi: 500_000_000,
};

export const JENIS_WP = [
  { id: 'op', label: 'Orang pribadi', berhak: true },
  { id: 'pp', label: 'Perseroan perorangan (didirikan 1 orang)', berhak: true },
  { id: 'koperasi', label: 'Koperasi', berhak: true },
  { id: 'badan-lain', label: 'CV, firma, PT, atau BUMDes', berhak: false },
] as const;
export type JenisWp = (typeof JENIS_WP)[number]['id'];

export const CATATAN_PPH_UMKM = [
  'Sejak PP 20/2026, CV, firma, PT, dan BUMDes baru tidak bisa lagi memakai tarif 0,5%; wajib pajak yang sudah memakainya tetap boleh sampai jangka waktunya berakhir.',
  'Orang pribadi dengan penghasilan dari jasa pekerjaan bebas (dokter, notaris, konsultan, akuntan, pengacara, seniman, dll) tidak termasuk.',
  'Batas Rp4,8 miliar dihitung dari omzet bruto setahun, digabung suami-istri dan perseroan perorangan yang mereka dirikan.',
];

export const SUMBER_PPH_UMKM = [
  {
    label:
      'DJP (3 Jun 2026): PP 20/2026, tarif PPh 0,5% bagi UMKM orang pribadi',
    url: 'https://pajak.go.id/node/119950',
  },
  {
    label: 'IKPI (29 Mei 2026): revisi PP 55/2022 lewat PP 20/2026',
    url: 'https://ikpi.or.id/resmi-pemerintah-perpanjang-fasilitas-pph-final-umkm-lewat-revisi-pp-55/',
  },
  {
    label:
      'Kompas TV (3 Jun 2026): daftar wajib pajak yang berhak PPh final 0,5%',
    url: 'https://www.kompas.tv/ekonomi/672524/pemerintah-persempit-penerima-pph-final-umkm-0-5-persen-ini-daftar-wajib-pajak-yang-berhak',
  },
];

/**
 * Marketplace fee pages. Fees change often and differ per category and
 * seller program, so the calculator takes them as input; we link to the
 * official pages instead of shipping numbers we cannot keep current.
 */
export const HALAMAN_FEE_MARKETPLACE = [
  {
    label: 'Shopee: Pusat Edukasi Penjual (biaya admin dan layanan)',
    url: 'https://seller.shopee.co.id/edu/',
  },
  {
    label: 'Tokopedia/TikTok Shop: Pusat Edukasi Seller (biaya layanan)',
    url: 'https://seller-id.tokopedia.com/university',
  },
  {
    label: 'Lazada: Lazada University (biaya penjual)',
    url: 'https://university.lazada.co.id/',
  },
];
