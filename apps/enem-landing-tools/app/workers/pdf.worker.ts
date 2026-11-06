/// <reference lib="webworker" />
import {
  degrees,
  PDFDocument,
  PDFName,
  rgb,
  StandardFonts,
  type PDFPage,
} from 'pdf-lib';
import type { WorkerRequest, WorkerResponse } from '../utils/worker-client';
import { mmToPt, PAPER_SIZES_MM, type PaperSize } from '../utils/files';
import {
  normalizeRotation,
  placeRect,
  placeText,
  type FractionRect,
  type PageBox,
} from '../utils/files/pdf-placement';

/**
 * PDF operations for the file tools (Story 23), run off the main thread.
 * Everything stays in this browser tab - no network access here at all.
 */
declare const self: DedicatedWorkerGlobalScope;

const load = async (bytes: ArrayBuffer) => {
  try {
    return await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (error) {
    const message = String(error);
    if (/encrypt/i.test(message)) {
      throw new Error(
        'PDF ini terkunci kata sandi. Buka kuncinya dulu, lalu coba lagi.',
        { cause: error },
      );
    }
    throw new Error('File ini tidak bisa dibaca sebagai PDF.', {
      cause: error,
    });
  }
};

const save = async (doc: PDFDocument) => {
  doc.setProducer('tools.muzanella.com');
  doc.setCreator('tools.muzanella.com');
  return doc.save();
};

const boxOf = (page: PDFPage): PageBox => {
  const crop = page.getCropBox();
  return { ...crop, rotation: normalizeRotation(page.getRotation().angle) };
};

/** Standard fonts only cover WinAnsi; anything else becomes "?". */
const winAnsi = (text: string) =>
  text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7e\xa0-\xff]/g, '?');

const embedImage = (
  doc: PDFDocument,
  image: { bytes: ArrayBuffer; kind: 'jpg' | 'png' },
) =>
  image.kind === 'png' ? doc.embedPng(image.bytes) : doc.embedJpg(image.bytes);

export interface WatermarkOptions {
  pages: number[];
  text?: string;
  image?: { bytes: ArrayBuffer; kind: 'jpg' | 'png'; widthFraction: number };
  /** Font size relative to the displayed page width (0..1). */
  sizeFraction: number;
  opacity: number;
  angle: number;
  /** Vertical center as a fraction from the top of the displayed page. */
  cy: number;
  color: [number, number, number];
}

export interface StampPlacement {
  page: number;
  rect: FractionRect;
}

