/**
 * Gold pawn and gold installment terms (Story 53), from Pegadaian's own
 * site: the article "Sistem Pembayaran di Pegadaian" (26 Jul 2026) and the
 * official Customer Care replies under it. Pegadaian publishes ranges, not
 * a full tariff table, so every rate is editable. Checked 2026-11-06.
 */
export const CHECKED_AT = '2026-11-06';

export const KCA = {
  /** Gadai emas 120 hari: sewa modal per 15-day period. */
  sewaModalPer15HariMin: 1,
  sewaModalPer15HariMaks: 1.2,
  hariPerPeriode: 15,
  tenorHari: 120,
  rasioTaksirMin: 92,
  rasioTaksirMaks: 95,
  /** Admin fee: Rp2.000 for Rp50.000-Rp500.000 loans, Rp125.000 above Rp20 juta. */
  adminTerkecil: 2_000,
  adminTerbesar: 125_000,
};

export const KRASIDA = {
  /** Gadai Emas Angsuran: fixed monthly rate, equal instalments. */
  sewaModalPerBulanMin: 1.25,
  sewaModalPerBulanMaks: 1.4,
  rasioTaksir: 95,
  tenor: [6, 12, 18, 24, 36],
  pinjamanMin: 1_000_000,
  pinjamanMaks: 250_000_000,
};

export const SUMBER_GADAI = [
  {
    label:
      'Pegadaian: Sistem Pembayaran di Pegadaian (KCA, Krasida) dan jawaban Customer Care Pegadaian di halaman yang sama',
    url: 'https://pegadaian.co.id/artikel/keuangan/sistem-pembayaran-dan-bunga-di-pegadaian',
  },
];
