import type { PDFFont, PDFPage } from 'pdf-lib';
import { mmToPt, PAPER_SIZES_MM, type PaperSize } from '../files';
import { toWinAnsi, wrapText } from '../invoice/pdf';
import type { SuratJadi } from './index';

/**
 * Letter PDF (Story 33) drawn with pdf-lib so it looks the same in every
 * browser and PDF reader. Times 12 pt, 2.5 cm margins, automatic page breaks.
 */
const SIZE = 12;
const LINE = SIZE * 1.45;
const MARGIN = mmToPt(25);

export const renderSuratPdf = async (
  surat: SuratJadi,
  paper: PaperSize,
): Promise<Uint8Array> => {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const doc = await PDFDocument.create();
  doc.setProducer('tools.muzanella.com');
  doc.setCreator('tools.muzanella.com');
  const regular = await doc.embedFont(StandardFonts.TimesRoman);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const width = mmToPt(PAPER_SIZES_MM[paper].width);
  const height = mmToPt(PAPER_SIZES_MM[paper].height);
  const contentWidth = width - 2 * MARGIN;
  const black = rgb(0, 0, 0);

  let page: PDFPage = doc.addPage([width, height]);
  let y = height - MARGIN;
  const ensure = (needed: number) => {
    if (y - needed < MARGIN) {
      page = doc.addPage([width, height]);
      y = height - MARGIN;
    }
  };
  const text = (value: string, x: number, font: PDFFont = regular) =>
    page.drawText(toWinAnsi(value), {
      x,
      y: y - SIZE,
      size: SIZE,
      font,
      color: black,
    });
  const line = (value: string, x = MARGIN, font: PDFFont = regular) => {
    ensure(LINE);
    text(value, x, font);
    y -= LINE;
  };
  const gap = (amount = LINE * 0.6) => (y -= amount);

  /** Justified paragraph; the last line stays left-aligned. */
  const paragraph = (value: string, x = MARGIN, maxWidth = contentWidth) => {
    const lines = wrapText(value, regular, SIZE, maxWidth);
    lines.forEach((current, index) => {
      ensure(LINE);
      const words = current.split(' ');
      const last = index === lines.length - 1;
      if (last || words.length < 2) text(current, x);
      else {
        const used = words.reduce(
          (sum, word) => sum + regular.widthOfTextAtSize(word, SIZE),
          0,
        );
        const space = (maxWidth - used) / (words.length - 1);
        let cursor = x;
        for (const word of words) {
          text(word, cursor);
          cursor += regular.widthOfTextAtSize(word, SIZE) + space;
        }
      }
      y -= LINE;
    });
  };
  const rightAligned = (value: string, font: PDFFont = regular) => {
    const safe = toWinAnsi(value);
    line(safe, width - MARGIN - font.widthOfTextAtSize(safe, SIZE), font);
  };

  if (surat.tanggalDi === 'atas') {
    rightAligned(surat.tempatTanggal);
    gap();
  }
  if (surat.kepada.length) {
    for (const item of surat.kepada) paragraph(item);
    gap();
  }
  if (surat.perihal) {
    const label = 'Perihal : ';
    ensure(LINE);
    text(label, MARGIN);
    const indent = regular.widthOfTextAtSize(label, SIZE);
    const lines = wrapText(surat.perihal, bold, SIZE, contentWidth - indent);
    lines.forEach((current) => {
      ensure(LINE);
      text(current, MARGIN + indent, bold);
      y -= LINE;
    });
    gap();
  }
  if (surat.judul) {
    const safe = toWinAnsi(surat.judul);
    const titleWidth = bold.widthOfTextAtSize(safe, SIZE + 2);
    ensure(LINE * 2);
    const x = (width - titleWidth) / 2;
    page.drawText(safe, {
      x,
      y: y - SIZE - 2,
      size: SIZE + 2,
      font: bold,
      color: black,
    });
    page.drawLine({
      start: { x, y: y - SIZE - 4 },
      end: { x: x + titleWidth, y: y - SIZE - 4 },
      thickness: 0.8,
      color: black,
    });
    y -= LINE * 2;
  }

  for (const blok of surat.blok) {
    if (blok.jenis === 'p') {
      if (blok.rataTengah) {
        const safe = toWinAnsi(blok.teks);
        line(safe, (width - regular.widthOfTextAtSize(safe, SIZE)) / 2);
      } else paragraph(blok.teks);
    } else if (blok.jenis === 'tabel') {
      const indent = MARGIN + 24;
      const labelWidth =
        Math.max(
          ...blok.baris.map(([label]) =>
            regular.widthOfTextAtSize(toWinAnsi(label), SIZE),
          ),
        ) + 8;
      const colon = regular.widthOfTextAtSize(': ', SIZE);
      for (const [label, value] of blok.baris) {
        const lines = wrapText(
          value,
          regular,
          SIZE,
          contentWidth - 24 - labelWidth - colon,
        );
        ensure(LINE);
        text(label, indent);
        text(':', indent + labelWidth);
        lines.forEach((current) => {
          ensure(LINE);
          text(current, indent + labelWidth + colon);
          y -= LINE;
        });
      }
    } else {
      blok.item.forEach((item, index) => {
        const number = `${index + 1}.`;
        ensure(LINE);
        text(number, MARGIN + 24);
        paragraph(item, MARGIN + 44, contentWidth - 44);
      });
    }
    gap();
  }

  // Signatures: one signer on the right, two side by side.
  const columns =
    surat.ttd.length > 1 ? [MARGIN, width / 2 + 20] : [width / 2 + 40];
  const columnWidth = width - MARGIN - columns[columns.length - 1]!;
  ensure(LINE * 7);
  if (surat.tanggalDi === 'ttd') {
    text(surat.tempatTanggal, columns[columns.length - 1]!);
    y -= LINE;
  }
  if (surat.salam) {
    text(surat.salam, columns[columns.length - 1]!);
    y -= LINE;
  }
  const top = y;
  surat.ttd.forEach((signer, index) => {
    const x = columns[index % columns.length]!;
    y = top;
    if (signer.label) text(signer.label, x);
    y -= LINE;
    if (signer.meterai) {
      page.drawRectangle({
        x,
        y: y - 50,
        width: 60,
        height: 44,
        borderColor: rgb(0.5, 0.5, 0.5),
        borderWidth: 0.7,
        borderDashArray: [3, 2],
      });
      page.drawText('Meterai', {
        x: x + 12,
        y: y - 24,
        size: 8,
        font: regular,
        color: rgb(0.5, 0.5, 0.5),
      });
      page.drawText('10.000', {
        x: x + 15,
        y: y - 34,
        size: 8,
        font: regular,
        color: rgb(0.5, 0.5, 0.5),
      });
    }
    y -= 60;
    const name = toWinAnsi(signer.nama);
    const nameLines = wrapText(name, bold, SIZE, columnWidth);
    nameLines.forEach((current) => {
      text(current, x, bold);
      const w = bold.widthOfTextAtSize(current, SIZE);
      page.drawLine({
        start: { x, y: y - SIZE - 2 },
        end: { x: x + w, y: y - SIZE - 2 },
        thickness: 0.6,
        color: black,
      });
      y -= LINE;
    });
  });

  return doc.save();
};