const ops = {
  async info({ bytes }: { bytes: ArrayBuffer }) {
    const doc = await load(bytes);
    return { pageCount: doc.getPageCount() };
  },

  async merge({ files }: { files: ArrayBuffer[] }) {
    const output = await PDFDocument.create();
    for (const bytes of files) {
      const source = await load(bytes);
      const pages = await output.copyPages(source, source.getPageIndices());
      for (const page of pages) output.addPage(page);
    }
    return save(output);
  },

  /** One output PDF per group of 1-based page numbers. */
  async extract({ bytes, groups }: { bytes: ArrayBuffer; groups: number[][] }) {
    const source = await load(bytes);
    const results: Uint8Array[] = [];
    for (const group of groups) {
      const output = await PDFDocument.create();
      const pages = await output.copyPages(
        source,
        group.map((page) => page - 1),
      );
      for (const page of pages) output.addPage(page);
      results.push(await save(output));
    }
    return results;
  },

  /** New order (0-based source indices) with extra rotation per page; omitted pages are deleted. */
  async arrange({
    bytes,
    pages,
  }: {
    bytes: ArrayBuffer;
    pages: { index: number; rotation: number }[];
  }) {
    const source = await load(bytes);
    const output = await PDFDocument.create();
    const copied = await output.copyPages(
      source,
      pages.map((page) => page.index),
    );
    copied.forEach((page, position) => {
      const extra = pages[position]?.rotation ?? 0;
      page.setRotation(degrees((page.getRotation().angle + extra) % 360));
      output.addPage(page);
    });
    return save(output);
  },

  /** Re-save with object streams and without document metadata (text stays selectable). */
  async compressLight({ bytes }: { bytes: ArrayBuffer }) {
    const doc = await load(bytes);
    doc.catalog.delete(PDFName.of('Metadata'));
    doc.catalog.delete(PDFName.of('PieceInfo'));
    for (const page of doc.getPages()) {
      page.node.delete(PDFName.of('PieceInfo'));
      page.node.delete(PDFName.of('Thumb'));
    }
    doc.setTitle('');
    doc.setAuthor('');
    doc.setSubject('');
    doc.setKeywords([]);
    doc.setProducer('tools.muzanella.com');
    doc.setCreator('tools.muzanella.com');
    return doc.save({ useObjectStreams: true });
  },

  /** Pages rendered as JPEG on the main thread, one image per page at its displayed size. */
  async rasterToPdf({
    images,
  }: {
    images: { bytes: ArrayBuffer; widthPt: number; heightPt: number }[];
  }) {
    const output = await PDFDocument.create();
    for (const image of images) {
      const embedded = await output.embedJpg(image.bytes);
      const page = output.addPage([image.widthPt, image.heightPt]);
      page.drawImage(embedded, {
        x: 0,
        y: 0,
        width: image.widthPt,
        height: image.heightPt,
      });
    }
    return save(output);
  },

  async watermark({
    bytes,
    options,
  }: {
    bytes: ArrayBuffer;
    options: WatermarkOptions;
  }) {
    const doc = await load(bytes);
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const image = options.image ? await embedImage(doc, options.image) : null;
    const text = options.text ? winAnsi(options.text) : '';
    const pages = doc.getPages();
    for (const index of options.pages) {
      const page = pages[index];
      if (!page) continue;
      const box = boxOf(page);
      const shownWidth = box.rotation % 180 === 0 ? box.width : box.height;
      const shownHeight = box.rotation % 180 === 0 ? box.height : box.width;
      if (image && options.image) {
        const w = options.image.widthFraction;
        const h = (w * shownWidth * (image.height / image.width)) / shownHeight;
        // Rotation around the center is not supported for images; keep them upright.
        const placed = placeRect(box, {
          x: (1 - w) / 2,
          y: options.cy - h / 2,
          w,
          h,
        });
        page.drawImage(image, {
          ...placed,
          rotate: degrees(placed.rotate),
          opacity: options.opacity,
        });
      } else if (text) {
        const size = options.sizeFraction * shownWidth;
        const width = font.widthOfTextAtSize(text, size);
        const height = font.heightAtSize(size, { descender: false });
        const placed = placeText(
          box,
          0.5,
          options.cy,
          width,
          height,
          options.angle,
        );
        page.drawText(text, {
          x: placed.x,
          y: placed.y,
          size,
          font,
          rotate: degrees(placed.rotate),
          opacity: options.opacity,
          color: rgb(...options.color),
        });
      }
    }
    return save(doc);
  },

  /** Signature images (PNG with transparency) at positions picked on the preview. */
  async stamp({
    bytes,
    image,
    placements,
  }: {
    bytes: ArrayBuffer;
    image: ArrayBuffer;
    placements: StampPlacement[];
  }) {
    const doc = await load(bytes);
    const embedded = await doc.embedPng(image);
    const pages = doc.getPages();
    for (const placement of placements) {
      const page = pages[placement.page];
      if (!page) continue;
      const placed = placeRect(boxOf(page), placement.rect);
      page.drawImage(embedded, { ...placed, rotate: degrees(placed.rotate) });
    }
    return save(doc);
  },

  /** Images (already JPEG or PNG bytes) centered on A4/F4 pages, orientation following each image. */
  async imagesToPdf({
    images,
    paper,
    marginMm,
  }: {
    images: { bytes: ArrayBuffer; kind: 'jpg' | 'png' }[];
    paper: PaperSize;
    marginMm: number;
  }) {
    const output = await PDFDocument.create();
    const size = PAPER_SIZES_MM[paper];
    const margin = mmToPt(marginMm);
    for (const image of images) {
      const embedded =
        image.kind === 'png'
          ? await output.embedPng(image.bytes)
          : await output.embedJpg(image.bytes);
      const landscape = embedded.width > embedded.height;
      const pageWidth = mmToPt(landscape ? size.height : size.width);
      const pageHeight = mmToPt(landscape ? size.width : size.height);
      const page = output.addPage([pageWidth, pageHeight]);
      const scale = Math.min(
        (pageWidth - 2 * margin) / embedded.width,
        (pageHeight - 2 * margin) / embedded.height,
      );
      const width = embedded.width * scale;
      const height = embedded.height * scale;
      page.drawImage(embedded, {
        x: (pageWidth - width) / 2,
        y: (pageHeight - height) / 2,
        width,
        height,
      });
    }
    return save(output);
  },
};

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, op, payload } = event.data;
  try {
    const handler = ops[op as keyof typeof ops] as (
      payload: unknown,
    ) => Promise<unknown>;
    if (!handler) throw new Error(`Operasi tidak dikenal: ${op}`);
    const result = await handler(payload);
    const transfer: Transferable[] = [];
    if (result instanceof Uint8Array) transfer.push(result.buffer);
    if (Array.isArray(result)) {
      for (const item of result)
        if (item instanceof Uint8Array) transfer.push(item.buffer);
    }
    self.postMessage(
      { id, ok: true, result } satisfies WorkerResponse,
      transfer,
    );
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    } satisfies WorkerResponse);
  }
};
