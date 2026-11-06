/**
 * Background replacement helpers (Story 48). Pure functions over raw
 * pixel data so they are testable without a canvas or the model.
 */

/** Hex "#rrggbb" to [r, g, b]. */
export const hexKeRgb = (hex: string): [number, number, number] => {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex.trim());
  return m
    ? [parseInt(m[1]!, 16), parseInt(m[2]!, 16), parseInt(m[3]!, 16)]
    : [255, 255, 255];
};

/** Soft edge: confidence below `bawah` is background, above `atas` is person. */
export const alphaDariMask = (nilai: number, bawah = 0.35, atas = 0.65) => {
  const t = Math.min(1, Math.max(0, (nilai - bawah) / (atas - bawah)));
  return t * t * (3 - 2 * t);
};

/**
 * Composite the photo over a colour (or keep transparency when `latar` is
 * null). `mask` holds one confidence (0-255) per pixel.
 */
export const komposit = (
  foto: Uint8ClampedArray,
  mask: Uint8ClampedArray,
  latar: [number, number, number] | null,
): Uint8ClampedArray => {
  const out = new Uint8ClampedArray(foto.length);
  for (let i = 0, p = 0; i < foto.length; i += 4, p += 1) {
    const a = alphaDariMask(mask[p]! / 255) * (foto[i + 3]! / 255);
    if (!latar) {
      out[i] = foto[i]!;
      out[i + 1] = foto[i + 1]!;
      out[i + 2] = foto[i + 2]!;
      out[i + 3] = Math.round(a * 255);
    } else {
      out[i] = Math.round(foto[i]! * a + latar[0] * (1 - a));
      out[i + 1] = Math.round(foto[i + 1]! * a + latar[1] * (1 - a));
      out[i + 2] = Math.round(foto[i + 2]! * a + latar[2] * (1 - a));
      out[i + 3] = 255;
    }
  }
  return out;
};

/** Bounding box of the person (mask >= 50%); null when nobody is found. */
export const kotakOrang = (
  mask: Uint8ClampedArray,
  lebar: number,
  tinggi: number,
) => {
  let minX = lebar;
  let minY = tinggi;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < tinggi; y += 1)
    for (let x = 0; x < lebar; x += 1)
      if (mask[y * lebar + x]! >= 128) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
  if (maxX < 0) return null;
  // Head centre: mean x of the top quarter of the person (shoulders excluded).
  const batasKepala = minY + Math.max(1, Math.round((maxY - minY) * 0.25));
  let jumlah = 0;
  let total = 0;
  for (let y = minY; y <= batasKepala; y += 1)
    for (let x = minX; x <= maxX; x += 1)
      if (mask[y * lebar + x]! >= 128) {
        jumlah += x;
        total += 1;
      }
  return {
    minX,
    minY,
    maxX,
    maxY,
    tengahKepalaX: total ? jumlah / total : (minX + maxX) / 2,
  };
};

/**
 * Crop for a passport photo with aspect w:h: head top ~10% below the top
 * edge, the head centred, and as tall as the photo allows. Clamped to the
 * image.
 */
export const cropPasFoto = (
  orang: { minY: number; tengahKepalaX: number },
  lebarFoto: number,
  tinggiFoto: number,
  rasio: number,
) => {
  const ruangAtas = 0.1;
  let tinggi = Math.min(
    tinggiFoto,
    (tinggiFoto - orang.minY) / (1 - ruangAtas),
  );
  let lebar = tinggi * rasio;
  if (lebar > lebarFoto) {
    lebar = lebarFoto;
    tinggi = lebar / rasio;
  }
  const x = Math.min(
    lebarFoto - lebar,
    Math.max(0, orang.tengahKepalaX - lebar / 2),
  );
  const y = Math.min(
    tinggiFoto - tinggi,
    Math.max(0, orang.minY - tinggi * ruangAtas),
  );
  return {
    x: Math.round(x),
    y: Math.round(y),
    lebar: Math.round(lebar),
    tinggi: Math.round(tinggi),
  };
};

/** Photo paper sizes in cm. 4R is the common Indonesian print size (10,2 x 15,2 cm). */
export const KERTAS_CETAK = {
  '4R': { lebar: 10.2, tinggi: 15.2 },
  A4: { lebar: 21, tinggi: 29.7 },
} as const;
export type KertasCetak = keyof typeof KERTAS_CETAK;

/** Grid of identical photos on a sheet with a 0,3 cm gap and margin. */
export const tataLembar = (
  kertas: KertasCetak,
  foto: { lebar: number; tinggi: number },
  jarak = 0.3,
) => {
  const k = KERTAS_CETAK[kertas];
  const kolom = Math.max(
    0,
    Math.floor((k.lebar - jarak) / (foto.lebar + jarak) + 1e-9),
  );
  const baris = Math.max(
    0,
    Math.floor((k.tinggi - jarak) / (foto.tinggi + jarak) + 1e-9),
  );
  const posisi: { x: number; y: number }[] = [];
  for (let b = 0; b < baris; b += 1)
    for (let c = 0; c < kolom; c += 1)
      posisi.push({
        x: jarak + c * (foto.lebar + jarak),
        y: jarak + b * (foto.tinggi + jarak),
      });
  return { kolom, baris, posisi };
};
