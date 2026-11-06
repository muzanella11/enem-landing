/**
 * Maps positions picked on a page preview (Story 32) to PDF user space.
 * The preview shows the page as displayed, i.e. after its /Rotate. pdf-lib
 * draws in the unrotated space, so overlays are rotated by the same angle
 * to appear upright in the result.
 */
export interface PageBox {
  /** Crop box origin and size in user space (points). */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Page /Rotate, normalized to 0, 90, 180, or 270. */
  rotation: number;
}

/** Overlay rectangle as fractions (0..1) of the displayed page, top-left origin. */
export interface FractionRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const normalizeRotation = (angle: number) =>
  (((Math.round(angle / 90) * 90) % 360) + 360) % 360;

export const displaySize = (box: PageBox) =>
  box.rotation % 180 === 0
    ? { width: box.width, height: box.height }
    : { width: box.height, height: box.width };

/** Displayed point (points, top-left origin) to user space. */
export const displayToUser = (box: PageBox, dx: number, dy: number) => {
  const { width: W, height: H } = box;
  let ux: number;
  let uy: number;
  switch (box.rotation) {
    case 90:
      ux = dy;
      uy = dx;
      break;
    case 180:
      ux = W - dx;
      uy = dy;
      break;
    case 270:
      ux = W - dy;
      uy = H - dx;
      break;
    default:
      ux = dx;
      uy = H - dy;
  }
  return { x: box.x + ux, y: box.y + uy };
};

/** pdf-lib drawImage options for a rectangle chosen on the preview. */
export const placeRect = (box: PageBox, rect: FractionRect) => {
  const shown = displaySize(box);
  const width = rect.w * shown.width;
  const height = rect.h * shown.height;
  // The image's own bottom-left corner, as displayed.
  const anchor = displayToUser(
    box,
    rect.x * shown.width,
    (rect.y + rect.h) * shown.height,
  );
  return { ...anchor, width, height, rotate: box.rotation };
};

/**
 * Text centered on (cx, cy) - fractions of the displayed page - turned by
 * `angle` degrees counter-clockwise as displayed.
 */
export const placeText = (
  box: PageBox,
  cx: number,
  cy: number,
  textWidth: number,
  textHeight: number,
  angle: number,
) => {
  const shown = displaySize(box);
  const rad = (angle * Math.PI) / 180;
  // Work in displayed space with y up, then convert back.
  const ex =
    cx * shown.width -
    ((textWidth / 2) * Math.cos(rad) - (textHeight / 2) * Math.sin(rad));
  const ey =
    (1 - cy) * shown.height -
    ((textWidth / 2) * Math.sin(rad) + (textHeight / 2) * Math.cos(rad));
  const point = displayToUser(box, ex, shown.height - ey);
  return { ...point, rotate: (box.rotation + angle + 360) % 360 };
};

/** Pages chosen as "semua" or a range string, 0-based and de-duplicated. */
export const pilihHalaman = (
  ranges: number[][] | 'semua',
  pageCount: number,
): number[] =>
  ranges === 'semua'
    ? Array.from({ length: pageCount }, (_, index) => index)
    : [...new Set(ranges.flat().map((page) => page - 1))].sort((a, b) => a - b);

/** Rendering steps tried, best first, when compressing to a target size. */
export const LANGKAH_KOMPRES = [
  { dpi: 150, quality: 0.75 },
  { dpi: 130, quality: 0.65 },
  { dpi: 110, quality: 0.55 },
  { dpi: 96, quality: 0.5 },
  { dpi: 80, quality: 0.45 },
  { dpi: 72, quality: 0.35 },
] as const;
