import type { Blok, Kolom, SuratTemplate } from '../../data/surat/types';
import { formatTanggal } from './format';

/** Filling letter templates (Story 33). Pure: the page, text copy, and PDF share it. */

export type Nilai = Record<string, string>;

export type BlokJadi =
  | { jenis: 'p'; teks: string; rataTengah?: boolean }
  | { jenis: 'tabel'; baris: [string, string][] }
  | { jenis: 'daftar'; item: string[] };

export interface SuratJadi {
  tempatTanggal: string;
  tanggalDi: 'atas' | 'ttd';
  kepada: string[];
  perihal?: string;
  judul?: string;
  blok: BlokJadi[];
  salam?: string;
  ttd: { label?: string; nama: string; meterai: boolean }[];
}

const kondisi = (spec: string | undefined, nilai: Nilai): boolean => {
  if (!spec) return true;
  const [field, value] = spec.split('=') as [string, string | undefined];
  const current = (nilai[field] ?? '').trim();
  return value === undefined ? current !== '' : current === value;
};
const lolos = (item: { jika?: string; kecuali?: string }, nilai: Nilai) =>
  kondisi(item.jika, nilai) && (!item.kecuali || !kondisi(item.kecuali, nilai));

/** Fields visible for the current input (conditional ones included only when they apply). */
export const kolomAktif = (template: SuratTemplate, nilai: Nilai): Kolom[] =>
  template.kolom.filter((kolom) => kondisi(kolom.tampilJika, nilai));

/** Required fields that are still empty. */
export const kolomKosong = (template: SuratTemplate, nilai: Nilai): Kolom[] =>
  kolomAktif(template, nilai).filter(
    (kolom) => kolom.wajib && !(nilai[kolom.id] ?? '').trim(),
  );

const PLACEHOLDER = /\{\{(\w+)\}\}/g;
const KOSONG = '\uE000';

/**
 * Replaces placeholders. Dates are spelled out; empty required fields show
 * as "[Label]" so the preview makes gaps obvious; empty optional fields
 * vanish along with the separator before them.
 */
export const isiTeks = (
  teks: string,
  nilai: Nilai,
  kolom: Map<string, Kolom>,
): string =>
  teks
    .replace(PLACEHOLDER, (_, id: string) => {
      const value = (nilai[id] ?? '').trim();
      const def = kolom.get(id);
      if (!value) return def?.wajib ? `[${def.label}]` : KOSONG;
      return def?.jenis === 'tanggal' ? formatTanggal(value) : value;
    })
    // Only separators next to an emptied field go; the template's own commas stay.
    .replace(/\s*,\s*\uE000/g, '')
    .replace(/\uE000\s*,\s*/g, '')
    .replace(/\uE000/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

const placeholders = (teks: string) =>
  [...teks.matchAll(PLACEHOLDER)].map((match) => match[1]!);

/** A row or paragraph whose every placeholder is an empty optional field is dropped. */
const kosongSemua = (teks: string, nilai: Nilai, kolom: Map<string, Kolom>) => {
  const ids = placeholders(teks);
  return (
    ids.length > 0 &&
    ids.every((id) => !kolom.get(id)?.wajib && !(nilai[id] ?? '').trim())
  );
};

export const susunSurat = (
  template: SuratTemplate,
  masukan: Nilai,
  opsi: { meterai?: boolean } = {},
): SuratJadi => {
  const nilai: Nilai = { ...masukan, ...template.turunan?.(masukan) };
  const kolom = new Map(
    kolomAktif(template, nilai).map((item) => [item.id, item]),
  );
  const isi = (teks: string) => isiTeks(teks, nilai, kolom);

  const blok: BlokJadi[] = [];
  for (const item of template.isi as Blok[]) {
    if (!lolos(item, nilai)) continue;
    if ('p' in item) {
      if (!kosongSemua(item.p, nilai, kolom))
        blok.push({
          jenis: 'p',
          teks: isi(item.p),
          rataTengah: item.rataTengah,
        });
    } else if ('tabel' in item) {
      const baris = item.tabel
        .filter(([, value]) => !kosongSemua(value, nilai, kolom))
        .map(([label, value]) => [label, isi(value)] as [string, string]);
      if (baris.length) blok.push({ jenis: 'tabel', baris });
    } else {
      const raw = (nilai[item.daftar] ?? '').trim();
      const def = kolom.get(item.daftar);
      const lines = raw
        .split(/\r?\n/)
        .map((line) => line.trim().replace(/^(\d+[.)]|[-*•])\s*/, ''))
        .filter(Boolean);
      if (lines.length) blok.push({ jenis: 'daftar', item: lines });
      else if (def?.wajib)
        blok.push({ jenis: 'daftar', item: [`[${def.label}]`] });
    }
  }

  const meterai = opsi.meterai ?? template.meterai?.bawaan ?? false;
  return {
    tempatTanggal: isi('{{kota}}, {{tanggal}}'),
    tanggalDi: template.tanggalDi,
    kepada: (template.kepada ?? [])
      .filter((line) => typeof line === 'string' || lolos(line, nilai))
      .map((line) => (typeof line === 'string' ? line : line.baris))
      .filter((line) => !kosongSemua(line, nilai, kolom))
      .map(isi),
    perihal: template.perihal ? isi(template.perihal) : undefined,
    judul: template.judul,
    blok,
    salam: template.salam,
    ttd: template.ttd
      .filter((item) => lolos(item, nilai))
      .map((item) => ({
        label: item.label,
        nama: isi(item.nama),
        meterai: Boolean(item.meterai && meterai && template.meterai),
      })),
  };
};

/** Plain text for copy/paste (WhatsApp, email, word processor). */
export const suratKeTeks = (surat: SuratJadi): string => {
  const out: string[] = [];
  if (surat.tanggalDi === 'atas') out.push(surat.tempatTanggal, '');
  if (surat.kepada.length) out.push(...surat.kepada, '');
  if (surat.perihal) out.push(`Perihal: ${surat.perihal}`, '');
  if (surat.judul) out.push(surat.judul, '');
  for (const blok of surat.blok) {
    if (blok.jenis === 'p') out.push(blok.teks);
    else if (blok.jenis === 'tabel') {
      const width = Math.max(...blok.baris.map(([label]) => label.length));
      for (const [label, value] of blok.baris)
        out.push(`${label.padEnd(width)} : ${value}`);
    } else
      blok.item.forEach((item, index) => out.push(`${index + 1}. ${item}`));
    out.push('');
  }
  if (surat.tanggalDi === 'ttd') out.push(surat.tempatTanggal);
  if (surat.salam) out.push(surat.salam);
  for (const ttd of surat.ttd) {
    if (ttd.label) out.push(ttd.label);
    out.push('', ttd.meterai ? '(meterai Rp10.000)' : '', '', ttd.nama, '');
  }
  return out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/** Values for the sample letter on each page (SEO content). */
export const nilaiContoh = (template: SuratTemplate, hariIni: string): Nilai =>
  Object.fromEntries(
    template.kolom.map((kolom) => [
      kolom.id,
      kolom.id === 'tanggal' ? hariIni : (kolom.contoh ?? ''),
    ]),
  );
