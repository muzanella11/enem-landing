/**
 * Page thumbnails with pdf.js (Story 23). Loaded only by the page that
 * needs thumbnails, so pdf.js never lands in other tools' bundles.
 */
export const renderPdfThumbnails = async (
  bytes: ArrayBuffer,
  maxWidth = 180,
  /** Render only the first N pages (e.g. 1 for a single preview). */
  limit = Infinity,
): Promise<{ url: string; rotation: number }[]> => {
  const pdfjs = await import('pdfjs-dist');
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url'))
    .default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  // pdf.js 6 destroys through the loading task (the document proxy has no destroy()).
  const task = pdfjs.getDocument({
    data: new Uint8Array(bytes),
    isEvalSupported: false,
  });
  const doc = await task.promise;
  const thumbnails: { url: string; rotation: number }[] = [];
  for (let number = 1; number <= Math.min(doc.numPages, limit); number += 1) {
    const page = await doc.getPage(number);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: maxWidth / base.width });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, viewport }).promise;
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.7),
    );
    thumbnails.push({
      url: blob ? URL.createObjectURL(blob) : '',
      rotation: page.rotate,
    });
    page.cleanup();
  }
  await task.destroy();
  return thumbnails;
};

export interface RenderedPage {
  /** 0-based page index. */
  index: number;
  blob: Blob;
  /** Displayed page size in points (after /Rotate). */
  widthPt: number;
  heightPt: number;
  widthPx: number;
  heightPx: number;
}

/**
 * Full-resolution page images for PDF to JPG and strong compression
 * (Story 32). One page at a time so memory stays flat on phones.
 */
export const renderPdfPages = async (
  bytes: ArrayBuffer,
  options: {
    pages?: number[];
    dpi: number;
    type: 'image/jpeg' | 'image/png';
    quality?: number;
    onProgress?: (done: number, total: number) => void;
  },
): Promise<RenderedPage[]> => {
  const pdfjs = await import('pdfjs-dist');
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url'))
    .default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  // pdf.js 6 destroys through the loading task (the document proxy has no destroy()).
  const task = pdfjs.getDocument({
    data: new Uint8Array(bytes),
    isEvalSupported: false,
  });
  const doc = await task.promise;
  const indices =
    options.pages ?? Array.from({ length: doc.numPages }, (_, index) => index);
  const results: RenderedPage[] = [];
  for (const index of indices) {
    const page = await doc.getPage(index + 1);
    const base = page.getViewport({ scale: 1 });
    // Browsers cap canvas area (iOS around 16.7 megapixels).
    const maxScale = Math.sqrt(16_000_000 / (base.width * base.height));
    const viewport = page.getViewport({
      scale: Math.min(options.dpi / 72, maxScale),
    });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    // JPEG has no transparency, so the page background is painted white.
    await page.render({ canvas, viewport, background: '#ffffff' }).promise;
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, options.type, options.quality ?? 0.85),
    );
    if (!blob) throw new Error('Browser gagal membuat gambar halaman.');
    results.push({
      index,
      blob,
      widthPt: base.width,
      heightPt: base.height,
      widthPx: canvas.width,
      heightPx: canvas.height,
    });
    canvas.width = 0;
    canvas.height = 0;
    page.cleanup();
    options.onProgress?.(results.length, indices.length);
  }
  await task.destroy();
  return results;
};
