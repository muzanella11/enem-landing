import type { PDFFont, PDFImage, PDFPage } from 'pdf-lib';
import { formatRupiah } from '../format';
import { terbilang } from '../terbilang';
import { calculateInvoiceTotals, needsMeterai } from './index';
import type {
  BusinessProfile,
  InvoiceDocument,
  InvoiceTemplate,
  ReceiptDocument,
} from './storage';

/**
 * Invoice and kwitansi PDFs drawn with pdf-lib (Story 24) rather than the
 * browser's print dialog, so the file looks the same on every device.
 * pdf-lib is imported lazily by `renderInvoicePdf`/`renderReceiptsPdf`.
 */

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 40;

interface Theme {
  accent: [number, number, number];
  band: boolean;
  compact: boolean;
}

const THEMES: Record<InvoiceTemplate, Theme> = {
  klasik: { accent: [0.15, 0.15, 0.15], band: false, compact: false },
  modern: { accent: [0.055, 0.486, 0.42], band: true, compact: false },
  ringkas: { accent: [0.2, 0.25, 0.33], band: false, compact: true },
};

/**
 * Standard PDF fonts only cover WinAnsi (Latin-1-ish). Anything outside it
 * (emoji, CJK) would make pdf-lib throw, so it's replaced with "?".
 */
export const toWinAnsi = (text: string): string =>
  text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\n\r\t\x20-\x7E\xA0-\xFF]/g, '?');

export const wrapText = (
  text: string,
  font: Pick<PDFFont, 'widthOfTextAtSize'>,
  size: number,
  maxWidth: number,
): string[] => {
  const lines: string[] = [];
  for (const paragraph of toWinAnsi(text).split(/\r?\n/)) {
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      // Break words longer than the column.
      let rest = word;
      while (font.widthOfTextAtSize(rest, size) > maxWidth && rest.length > 1) {
        let cut = rest.length - 1;
        while (
          cut > 1 &&
          font.widthOfTextAtSize(rest.slice(0, cut), size) > maxWidth
        )
          cut -= 1;
        lines.push(rest.slice(0, cut));
        rest = rest.slice(cut);
      }
      line = rest;
    }
    lines.push(line);
  }
  return lines;
};

const formatDate = (iso: string): string =>
  iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

const embedDataUrl = async (
  doc: import('pdf-lib').PDFDocument,
  dataUrl: string,
): Promise<PDFImage | null> => {
  if (!dataUrl) return null;
  try {
    const bytes = Uint8Array.from(atob(dataUrl.split(',')[1] ?? ''), (char) =>
      char.charCodeAt(0),
    );
    return dataUrl.startsWith('data:image/png')
      ? await doc.embedPng(bytes)
      : await doc.embedJpg(bytes);
  } catch {
    return null;
  }
};

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
}

