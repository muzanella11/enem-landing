/** Text tools (Story 46). Everything runs on the user's device. */

// Words: letters/digits joined by hyphens or apostrophes; "." and "," only join digits (Rp3.500, 3,75).
const KATA = /[\p{L}\p{N}]+(?:(?:[-'’]|[.,](?=\p{N}))[\p{L}\p{N}]+)*/gu;

/** Common Indonesian function words, skipped in "most frequent words". */
export const KATA_UMUM = new Set(
  'yang dan di ke dari ini itu untuk dengan pada adalah dalam tidak akan juga atau ada karena oleh sebagai bisa telah sudah agar saat secara para kami kita saya anda mereka ia dia nya pun lebih harus dapat seperti hal namun jika maka bahwa antara tersebut hingga sangat setiap lain belum masih'.split(
    ' ',
  ),
);

export interface StatistikTeks {
  kata: number;
  karakter: number;
  karakterTanpaSpasi: number;
  kalimat: number;
  paragraf: number;
  menitBaca: number;
  teratas: { kata: string; jumlah: number }[];
}

export const hitungTeks = (teks: string, kecepatan = 200): StatistikTeks => {
  const kata = teks.match(KATA) ?? [];
  const bersih = teks.trim();
  // Sentence ends: . ! ? followed by whitespace or end; decimals like 3.5 are not ends.
  const kalimat = bersih
    ? bersih
        .split(/(?<=[.!?…])["')\]]*\s+(?=\S)/u)
        .filter((s) => /[\p{L}\p{N}]/u.test(s)).length
    : 0;
  const paragraf = bersih
    ? bersih.split(/\n\s*\n/).filter((p) => p.trim()).length
    : 0;
  const frekuensi = new Map<string, number>();
  for (const k of kata) {
    const kecil = k.toLowerCase();
    if (kecil.length < 3 || KATA_UMUM.has(kecil) || /^\p{N}/u.test(kecil))
      continue;
    frekuensi.set(kecil, (frekuensi.get(kecil) ?? 0) + 1);
  }
  return {
    kata: kata.length,
    karakter: [...teks].length,
    karakterTanpaSpasi: [...teks.replace(/\s/g, '')].length,
    kalimat,
    paragraf,
    menitBaca: kata.length / kecepatan,
    teratas: [...frekuensi.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([k, jumlah]) => ({ kata: k, jumlah })),
  };
};

/** Words that stay lowercase inside Indonesian titles (PUEBI/EYD V: kata tugas). */
export const KATA_TUGAS_JUDUL = new Set(
  'di ke dari dan yang untuk pada dengan atau dalam bagi oleh tentang terhadap sebagai serta tetapi namun karena agar supaya kepada daripada akan ialah adalah per'.split(
    ' ',
  ),
);

const kapitalAwal = (kata: string) =>
  kata.replace(
    /^(\P{L}*)(\p{L})/u,
    (_, pre: string, huruf: string) => pre + huruf.toUpperCase(),
  );

export type JenisHuruf =
  'kapital' | 'kecil' | 'judul' | 'kalimat' | 'awal-kata';

export const ubahHuruf = (teks: string, jenis: JenisHuruf): string => {
  if (jenis === 'kapital') return teks.toLocaleUpperCase('id-ID');
  if (jenis === 'kecil') return teks.toLocaleLowerCase('id-ID');
  const kecil = teks.toLocaleLowerCase('id-ID');
  if (jenis === 'awal-kata')
    return kecil.replace(/\S+/g, (k) =>
      kapitalAwal(k.split('-').map(kapitalAwal).join('-')),
    );
  if (jenis === 'kalimat')
    return kecil.replace(
      /(^|[.!?]\s+|\n\s*)(\P{L}*)(\p{L})/gu,
      (_, a: string, b: string, c: string) => a + b + c.toUpperCase(),
    );
  // Title: capitalise every word except function words not at the start of a line.
  return kecil
    .split('\n')
    .map((baris) => {
      let pertama = true;
      return baris.replace(/\S+/g, (k) => {
        const inti = k.replace(/[^\p{L}-]/gu, '');
        const tetapKecil = !pertama && KATA_TUGAS_JUDUL.has(inti);
        pertama = false;
        // Reduplication and compound words: capitalise each part (Anak-Anak).
        return tetapKecil ? k : k.split('-').map(kapitalAwal).join('-');
      });
    })
    .join('\n');
};

// --- Nilai rapor ---------------------------------------------------------

export interface Komponen {
  nama: string;
  bobot: number;
  /** Null = not known yet (the one we solve for). */
  nilai: number | null;
}

export const nilaiAkhir = (komponen: Komponen[]) => {
  const diketahui = komponen.filter((k) => k.nilai !== null && k.bobot > 0);
  const bobot = diketahui.reduce((s, k) => s + k.bobot, 0);
  return bobot
    ? diketahui.reduce((s, k) => s + (k.nilai ?? 0) * k.bobot, 0) / bobot
    : 0;
};

/** Score needed on the missing components (same score on each) to reach `target`. */
export const nilaiDibutuhkan = (
  komponen: Komponen[],
  target: number,
): number | null => {
  const total = komponen.reduce((s, k) => s + Math.max(0, k.bobot), 0);
  const kosong = komponen.filter((k) => k.nilai === null && k.bobot > 0);
  const bobotKosong = kosong.reduce((s, k) => s + k.bobot, 0);
  if (!total || !bobotKosong) return null;
  const sudah = komponen.reduce(
    (s, k) => s + (k.nilai ?? 0) * Math.max(0, k.bobot),
    0,
  );
  return (target * total - sudah) / bobotKosong;
};
