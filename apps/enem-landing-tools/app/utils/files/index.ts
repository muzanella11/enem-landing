/** Shared helpers for the file tools (Story 23). Pure, no DOM access. */

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toLocaleString('id-ID', { maximumFractionDigits: 0 })} KB`;
  return `${(bytes / 1024 / 1024).toLocaleString('id-ID', { maximumFractionDigits: 1 })} MB`;
};

/**
 * "1-3, 5, 8-10" -> [[1,2,3],[5],[8,9,10]]. Pages are 1-based. Throws a
 * readable Indonesian message on bad input so the page can show it.
 */
export const parsePageRanges = (
  input: string,
  pageCount: number,
): number[][] => {
  const parts = input
    .split(/[,;]/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0)
    throw new Error('Isi halaman yang mau diambil, mis. 1-3, 5');

  return parts.map((part) => {
    const match = /^(\d+)\s*(?:-\s*(\d+))?$/.exec(part);
    if (!match) throw new Error(`"${part}" bukan format halaman yang valid`);
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : start;
    if (start < 1 || end < 1 || start > pageCount || end > pageCount) {
      throw new Error(`Halaman "${part}" di luar 1 sampai ${pageCount}`);
    }
    if (end < start) throw new Error(`Rentang "${part}" terbalik`);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  });
};

export const PAPER_SIZES_MM = {
  A4: { width: 210, height: 297 },
  F4: { width: 215, height: 330 },
} as const;
export type PaperSize = keyof typeof PAPER_SIZES_MM;

export const mmToPt = (mm: number): number => (mm / 25.4) * 72;

/** Pas foto presets in cm (width x height). */
export const PAS_FOTO_CM = {
  '2x3': { width: 2, height: 3 },
  '3x4': { width: 3, height: 4 },
  '4x6': { width: 4, height: 6 },
} as const;
export type PasFotoSize = keyof typeof PAS_FOTO_CM;

export const cmToPx = (cm: number, dpi = 300): number =>
  Math.round((cm / 2.54) * dpi);

export const pasFotoPixels = (size: PasFotoSize, dpi = 300) => ({
  width: cmToPx(PAS_FOTO_CM[size].width, dpi),
  height: cmToPx(PAS_FOTO_CM[size].height, dpi),
});

/** Largest centered crop of `source` with the aspect ratio of `target`. */
export const centerCrop = (
  source: { width: number; height: number },
  target: { width: number; height: number },
) => {
  const targetRatio = target.width / target.height;
  const sourceRatio = source.width / source.height;
  if (sourceRatio > targetRatio) {
    const width = Math.round(source.height * targetRatio);
    return {
      x: Math.round((source.width - width) / 2),
      y: 0,
      width,
      height: source.height,
    };
  }
  const height = Math.round(source.width / targetRatio);
  return {
    x: 0,
    y: Math.round((source.height - height) / 2),
    width: source.width,
    height,
  };
};

/** Fit inside a box, never upscaling. */
export const fitWithin = (
  source: { width: number; height: number },
  max: { width?: number; height?: number },
) => {
  const scale = Math.min(
    1,
    max.width ? max.width / source.width : 1,
    max.height ? max.height / source.height : 1,
  );
  return {
    width: Math.max(1, Math.round(source.width * scale)),
    height: Math.max(1, Math.round(source.height * scale)),
  };
};

export const isHeic = (file: { name: string; type: string }): boolean =>
  /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);

export const isPdf = (file: { name: string; type: string }): boolean =>
  file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

/**
 * Soft limit for one batch: about a quarter of the device memory the
 * browser reports (`navigator.deviceMemory`, in GB, capped at 8 by
 * browsers), or 400 MB when unknown. Exceeding it only shows a warning.
 */
export const softBatchLimitBytes = (deviceMemoryGb?: number): number =>
  deviceMemoryGb
    ? (deviceMemoryGb * 1024 * 1024 * 1024) / 4
    : 400 * 1024 * 1024;

export const replaceExtension = (name: string, extension: string): string =>
  `${name.replace(/\.[^.]+$/, '')}.${extension}`;
