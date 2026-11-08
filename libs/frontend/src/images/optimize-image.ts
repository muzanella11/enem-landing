/**
 * Browser-side image shrinking before a CMS upload (Pingdom flagged the
 * homepage at 32 MB, almost all of it full-size portfolio PNGs of up to
 * 4.3 MB shown as 208px-high cards). Resizes to `maxWidth` and re-encodes
 * as WebP, but only keeps the result when it is actually smaller.
 */

export interface OptimizeImageOptions {
  /** Widest the stored image may be, in px. */
  maxWidth?: number;
  /** WebP quality, 0-1. */
  quality?: number;
}

const DEFAULT_MAX_WIDTH = 1600;
const DEFAULT_QUALITY = 0.82;
/** GIFs may be animated and SVGs are already tiny vectors: left as is. */
const OPTIMIZABLE = /^image\/(jpeg|png|webp)$/;

/** Scales `width` x `height` down (never up) to fit `maxWidth`. */
export const fitWithin = (
  width: number,
  height: number,
  maxWidth: number,
): { width: number; height: number } => {
  if (width <= maxWidth) return { width, height };
  return {
    width: maxWidth,
    height: Math.max(1, Math.round((height * maxWidth) / width)),
  };
};

/** `photo.PNG` -> `photo.webp` */
export const toWebpName = (name: string): string =>
  `${name.replace(/\.[^./]+$/, '') || 'image'}.webp`;

/**
 * Returns a smaller WebP version of `file`, or `file` itself when it can't
 * be optimized (GIF/SVG, no canvas support, a browser that can't encode
 * WebP, decoding errors, or a result that isn't smaller).
 */
export const optimizeImageForUpload = async (
  file: File,
  options: OptimizeImageOptions = {},
): Promise<File> => {
  const maxWidth = options.maxWidth ?? DEFAULT_MAX_WIDTH;
  const quality = options.quality ?? DEFAULT_QUALITY;
  if (
    !OPTIMIZABLE.test(file.type) ||
    typeof createImageBitmap !== 'function' ||
    typeof document === 'undefined'
  ) {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const size = fitWithin(bitmap.width, bitmap.height, maxWidth);
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, size.width, size.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', quality),
    );
    // Safari falls back to PNG instead of encoding WebP: keep the original.
    if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) {
      return file;
    }
    return new File([blob], toWebpName(file.name), { type: 'image/webp' });
  } catch {
    return file;
  }
};
