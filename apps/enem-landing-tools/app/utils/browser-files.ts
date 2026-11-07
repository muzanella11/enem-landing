import { isHeic, replaceExtension } from './files';

/** Browser-only file helpers (Story 23). Nothing here touches the network. */

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};

export const bytesToBlob = (bytes: Uint8Array, type: string): Blob =>
  new Blob([bytes as BlobPart], { type });

/** Bundles several outputs into one ZIP, built in the browser. */
export const zipFiles = async (
  files: { name: string; blob: Blob }[],
): Promise<Blob> => {
  const { zip } = await import('fflate');
  const entries: Record<string, Uint8Array> = {};
  const used = new Set<string>();
  for (const file of files) {
    let name = file.name;
    let counter = 2;
    while (used.has(name)) {
      name = file.name.replace(/(\.[^.]+)?$/, (ext) => ` (${counter++})${ext}`);
    }
    used.add(name);
    entries[name] = new Uint8Array(await file.blob.arrayBuffer());
  }
  return new Promise((resolve, reject) => {
    // Images and PDFs are already compressed; level 0 just stores them.
    zip(entries, { level: 0 }, (error, data) =>
      error
        ? reject(error)
        : resolve(new Blob([data as BlobPart], { type: 'application/zip' })),
    );
  });
};

/** Loads the HEIC decoder ahead of time so it also works after going offline. */
export const preloadHeicDecoder = (): void => {
  void import('heic2any').catch(() => undefined);
};

/**
 * HEIC/HEIF (iPhone photos) to JPEG. Most browsers can't decode HEIC with
 * their own codecs, so this uses heic2any (libheif in the browser) - only
 * loaded when a HEIC file is actually picked.
 */
export const normalizeImage = async (
  file: File,
): Promise<{ blob: Blob; name: string }> => {
  if (!isHeic(file)) return { blob: file, name: file.name };
  const { default: heic2any } = await import('heic2any');
  const converted = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.92,
  });
  const blob = Array.isArray(converted) ? converted[0]! : converted;
  return { blob, name: replaceExtension(file.name, 'jpg') };
};
