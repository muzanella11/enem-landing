import { KOTA, type Kota } from '../../data/sholat/kota';

export const findKota = (slug: string): Kota | null =>
  KOTA.find((kota) => kota.slug === slug) ?? null;

/** Great-circle distance in km. */
export const jarakKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
};

/** Nearest city to a position (from the device, used only in the browser). */
export const kotaTerdekat = (lat: number, lon: number): Kota =>
  KOTA.reduce((best, kota) =>
    jarakKm(lat, lon, kota.lat, kota.lon) <
    jarakKm(lat, lon, best.lat, best.lon)
      ? kota
      : best,
  );

export const cariKota = (keyword: string, limit = 12): Kota[] => {
  const words = keyword.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return KOTA.filter((kota) => {
    const haystack = `${kota.nama} ${kota.provinsi}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  })
    .sort(
      (a, b) =>
        Number(b.nama.startsWith('Kota')) - Number(a.nama.startsWith('Kota')),
    )
    .slice(0, limit);
};
