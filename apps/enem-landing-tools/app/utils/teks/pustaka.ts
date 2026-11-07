/**
 * Reference list entries (Story 46): APA 7th edition and Harvard (Cite
 * Them Right), with the Indonesian conventions used by university writing
 * guides ("dkk.", "t.t.", "[Skripsi, ...]", "Diakses"). Output is a list
 * of runs so the page can italicise titles and the copy keeps formatting.
 */
export type GayaPustaka = 'apa' | 'harvard';
export type JenisSumber = 'buku' | 'jurnal' | 'web' | 'skripsi';

export interface Sumber {
  jenis: JenisSumber;
  /** One author per entry: "Nama Lengkap" or "Belakang, Depan". */
  penulis: string[];
  /** The author is an organisation: written as is, no initials. */
  lembaga?: boolean;
  tahun: string;
  judul: string;
  edisi?: string;
  penerbit?: string;
  kota?: string;
  jurnal?: string;
  volume?: string;
  nomor?: string;
  halaman?: string;
  doi?: string;
  url?: string;
  /** Web pages: publication date (YYYY-MM-DD) and access date. */
  tanggalTerbit?: string;
  diakses?: string;
  situs?: string;
  jenjang?: 'Skripsi' | 'Tesis' | 'Disertasi';
  institusi?: string;
}

export interface Potongan {
  teks: string;
  miring?: boolean;
}

const BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];
const tanggalPanjang = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${Number(m[3])} ${BULAN[Number(m[2]) - 1]} ${m[1]}` : iso;
};

/** "Rina Kartika Sari" -> "Sari, R. K."; "Belakang, Depan" respected; single names kept. */
export const namaApa = (nama: string, titikSetelahInisial = true): string => {
  const bersih = nama.trim().replace(/\s+/g, ' ');
  if (!bersih) return '';
  let belakang: string;
  let depan: string[];
  if (bersih.includes(',')) {
    const [b, d = ''] = bersih.split(',').map((s) => s.trim());
    belakang = b!;
    depan = d.split(' ').filter(Boolean);
  } else {
    const bagian = bersih.split(' ');
    if (bagian.length === 1) return bersih;
    belakang = bagian.pop()!;
    depan = bagian;
  }
  if (!depan.length) return belakang;
  const inisial = depan.map((d) =>
    d
      .split('-')
      .map((p) => `${p[0]!.toUpperCase()}.`)
      .join('-'),
  );
  return `${belakang}, ${titikSetelahInisial ? inisial.join(' ') : inisial.join('')}`;
};

const daftarPenulisApa = (penulis: string[], lembaga?: boolean) => {
  if (lembaga) return penulis.filter(Boolean).join(', ');
  const nama = penulis.map((p) => namaApa(p)).filter(Boolean);
  if (!nama.length) return '';
  if (nama.length === 1) return nama[0]!;
  if (nama.length <= 20)
    return `${nama.slice(0, -1).join(', ')}, & ${nama[nama.length - 1]}`;
  return `${nama.slice(0, 19).join(', ')}, . . . ${nama[nama.length - 1]}`;
};

const daftarPenulisHarvard = (penulis: string[], lembaga?: boolean) => {
  if (lembaga) return penulis.filter(Boolean).join(', ');
  const nama = penulis.map((p) => namaApa(p, false)).filter(Boolean);
  if (!nama.length) return '';
  if (nama.length >= 4) return `${nama[0]} dkk.`;
  if (nama.length === 1) return nama[0]!;
  return `${nama.slice(0, -1).join(', ')} dan ${nama[nama.length - 1]}`;
};

const titik = (s: string) => (/[.?!]$/.test(s) ? s : `${s}.`);
const tahunAtau = (t: string) => t.trim() || 't.t.';
const doiAtauUrl = (s: Sumber) =>
  s.doi
    ? s.doi.startsWith('http')
      ? s.doi
      : `https://doi.org/${s.doi.replace(/^doi:\s*/i, '')}`
    : (s.url ?? '');

