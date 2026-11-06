import { describe, expect, it } from 'vitest';
import { hitungTeks, nilaiAkhir, nilaiDibutuhkan, ubahHuruf } from './index.js';
import {
  formatPustaka,
  keHtml,
  keTeks,
  namaApa,
  urutkan,
  type Sumber,
} from './pustaka.js';

describe('penghitung kata', () => {
  it('Indonesian text: reduplication, numbers, punctuation', () => {
    const s = hitungTeks(
      'Anak-anak bermain di taman. Harganya Rp3.500, murah!\n\nParagraf kedua (tes) selesai...',
    );
    // Anak-anak, bermain, di, taman, Harganya, Rp3.500, murah, Paragraf, kedua, tes, selesai
    expect(s.kata).toBe(11);
    expect(s.kalimat).toBe(3);
    expect(s.paragraf).toBe(2);
  });

  it('numbers with separators count as one word; empty text is zero', () => {
    expect(hitungTeks('Nilai 3,75 dan 1.000.000 rupiah').kata).toBe(5);
    expect(hitungTeks('   ')).toMatchObject({
      kata: 0,
      kalimat: 0,
      paragraf: 0,
    });
  });

  it('frequent words skip function words', () => {
    const s = hitungTeks('Data data DATA yang yang yang analisis');
    expect(s.teratas[0]).toEqual({ kata: 'data', jumlah: 3 });
    expect(s.teratas.find((t) => t.kata === 'yang')).toBeUndefined();
  });
});

describe('ubah huruf', () => {
  it('Indonesian title case keeps function words lowercase except first', () => {
    expect(
      ubahHuruf(
        'pengaruh media sosial terhadap minat baca di kalangan anak-anak',
        'judul',
      ),
    ).toBe('Pengaruh Media Sosial terhadap Minat Baca di Kalangan Anak-Anak');
    expect(ubahHuruf('dari desa ke kota', 'judul')).toBe('Dari Desa ke Kota');
  });

  it('sentence, upper, lower', () => {
    expect(ubahHuruf('HALO DUNIA. apa KABAR? baik', 'kalimat')).toBe(
      'Halo dunia. Apa kabar? Baik',
    );
    expect(ubahHuruf('abc', 'kapital')).toBe('ABC');
    expect(ubahHuruf('aBc dEf', 'awal-kata')).toBe('Abc Def');
  });
});

describe('nilai rapor', () => {
  const komponen = [
    { nama: 'Tugas', bobot: 30, nilai: 80 },
    { nama: 'UTS', bobot: 30, nilai: 70 },
    { nama: 'UAS', bobot: 40, nilai: null },
  ];
  it('average of known parts and score needed', () => {
    expect(nilaiAkhir(komponen)).toBe(75);
    // (80*100 - 2400 - 2100) / 40 = 87.5
    expect(nilaiDibutuhkan(komponen, 80)).toBe(87.5);
    expect(
      nilaiDibutuhkan(
        komponen.map((k) => ({ ...k, nilai: k.nilai ?? 90 })),
        80,
      ),
    ).toBeNull();
  });
});

describe('daftar pustaka', () => {
  const buku: Sumber = {
    jenis: 'buku',
    penulis: ['Sugiyono'],
    tahun: '2019',
    judul: 'Metode penelitian kuantitatif, kualitatif, dan R&D',
    edisi: 'Ed. ke-2',
    penerbit: 'Alfabeta',
    kota: 'Bandung',
  };
  const jurnal: Sumber = {
    jenis: 'jurnal',
    penulis: ['Rina Kartika Sari', 'Budi Santoso'],
    tahun: '2023',
    judul: 'Literasi digital pada mahasiswa',
    jurnal: 'Jurnal Pendidikan Indonesia',
    volume: '12',
    nomor: '2',
    halaman: '101-115',
    doi: '10.1234/jpi.v12i2.567',
  };

  it('author names', () => {
    expect(namaApa('Rina Kartika Sari')).toBe('Sari, R. K.');
    expect(namaApa('Sugiyono')).toBe('Sugiyono');
    expect(namaApa('Sari, Rina Kartika')).toBe('Sari, R. K.');
    expect(namaApa('Ahmad Al-Farabi Hasan')).toBe('Hasan, A. A.-F.');
  });

  it('APA 7: book and journal article', () => {
    expect(keTeks(formatPustaka(buku, 'apa'))).toBe(
      'Sugiyono. (2019). Metode penelitian kuantitatif, kualitatif, dan R&D (Ed. ke-2). Alfabeta.',
    );
    expect(keTeks(formatPustaka(jurnal, 'apa'))).toBe(
      'Sari, R. K., & Santoso, B. (2023). Literasi digital pada mahasiswa. Jurnal Pendidikan Indonesia, 12(2), 101–115. https://doi.org/10.1234/jpi.v12i2.567',
    );
    expect(keHtml(formatPustaka(jurnal, 'apa'))).toContain(
      '<i>Jurnal Pendidikan Indonesia</i>, <i>12</i>(2)',
    );
  });

  it('APA 7: website without year, thesis', () => {
    expect(
      keTeks(
        formatPustaka(
          {
            jenis: 'web',
            penulis: ['Badan Pusat Statistik'],
            lembaga: true,
            tahun: '',
            judul: 'Indeks pembangunan manusia',
            situs: 'BPS',
            url: 'https://bps.go.id/ipm',
          },
          'apa',
        ),
      ),
    ).toBe(
      'Badan Pusat Statistik. (t.t.). Indeks pembangunan manusia. BPS. https://bps.go.id/ipm',
    );
    expect(
      keTeks(
        formatPustaka(
          {
            jenis: 'skripsi',
            penulis: ['Dewi Anggraini'],
            tahun: '2022',
            judul: 'Analisis kepuasan pelanggan',
            jenjang: 'Skripsi',
            institusi: 'Universitas Padjadjaran',
          },
          'apa',
        ),
      ),
    ).toBe(
      'Anggraini, D. (2022). Analisis kepuasan pelanggan [Skripsi, Universitas Padjadjaran].',
    );
  });

  it('Harvard: book, journal, website, four or more authors', () => {
    expect(keTeks(formatPustaka(buku, 'harvard'))).toBe(
      'Sugiyono (2019) Metode penelitian kuantitatif, kualitatif, dan R&D. Ed. ke-2. Bandung: Alfabeta.',
    );
    expect(keTeks(formatPustaka(jurnal, 'harvard'))).toBe(
      "Sari, R.K. dan Santoso, B. (2023) 'Literasi digital pada mahasiswa', Jurnal Pendidikan Indonesia, 12(2), hlm. 101–115. doi: 10.1234/jpi.v12i2.567.",
    );
    expect(
      keTeks(
        formatPustaka(
          {
            jenis: 'web',
            penulis: ['A B', 'C D', 'E F', 'G H'],
            tahun: '2024',
            judul: 'Judul',
            url: 'https://x.id',
            diakses: '2026-11-06',
          },
          'harvard',
        ),
      ),
    ).toBe(
      'B, A. dkk. (2024) Judul. Tersedia di: https://x.id (Diakses: 6 November 2026).',
    );
  });

  it('sorted alphabetically', () => {
    expect(urutkan([buku, jurnal], 'apa').map((s) => s.jenis)).toEqual([
      'jurnal',
      'buku',
    ]);
  });
});
