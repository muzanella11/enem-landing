/// <reference lib="webworker" />
import type { WorkerRequest, WorkerResponse } from '../utils/worker-client';
import { centerCrop, fitWithin } from '../utils/files';

/**
 * Image decode/resize/re-encode for the file tools (Story 23), using the
 * browser's own codecs through OffscreenCanvas. Re-encoding through a
 * canvas drops all metadata, including EXIF GPS location.
 */
declare const self: DedicatedWorkerGlobalScope;

export type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export interface ProcessOptions {
  format: OutputFormat;
  /** 0-1, ignored for PNG. */
  quality?: number;
  /** Fit within this box (keeps aspect ratio, never upscales). */
  maxWidth?: number;
  maxHeight?: number;
  /** Scale factor, e.g. 0.5 for 50%. */
  scale?: number;
  /** Center-crop to this exact size (pas foto). */
  exact?: { width: number; height: number };
  /** Try to end up at or below this many bytes. */
  targetBytes?: number;
}

export interface ProcessResult {
  blob: Blob;
  width: number;
  height: number;
  quality: number | null;
  reachedTarget: boolean;
}

const render = async (
  bitmap: ImageBitmap,
  width: number,
  height: number,
  crop: { x: number; y: number; width: number; height: number } | null,
  format: OutputFormat,
  quality: number,
): Promise<Blob> => {
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext('2d');
  if (!context)
    throw new Error('Browser ini tidak mendukung pemrosesan gambar.');
  if (format === 'image/jpeg') {
    // JPEG has no transparency: paint white instead of black behind it.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
  }
  context.imageSmoothingQuality = 'high';
  if (crop) {
    context.drawImage(
      bitmap,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      width,
      height,
    );
  } else {
    context.drawImage(bitmap, 0, 0, width, height);
  }
  return canvas.convertToBlob({
    type: format,
    quality: format === 'image/png' ? undefined : quality,
  });
};

const process = async ({
  blob,
  options,
}: {
  blob: Blob;
  options: ProcessOptions;
}): Promise<ProcessResult> => {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('Format gambar ini tidak bisa dibaca oleh browsermu.');
  }

  const source = { width: bitmap.width, height: bitmap.height };
  let crop: { x: number; y: number; width: number; height: number } | null =
    null;
  let size: { width: number; height: number };
  if (options.exact) {
    crop = centerCrop(source, options.exact);
    size = { ...options.exact };
  } else if (options.scale) {
    size = {
      width: Math.max(1, Math.round(source.width * options.scale)),
      height: Math.max(1, Math.round(source.height * options.scale)),
    };
  } else {
    size = fitWithin(source, {
      width: options.maxWidth,
      height: options.maxHeight,
    });
  }

  const lossy = options.format !== 'image/png';
  let quality = options.quality ?? 0.82;

  if (!options.targetBytes) {
    const output = await render(
      bitmap,
      size.width,
      size.height,
      crop,
      options.format,
      quality,
    );
    bitmap.close();
    return {
      blob: output,
      ...size,
      quality: lossy ? quality : null,
      reachedTarget: true,
    };
  }

  // Target size: binary-search the quality, then shrink dimensions if even
  // the lowest acceptable quality is still too large.
  let best: Blob | null = null;
  let bestSize = { ...size };
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (lossy) {
      let low = 0.3;
      let high = Math.min(0.95, options.quality ?? 0.92);
      let found: Blob | null = null;
      for (let step = 0; step < 7; step += 1) {
        const mid = (low + high) / 2;
        const candidate = await render(
          bitmap,
          size.width,
          size.height,
          crop,
          options.format,
          mid,
        );
        if (candidate.size <= options.targetBytes) {
          found = candidate;
          quality = mid;
          low = mid;
        } else {
          high = mid;
        }
      }
      if (found) {
        bitmap.close();
        return { blob: found, ...size, quality, reachedTarget: true };
      }
      best = await render(
        bitmap,
        size.width,
        size.height,
        crop,
        options.format,
        0.3,
      );
      quality = 0.3;
    } else {
      best = await render(
        bitmap,
        size.width,
        size.height,
        crop,
        options.format,
        1,
      );
      if (best.size <= options.targetBytes) {
        bitmap.close();
        return { blob: best, ...size, quality: null, reachedTarget: true };
      }
    }
    bestSize = { ...size };
    size = {
      width: Math.max(1, Math.round(size.width * 0.8)),
      height: Math.max(1, Math.round(size.height * 0.8)),
    };
  }
  bitmap.close();
  return {
    blob: best as Blob,
    ...bestSize,
    quality: lossy ? quality : null,
    reachedTarget: (best?.size ?? Infinity) <= options.targetBytes,
  };
};

self.onmessage = async (
  event: MessageEvent<WorkerRequest<{ blob: Blob; options: ProcessOptions }>>,
) => {
  const { id, op, payload } = event.data;
  try {
    if (op !== 'process') throw new Error(`Operasi tidak dikenal: ${op}`);
    const result = await process(payload);
    self.postMessage({
      id,
      ok: true,
      result,
    } satisfies WorkerResponse<ProcessResult>);
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    } satisfies WorkerResponse);
  }
};
