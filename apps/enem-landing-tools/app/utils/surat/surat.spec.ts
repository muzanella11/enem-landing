import { describe, expect, it } from 'vitest';
import { DAFTAR_SURAT, findSurat } from '../../data/surat/index.js';
import { formatTanggal } from './format.js';
import {
  kolomAktif,
  kolomKosong,
  nilaiContoh,
  susunSurat,
  suratKeTeks,
} from './index.js';
import { renderSuratPdf } from './pdf.js';
import { loadSurat, parseSuratStore, saveSurat } from './storage.js';

const surat = (slug: string) => findSurat(slug)!;

describe('formatTanggal', () => {
  it('spells out dates, optionally with the weekday', () => {
    expect(formatTanggal('2026-11-06')).toBe('6 November 2026');
    expect(formatTanggal('2026-11-06', true)).toBe('Jumat, 6 November 2026');
  });
});

describe('every template', () => {
  it.each(DAFTAR_SURAT.map((item) => [item.slug, item] as const))(
    '%s: the sample letter has no gaps or stray placeholders',
    (_, template) => {
      const nilai = nilaiContoh(template, '2026-11-06');
      expect(kolomKosong(template, nilai)).toEqual([]);
      const teks = suratKeTeks(susunSurat(template, nilai));
      expect(teks).not.toMatch(/\{\{|\}\}|\[[A-Z]/);
      expect(teks).toContain('6 November 2026');
      if (template.salam) expect(teks).toContain(template.salam);
      expect(teks).not.toContain('\uE000');
    },
  );

  it('slugs are unique', () => {
    const slugs = DAFTAR_SURAT.map((item) => item.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('susunSurat', () => {
  it('marks empty required fields and drops empty optional rows', () => {
    const template = surat('lamaran-kerja');
    const result = susunSurat(template, { nama: 'Rina', kota: 'Bandung' });
    const teks = suratKeTeks(result);
    expect(teks).toContain('[Posisi yang dilamar]');
    expect(teks).not.toContain('Email');
    expect(teks).not.toContain('Tempat, tanggal lahir');
    expect(result.tempatTanggal).toBe('Bandung, [Tanggal surat]');
    expect(teks).toContain('Dengan hormat,');
    expect(kolomKosong(template, { nama: 'Rina' }).map((k) => k.id)).toContain(
      'posisi',
    );
  });

  it('keeps a half-filled combined row without a dangling comma', () => {
    const result = susunSurat(surat('lamaran-kerja'), { tempatLahir: 'Garut' });
    const tabel = result.blok.find((blok) => blok.jenis === 'tabel');
    expect(tabel?.jenis === 'tabel' && tabel.baris[1]).toEqual([
      'Tempat, tanggal lahir',
      'Garut',
    ]);
  });

  it('conditional fields and paragraphs (izin sekolah)', () => {
    const template = surat('izin-tidak-masuk');
    expect(
      kolomAktif(template, { jenis: 'kerja' }).map((k) => k.id),
    ).not.toContain('namaOrtu');
    const nilai = {
      ...nilaiContoh(template, '2026-11-06'),
      jenis: 'sekolah',
      namaOrtu: 'Budi',
      tanggalMulai: '2026-11-09',
      tanggalSelesai: '2026-11-10',
    };
    const teks = suratKeTeks(susunSurat(template, nilai));
    expect(teks).toContain('orang tua/wali dari');
    expect(teks).toContain('tanggal 9 November 2026 sampai 10 November 2026');
    expect(teks).toContain('Budi');
    expect(teks).not.toContain('tidak dapat masuk kerja');
  });

  it('numbered list strips existing numbering', () => {
    const result = susunSurat(surat('surat-pernyataan'), {
      pernyataan: '1. Benar\n- Bersedia\n\n',
    });
    expect(result.blok.find((blok) => blok.jenis === 'daftar')).toEqual({
      jenis: 'daftar',
      item: ['Benar', 'Bersedia'],
    });
  });

  it('meterai follows the checkbox', () => {
    const template = surat('surat-kuasa');
    expect(susunSurat(template, {}).ttd.map((t) => t.meterai)).toEqual([
      false,
      true,
    ]);
    expect(
      susunSurat(template, {}, { meterai: false }).ttd.some((t) => t.meterai),
    ).toBe(false);
  });

  it('resign warns when notice is shorter than 30 days', () => {
    const template = surat('pengunduran-diri');
    expect(
      template.peringatan!({
        tanggal: '2026-11-06',
        tanggalTerakhir: '2026-11-20',
      }),
    ).toHaveLength(1);
    expect(
      template.peringatan!({
        tanggal: '2026-11-06',
        tanggalTerakhir: '2026-12-11',
      }),
    ).toEqual([]);
  });
});

describe('PDF', () => {
  it('renders A4 and F4 with special characters', async () => {
    const template = surat('surat-pernyataan');
    const nilai = {
      ...nilaiContoh(template, '2026-11-06'),
      nama: 'Zoë “Ayu” — Ñandú 😀 中文',
      pernyataan: Array.from({ length: 40 }, (_, i) =>
        `Poin panjang ${i} `.repeat(8),
      ).join('\n'),
    };
    for (const paper of ['A4', 'F4'] as const) {
      const bytes = await renderSuratPdf(susunSurat(template, nilai), paper);
      const head = new TextDecoder().decode(bytes.slice(0, 5));
      expect(head).toBe('%PDF-');
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.load(bytes);
      expect(doc.getPageCount()).toBeGreaterThan(1);
    }
  });
});

describe('storage', () => {
  it('round trips and ignores junk', () => {
    const memory = new Map<string, string>();
    const storage = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => void memory.set(key, value),
    };
    saveSurat(storage, { nama: 'Rina' });
    expect(loadSurat(storage)).toEqual({ nama: 'Rina' });
    expect(parseSuratStore({ nilai: { a: 1, b: 'x' } })).toEqual({ b: 'x' });
    memory.set('elt_surat_v1', '{bad json');
    expect(loadSurat(storage)).toEqual({});
  });
});
