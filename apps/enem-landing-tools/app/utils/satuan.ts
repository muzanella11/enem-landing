import { KATEGORI, type Kategori } from '../data/satuan';

/** Unit conversion (Story 40). */
export const konversi = (
  nilai: number,
  dari: string,
  ke: string,
  kategoriId: Kategori['id'],
): number | null => {
  const kategori = KATEGORI.find((item) => item.id === kategoriId);
  const a = kategori?.satuan.find((item) => item.id === dari);
  const b = kategori?.satuan.find((item) => item.id === ke);
  if (!a || !b) return null;
  return (nilai * a.faktor) / b.faktor;
};

export type SatuanSuhu = 'C' | 'F' | 'K' | 'R';

/** Temperature is affine, so it has its own function. */
export const konversiSuhu = (
  nilai: number,
  dari: SatuanSuhu,
  ke: SatuanSuhu,
): number => {
  const celsius =
    dari === 'C'
      ? nilai
      : dari === 'F'
        ? ((nilai - 32) * 5) / 9
        : dari === 'K'
          ? nilai - 273.15
          : (nilai * 5) / 4;
  if (ke === 'C') return celsius;
  if (ke === 'F') return (celsius * 9) / 5 + 32;
  if (ke === 'K') return celsius + 273.15;
  return (celsius * 4) / 5;
};

/** Area of a rectangle or a trapezoid (parallel sides a, b and height t), in m². */
export const luasPersegiPanjang = (panjang: number, lebar: number) =>
  Math.max(0, panjang) * Math.max(0, lebar);
export const luasTrapesium = (a: number, b: number, tinggi: number) =>
  ((Math.max(0, a) + Math.max(0, b)) / 2) * Math.max(0, tinggi);

/** Rounds to a sensible number of significant digits for display. */
export const bulatkan = (value: number): string =>
  Number.isFinite(value)
    ? Number(value.toPrecision(8)).toLocaleString('id-ID', {
        maximumFractionDigits: 6,
      })
    : '-';
