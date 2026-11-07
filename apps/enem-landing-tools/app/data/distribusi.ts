/**
 * Distribution data (Story 49). Answer pages exist only for amounts people
 * commonly search; add more once Search Console shows demand for them.
 */
export const NOMINAL_GAJI = [
  3_000_000, 4_000_000, 5_000_000, 6_000_000, 7_000_000, 8_000_000, 10_000_000,
  12_000_000, 15_000_000, 20_000_000, 25_000_000,
] as const;

/** Tools that can be embedded on other sites. */
export const WIDGET = [
  {
    slug: 'kalkulator-gaji-bersih',
    label: 'Kalkulator gaji bersih',
    tinggi: 900,
  },
  { slug: 'kalkulator-thr', label: 'Kalkulator THR', tinggi: 900 },
  { slug: 'kalkulator-zakat', label: 'Kalkulator zakat', tinggi: 900 },
] as const;

export const labelJuta = (n: number) =>
  `${(n / 1_000_000).toLocaleString('id-ID')} juta`;
