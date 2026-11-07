/**
 * Signature image cleanup (Story 32): light paper becomes transparent and
 * the image is cropped to the ink. Works on raw RGBA so it is testable
 * without a canvas.
 */
export const transparentize = (
  rgba: Uint8ClampedArray,
  threshold = 200,
): Uint8ClampedArray => {
  const out = new Uint8ClampedArray(rgba);
  for (let i = 0; i < out.length; i += 4) {
    const luminance =
      0.2126 * out[i]! + 0.7152 * out[i + 1]! + 0.0722 * out[i + 2]!;
    if (luminance >= threshold) out[i + 3] = 0;
    else if (luminance > threshold - 60) {
      // Soft edge so strokes don't look jagged.
      out[i + 3] = Math.round((out[i + 3]! * (threshold - luminance)) / 60);
    }
  }
  return out;
};

/** Smallest box holding every visible pixel, with padding; null when empty. */
export const inkBounds = (
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  padding = 4,
): { x: number; y: number; width: number; height: number } | null => {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (rgba[(y * width + x) * 4 + 3]! > 16) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  const x = Math.max(0, minX - padding);
  const y = Math.max(0, minY - padding);
  return {
    x,
    y,
    width: Math.min(width, maxX + padding + 1) - x,
    height: Math.min(height, maxY + padding + 1) - y,
  };
};

/** Clean a drawn or photographed signature into a cropped transparent PNG. */
export const bersihkanTandaTangan = async (
  source: CanvasImageSource & { width: number; height: number },
  threshold = 200,
): Promise<{ blob: Blob; width: number; height: number }> => {
  const canvas = document.createElement('canvas');
  // Photos are large; signatures don't need more than ~1200px.
  const scale = Math.min(1, 1200 / Math.max(source.width, source.height));
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  const data = context.getImageData(0, 0, canvas.width, canvas.height);
  const clean = transparentize(data.data, threshold);
  const bounds = inkBounds(clean, canvas.width, canvas.height);
  if (!bounds) throw new Error('Tanda tangan kosong atau terlalu terang.');
  data.data.set(clean);
  context.putImageData(data, 0, 0);
  const cropped = document.createElement('canvas');
  cropped.width = bounds.width;
  cropped.height = bounds.height;
  cropped
    .getContext('2d')!
    .drawImage(
      canvas,
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
      0,
      0,
      bounds.width,
      bounds.height,
    );
  const blob = await new Promise<Blob | null>((resolve) =>
    cropped.toBlob(resolve, 'image/png'),
  );
  if (!blob) throw new Error('Browser gagal membuat gambar tanda tangan.');
  return { blob, width: bounds.width, height: bounds.height };
};
