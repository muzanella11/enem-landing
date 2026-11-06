/// <reference lib="webworker" />
import { degrees, PDFDocument } from 'pdf-lib';
import type { WorkerRequest, WorkerResponse } from '../utils/worker-client';
import { mmToPt, PAPER_SIZES_MM, type PaperSize } from '../utils/files';

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
