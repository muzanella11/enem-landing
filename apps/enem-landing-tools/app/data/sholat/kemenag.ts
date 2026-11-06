/**
 * Prayer time parameters following Kemenag RI (Story 36). Tuned and
 * verified against Kemenag-sourced schedules for 6 cities in WIB, WITA,
 * and WIT (see utils/sholat/sholat.spec.ts): every time within 2 minutes.
 */
export const KEMENAG_PARAMS = {
  checkedAt: '2026-11-06',
  fajrAngle: 20,
  ishaAngle: 18,
  /** Ihtiyat (safety margin) in minutes per time; Dzuhur carries one extra minute in Kemenag's tables. */
  ihtiyat: { fajr: 2, sunrise: -3, dhuhr: 3, asr: 2, maghrib: 2, isha: 2 },
  imsakBeforeFajrMinutes: 10,
  dhuhaAfterSunriseMinutes: 15,
  /** Horizon dip in degrees = 0.0293 x sqrt(elevation in meters), applied to sunrise and maghrib. */
  dipPerSqrtMeter: 0.0293,
  sources: [
    {
      label: 'Kemenag RI (Bimas Islam): jadwal sholat',
      url: 'https://bimasislam.kemenag.go.id/jadwalshalat',
    },
    {
      label: 'Koordinat kabupaten/kota: Wikidata (CC0)',
      url: 'https://www.wikidata.org/',
    },
  ],
} as const;
