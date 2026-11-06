/**
 * Page thumbnails with pdf.js (Story 23). Loaded only by the page that
 * needs thumbnails, so pdf.js never lands in other tools' bundles.
 */
export const renderPdfThumbnails = async (
  bytes: ArrayBuffer,
  maxWidth = 180,
): Promise<{ url: string; rotation: number }[]> => {
  const pdfjs = await import('pdfjs-dist');
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url'))
    .default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const doc = await pdfjs.getDocument({
    data: new Uint8Array(bytes),
    isEvalSupported: false,
  }).promise;
  const thumbnails: { url: string; rotation: number }[] = [];
  for (let number = 1; number <= doc.numPages; number += 1) {
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
  await doc.destroy();
  return thumbnails;
};
