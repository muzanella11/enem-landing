/**
 * Letter templates as data (Story 33). A template lists its fields and its
 * body; `{{field}}` placeholders are filled by `susunSurat`. Adding a letter
 * type = one data file plus a test.
 */
export interface Kolom {
  id: string;
  label: string;
  jenis?: 'teks' | 'panjang' | 'tanggal' | 'pilihan';
  wajib?: boolean;
  /** `field=value`: the field is shown (and required) only then. */
  tampilJika?: string;
  pilihan?: { value: string; label: string }[];
  placeholder?: string;
  /** Example value, used for the sample letter on the page. */
  contoh?: string;
  bantuan?: string;
}

/** `jika` / `kecuali`: a field id (non-empty) or `field=value`. */
interface Kondisi {
  jika?: string;
  kecuali?: string;
}

export type Blok =
  | ({ p: string; rataTengah?: boolean } & Kondisi)
  | ({ tabel: [label: string, nilai: string][] } & Kondisi)
  /** Numbered list, one item per line of a long-text field. */
  | ({ daftar: string } & Kondisi);

export interface PenandaTangan extends Kondisi {
  label?: string;
  nama: string;
  /** Signs over a meterai when the user ticks "pakai meterai". */
  meterai?: boolean;
}

export interface SuratTemplate {
  slug: string;
  nama: string;
  seoTitle: string;
  deskripsi: string;
  kolom: Kolom[];
  /** Offer the "pakai meterai" checkbox, and its default. */
  meterai?: { bawaan: boolean; catatan: string };
  /** Where "Kota, tanggal" goes: top right (letters) or above the signatures (statements). */
  tanggalDi: 'atas' | 'ttd';
  kepada?: (string | ({ baris: string } & Kondisi))[];
  perihal?: string;
  judul?: string;
  isi: Blok[];
  salam?: string;
  ttd: PenandaTangan[];
  /** Extra values derived from the input, e.g. a date range. */
  turunan?: (nilai: Record<string, string>) => Record<string, string>;
  /** Non-blocking hints shown under the form. */
  peringatan?: (nilai: Record<string, string>) => string[];
  struktur: string[];
  faqs: { q: string; a: string }[];
  /** Not legal advice: shown on statements and powers of attorney. */
  catatanHukum?: boolean;
}