export const formatPustaka = (s: Sumber, gaya: GayaPustaka): Potongan[] => {
  const out: Potongan[] = [];
  const add = (teks: string, miring = false) =>
    teks && out.push({ teks, miring });

  if (gaya === 'apa') {
    const penulis = daftarPenulisApa(s.penulis, s.lembaga);
    const tanggal =
      s.jenis === 'web' &&
      s.tanggalTerbit &&
      /^\d{4}-\d{2}-\d{2}$/.test(s.tanggalTerbit)
        ? `${s.tanggalTerbit.slice(0, 4)}, ${tanggalPanjang(s.tanggalTerbit).replace(/ \d{4}$/, '')}`
        : tahunAtau(s.tahun);
    // With no author, APA moves the title to the author position.
    if (penulis) add(`${titik(penulis)} (${tanggal}). `);
    if (s.jenis === 'jurnal') {
      if (!penulis) add(`${titik(s.judul)} (${tanggal}). `);
      else add(`${titik(s.judul)} `);
      add(s.jurnal ?? '', true);
      if (s.volume) {
        add(', ');
        add(s.volume, true);
      }
      if (s.nomor) add(`(${s.nomor})`);
      if (s.halaman) add(`, ${s.halaman.replace(/\s*-\s*/, '–')}`);
      add('.');
      const link = doiAtauUrl(s);
      if (link) add(` ${link}`);
      return out;
    }
    // Title (italic); with no author it takes the author position.
    add(s.judul, true);
    if (s.jenis === 'buku' && s.edisi) add(` (${s.edisi})`);
    if (s.jenis === 'skripsi')
      add(` [${s.jenjang ?? 'Skripsi'}, ${s.institusi ?? ''}]`);
    add(penulis ? '. ' : `. (${tanggal}). `);
    if (s.jenis === 'buku') {
      if (s.penerbit) add(titik(s.penerbit));
      const link = doiAtauUrl(s);
      if (link) add(` ${link}`);
    } else if (s.jenis === 'skripsi') {
      if (s.url) add(s.url);
    } else {
      if (s.situs) add(`${titik(s.situs)} `);
      if (s.url) add(s.url);
    }
    return out;
  }

  // Harvard (Cite Them Right), Indonesian wording.
  const penulis =
    daftarPenulisHarvard(s.penulis, s.lembaga) || s.situs || s.judul;
  add(`${penulis} (${tahunAtau(s.tahun)}) `);
  if (s.jenis === 'jurnal') {
    add(`'${s.judul}', `);
    add(s.jurnal ?? '', true);
    add(
      `${s.volume ? `, ${s.volume}` : ''}${s.nomor ? `(${s.nomor})` : ''}${s.halaman ? `, hlm. ${s.halaman.replace(/\s*-\s*/, '–')}` : ''}.`,
    );
    if (s.doi) add(` doi: ${s.doi.replace(/^https?:\/\/doi\.org\//, '')}.`);
    else if (s.url)
      add(
        ` Tersedia di: ${s.url}${s.diakses ? ` (Diakses: ${tanggalPanjang(s.diakses)})` : ''}.`,
      );
    return out;
  }
  add(s.judul, true);
  add('. ');
  if (s.jenis === 'buku') {
    if (s.edisi) add(`${titik(s.edisi)} `);
    add([s.kota, s.penerbit].filter(Boolean).join(': '));
    if (s.kota || s.penerbit) add('.');
  } else if (s.jenis === 'skripsi') {
    add(`${s.jenjang ?? 'Skripsi'}. ${s.institusi ?? ''}.`);
    if (s.url)
      add(
        ` Tersedia di: ${s.url}${s.diakses ? ` (Diakses: ${tanggalPanjang(s.diakses)})` : ''}.`,
      );
  } else {
    add(
      `Tersedia di: ${s.url ?? ''}${s.diakses ? ` (Diakses: ${tanggalPanjang(s.diakses)})` : ''}.`,
    );
  }
  return out;
};

export const keTeks = (potongan: Potongan[]) =>
  potongan
    .map((p) => p.teks)
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const keHtml = (potongan: Potongan[]) =>
  potongan
    .map((p) =>
      p.miring ? `<i>${escapeHtml(p.teks)}</i>` : escapeHtml(p.teks),
    )
    .join('');

/** Reference lists are sorted by the first author's surname (or the title). */
export const urutkan = (list: Sumber[], gaya: GayaPustaka) =>
  [...list].sort((a, b) =>
    keTeks(formatPustaka(a, gaya)).localeCompare(
      keTeks(formatPustaka(b, gaya)),
      'id',
    ),
  );