const loadFonts = async (
  doc: import('pdf-lib').PDFDocument,
): Promise<Fonts> => {
  const { StandardFonts } = await import('pdf-lib');
  return {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
};

export const renderInvoicePdf = async (
  profile: BusinessProfile,
  invoice: InvoiceDocument,
): Promise<Uint8Array> => {
  const { PDFDocument, rgb } = await import('pdf-lib');
  const doc = await PDFDocument.create();
  doc.setTitle(toWinAnsi(`Invoice ${invoice.number}`));
  doc.setProducer('tools.muzanella.com');
  doc.setCreator('tools.muzanella.com');
  const fonts = await loadFonts(doc);
  const theme = THEMES[profile.template] ?? THEMES.modern;
  const accent = rgb(...theme.accent);
  const gray = rgb(0.4, 0.42, 0.45);
  const light = rgb(0.9, 0.91, 0.93);
  const black = rgb(0.1, 0.1, 0.12);
  const totals = calculateInvoiceTotals(invoice);
  const logo = await embedDataUrl(doc, profile.logoDataUrl);
  const qris = await embedDataUrl(doc, profile.qrisDataUrl);
  const bodySize = theme.compact ? 9 : 10;
  const lineGap = bodySize + 4;

  const pages: PDFPage[] = [];
  let page = doc.addPage([A4.width, A4.height]);
  pages.push(page);
  let y = A4.height - MARGIN;

  const text = (
    value: string,
    x: number,
    yPos: number,
    options: {
      font?: PDFFont;
      size?: number;
      color?: ReturnType<typeof rgb>;
    } = {},
  ) =>
    page.drawText(toWinAnsi(value), {
      x,
      y: yPos,
      font: options.font ?? fonts.regular,
      size: options.size ?? bodySize,
      color: options.color ?? black,
    });
  const textRight = (
    value: string,
    right: number,
    yPos: number,
    options: {
      font?: PDFFont;
      size?: number;
      color?: ReturnType<typeof rgb>;
    } = {},
  ) => {
    const font = options.font ?? fonts.regular;
    const size = options.size ?? bodySize;
    text(
      value,
      right - font.widthOfTextAtSize(toWinAnsi(value), size),
      yPos,
      options,
    );
  };
  const right = A4.width - MARGIN;
  const contentWidth = right - MARGIN;

  // ── Header ──────────────────────────────────────────────────────────
  if (theme.band) {
    page.drawRectangle({
      x: 0,
      y: A4.height - 8,
      width: A4.width,
      height: 8,
      color: accent,
    });
  }
  let headerLeft = MARGIN;
  if (logo) {
    const scale = Math.min(60 / logo.height, 140 / logo.width);
    page.drawImage(logo, {
      x: MARGIN,
      y: y - logo.height * scale,
      width: logo.width * scale,
      height: logo.height * scale,
    });
    headerLeft = MARGIN + logo.width * scale + 12;
  }
  text(profile.name || 'Nama usaha', headerLeft, y - 14, {
    font: fonts.bold,
    size: 14,
  });
  let infoY = y - 30;
  for (const line of [
    profile.address,
    [profile.phone, profile.email].filter(Boolean).join(' · '),
  ].filter(Boolean)) {
    for (const wrapped of wrapText(line, fonts.regular, 9, 260)) {
      text(wrapped, headerLeft, infoY, { size: 9, color: gray });
      infoY -= 12;
    }
  }
  textRight('INVOICE', right, y - 16, {
    font: fonts.bold,
    size: 22,
    color: accent,
  });
  textRight(invoice.number, right, y - 34, { font: fonts.bold, size: 10 });
  textRight(`Tanggal: ${formatDate(invoice.issueDate)}`, right, y - 48, {
    size: 9,
    color: gray,
  });
  if (invoice.dueDate)
    textRight(`Jatuh tempo: ${formatDate(invoice.dueDate)}`, right, y - 60, {
      size: 9,
      color: gray,
    });
  if (invoice.status === 'lunas')
    textRight('LUNAS', right, y - 78, {
      font: fonts.bold,
      size: 12,
      color: rgb(0.05, 0.5, 0.3),
    });
  y = Math.min(infoY, y - 84) - 10;

  // ── Bill to ─────────────────────────────────────────────────────────
  text('Ditagihkan kepada', MARGIN, y, { size: 9, color: gray });
  y -= 14;
  text(invoice.customer.name || '-', MARGIN, y, { font: fonts.bold, size: 11 });
  y -= 14;
  for (const line of [
    invoice.customer.address,
    invoice.customer.contact,
  ].filter(Boolean)) {
    for (const wrapped of wrapText(line, fonts.regular, 9, 300)) {
      text(wrapped, MARGIN, y, { size: 9, color: gray });
      y -= 12;
    }
  }
  y -= 12;

  // ── Items table ─────────────────────────────────────────────────────
  const columns = {
    no: MARGIN,
    desc: MARGIN + 22,
    qty: MARGIN + 290,
    price: MARGIN + 400,
    disc: MARGIN + 445,
    amount: right,
  };
  const descWidth = columns.qty - columns.desc - 40;
  const drawTableHeader = () => {
    page.drawRectangle({
      x: MARGIN,
      y: y - 6,
      width: contentWidth,
      height: 20,
      color: theme.band ? accent : light,
    });
    const color = theme.band ? rgb(1, 1, 1) : black;
    text('No', columns.no + 2, y, { font: fonts.bold, size: 9, color });
    text('Deskripsi', columns.desc, y, { font: fonts.bold, size: 9, color });
    textRight('Qty', columns.qty + 20, y, { font: fonts.bold, size: 9, color });
    textRight('Harga', columns.price, y, { font: fonts.bold, size: 9, color });
    textRight('Disk.', columns.disc + 10, y, {
      font: fonts.bold,
      size: 9,
      color,
    });
    textRight('Jumlah', columns.amount - 2, y, {
      font: fonts.bold,
      size: 9,
      color,
    });
    y -= 22;
  };
  const newPage = () => {
    page = doc.addPage([A4.width, A4.height]);
    pages.push(page);
    y = A4.height - MARGIN;
  };
  drawTableHeader();
  invoice.items.forEach((item, index) => {
    const lines = wrapText(
      item.description || '-',
      fonts.regular,
      bodySize,
      descWidth,
    );
    const rowHeight = lines.length * lineGap + 4;
    if (y - rowHeight < MARGIN + 60) {
      newPage();
      drawTableHeader();
    }
    const line = totals.lines[index]!;
    text(String(index + 1), columns.no + 2, y);
    lines.forEach((wrapped, lineIndex) =>
      text(wrapped, columns.desc, y - lineIndex * lineGap),
    );
    textRight(
      `${item.qty.toLocaleString('id-ID')} ${item.unit}`.trim(),
      columns.qty + 20,
      y,
    );
    textRight(formatRupiah(item.price), columns.price, y);
    textRight(
      item.discountPct ? `${item.discountPct}%` : '-',
      columns.disc + 10,
      y,
    );
    textRight(formatRupiah(line.net), columns.amount - 2, y);
    y -= rowHeight;
    page.drawLine({
      start: { x: MARGIN, y: y + 6 },
      end: { x: right, y: y + 6 },
      thickness: 0.5,
      color: light,
    });
  });

  // ── Totals ──────────────────────────────────────────────────────────
  const summaryRows: [string, string, boolean][] = [
    ['Subtotal', formatRupiah(totals.subtotal), false],
  ];
  if (totals.invoiceDiscount)
    summaryRows.push([
      `Diskon (${invoice.discountPct}%)`,
      `-${formatRupiah(totals.invoiceDiscount)}`,
      false,
    ]);
  for (const tax of totals.taxes) {
    summaryRows.push([
      `${tax.label} (${tax.ratePct}%)`,
      `${tax.kind === 'withhold' ? '-' : ''}${formatRupiah(tax.amount)}`,
      false,
    ]);
  }
  if (totals.shipping)
    summaryRows.push(['Ongkos kirim', formatRupiah(totals.shipping), false]);
  summaryRows.push(['Total', formatRupiah(totals.total), true]);
  const terbilangLines = wrapText(
    `Terbilang: ${terbilang(totals.total, { titleCase: true })}`,
    fonts.italic,
    9,
    300,
  );
  const needed = summaryRows.length * 16 + terbilangLines.length * 12 + 30;
  if (y - needed < MARGIN + 40) newPage();
  y -= 6;
  for (const [label, value, strong] of summaryRows) {
    if (strong) {
      page.drawRectangle({
        x: right - 230,
        y: y - 6,
        width: 230,
        height: 20,
        color: theme.band ? accent : light,
      });
    }
    const color = strong && theme.band ? rgb(1, 1, 1) : black;
    text(label, right - 222, y, {
      font: strong ? fonts.bold : fonts.regular,
      color,
    });
    textRight(value, right - 6, y, {
      font: strong ? fonts.bold : fonts.regular,
      color,
    });
    y -= strong ? 22 : 16;
  }
  for (const wrapped of terbilangLines) {
    textRight(wrapped, right, y, { font: fonts.italic, size: 9, color: gray });
    y -= 12;
  }
  y -= 10;

  // ── Payment, notes, terms ───────────────────────────────────────────
  const paymentLines = [
    profile.bankName && `Bank: ${profile.bankName}`,
    profile.bankAccount && `No. rekening: ${profile.bankAccount}`,
    profile.bankHolder && `Atas nama: ${profile.bankHolder}`,
  ].filter(Boolean) as string[];
  const blocks: [string, string[]][] = [];
  if (paymentLines.length) blocks.push(['Pembayaran', paymentLines]);
  if (invoice.notes) blocks.push(['Catatan', [invoice.notes]]);
  if (invoice.terms) blocks.push(['Syarat pembayaran', [invoice.terms]]);
  for (const [title, content] of blocks) {
    const lines = content.flatMap((entry) =>
      wrapText(entry, fonts.regular, 9, qris ? 360 : contentWidth),
    );
    if (y - (lines.length * 12 + 20) < MARGIN + 30) newPage();
    text(title, MARGIN, y, { font: fonts.bold, size: 9, color: accent });
    y -= 13;
    for (const wrapped of lines) {
      text(wrapped, MARGIN, y, { size: 9 });
      y -= 12;
    }
    y -= 8;
  }
  if (qris) {
    const size = 110;
    if (y - size < MARGIN + 30) newPage();
    const scale = size / Math.max(qris.width, qris.height);
    page.drawImage(qris, {
      x: right - qris.width * scale,
      y: y - qris.height * scale + 10,
      width: qris.width * scale,
      height: qris.height * scale,
    });
    textRight('Scan QRIS untuk membayar', right, y - qris.height * scale, {
      size: 8,
      color: gray,
    });
  }

  // ── Footer on every page ────────────────────────────────────────────
  pages.forEach((current, index) => {
    page = current;
    if (profile.showFooterCredit) {
      text('Dibuat dengan tools.muzanella.com', MARGIN, 20, {
        size: 7,
        color: gray,
      });
    }
    if (pages.length > 1)
      textRight(`Halaman ${index + 1} dari ${pages.length}`, right, 20, {
        size: 7,
        color: gray,
      });
  });

  return doc.save();
};

const drawReceipt = (
  page: PDFPage,
  fonts: Fonts,
  rgb: typeof import('pdf-lib').rgb,
  receipt: ReceiptDocument,
  top: number,
  height: number,
  showCredit: boolean,
) => {
  const left = MARGIN;
  const right = A4.width - MARGIN;
  const black = rgb(0.1, 0.1, 0.12);
  const gray = rgb(0.4, 0.42, 0.45);
  const draw = (
    value: string,
    x: number,
    y: number,
    font = fonts.regular,
    size = 10,
    color = black,
  ) => page.drawText(toWinAnsi(value), { x, y, font, size, color });

  page.drawRectangle({
    x: left,
    y: top - height,
    width: right - left,
    height,
    borderColor: black,
    borderWidth: 1,
  });
  draw('KWITANSI', left + 14, top - 26, fonts.bold, 16);
  const numberText = `No. ${receipt.number}`;
  draw(
    numberText,
    right - 14 - fonts.regular.widthOfTextAtSize(toWinAnsi(numberText), 10),
    top - 24,
  );

  const labelX = left + 14;
  const valueX = left + 130;
  const valueWidth = right - 14 - valueX;
  let y = top - 54;
  const row = (label: string, value: string, font = fonts.regular) => {
    draw(label, labelX, y, fonts.regular, 10, gray);
    draw(':', valueX - 10, y, fonts.regular, 10, gray);
    const lines = wrapText(value || '-', font, 10, valueWidth);
    lines.forEach((line, index) => draw(line, valueX, y - index * 13, font));
    y -= lines.length * 13 + 8;
  };
  row('Telah terima dari', receipt.receivedFrom);
  row(
    'Uang sejumlah',
    terbilang(receipt.amount, { titleCase: true }),
    fonts.italic,
  );
  row('Untuk pembayaran', receipt.purpose);

  const bottom = top - height;
  const amountText = formatRupiah(receipt.amount);
  page.drawRectangle({
    x: labelX,
    y: bottom + 30,
    width: 170,
    height: 28,
    color: rgb(0.93, 0.95, 0.96),
  });
  draw(amountText, labelX + 10, bottom + 39, fonts.bold, 14);

  const signX = right - 170;
  draw(
    `${receipt.place ? `${receipt.place}, ` : ''}${formatDate(receipt.date)}`,
    signX,
    bottom + 92,
    fonts.regular,
    9,
  );
  if (needsMeterai(receipt.amount)) {
    page.drawRectangle({
      x: signX,
      y: bottom + 40,
      width: 60,
      height: 40,
      borderColor: gray,
      borderWidth: 0.5,
      borderDashArray: [3, 2],
    });
    draw('Meterai', signX + 12, bottom + 63, fonts.regular, 7, gray);
    draw('Rp10.000', signX + 10, bottom + 53, fonts.regular, 7, gray);
  }
  draw(
    receipt.receiverName || '(.................................)',
    signX,
    bottom + 26,
    fonts.bold,
    10,
  );
  draw('Penerima', signX, bottom + 14, fonts.regular, 8, gray);
  if (showCredit)
    draw(
      'Dibuat dengan tools.muzanella.com',
      labelX,
      bottom + 8,
      fonts.regular,
      6,
      gray,
    );
};

/** Several kwitansi per A4 page (1 to 3), cut along the gaps. */
export const renderReceiptsPdf = async (
  receipts: ReceiptDocument[],
  perPage: 1 | 2 | 3,
  showCredit: boolean,
): Promise<Uint8Array> => {
  const { PDFDocument, rgb } = await import('pdf-lib');
  const doc = await PDFDocument.create();
  doc.setProducer('tools.muzanella.com');
  doc.setCreator('tools.muzanella.com');
  const fonts = await loadFonts(doc);
  const gap = 14;
  const height = Math.min(
    250,
    (A4.height - 2 * MARGIN - (perPage - 1) * gap) / perPage,
  );
  for (let start = 0; start < receipts.length; start += perPage) {
    const page = doc.addPage([A4.width, A4.height]);
    receipts.slice(start, start + perPage).forEach((receipt, index) => {
      drawReceipt(
        page,
        fonts,
        rgb,
        receipt,
        A4.height - MARGIN - index * (height + gap),
        height,
        showCredit,
      );
    });
  }
  return doc.save();
};
