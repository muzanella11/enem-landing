# Story 33: Generator Surat (Lamaran Kerja, Kuasa, Pernyataan, dan Lainnya)

**Apps touched:** `enem-landing-tools`, `enem-landing-api` (seed registry)

**Depends on:** Story 20, Story 24 (render PDF dengan `pdf-lib`, terbilang),
Story 25

## Background

Contoh dan template surat ("contoh surat lamaran kerja", "surat kuasa",
"surat pernyataan") dicari sangat sering di Indonesia. Tool yang langsung
menghasilkan surat rapi dari isian lebih berguna daripada halaman contoh
biasa, dan tetap bisa punya konten contoh untuk SEO.

## Goal

Generator surat di `/buat-surat` dengan satu halaman per jenis surat
(`/buat-surat/lamaran-kerja`, dst.), hasil PDF dan teks yang bisa disalin.

## Keputusan awal

1. **Template sebagai data** (`app/data/surat/*.ts`): judul, kolom isian
   (dengan validasi), dan isi surat dengan placeholder. Menambah jenis surat
   cukup menambah satu file data dan test-nya.
2. **Jenis surat rilis pertama:** lamaran kerja, kuasa, pernyataan, izin
   tidak masuk kerja/sekolah, pengunduran diri (resign), keterangan
   domisili (permohonan ke RT/RW). Daftar final ditentukan saat
   implementasi berdasarkan volume pencarian.
3. **Output:** pratinjau langsung, unduh PDF (A4 atau F4, `pdf-lib`), dan
   salin teks. Ekspor `.docx` tidak di rilis pertama.
4. Data isian bisa disimpan lokal (localStorage) untuk dipakai ulang,
   mengikuti pola Story 24, dengan tombol hapus data.
5. **Bukan nasihat hukum:** surat kuasa dan pernyataan diberi catatan bahwa
   template adalah contoh umum, dan untuk keperluan hukum sebaiknya
   dikonsultasikan.

## Scope

- Halaman indeks jenis surat dan halaman per jenis surat (SEO terpisah).
- Form isian, pratinjau, pilihan ukuran kertas, kolom tanda tangan dan
  penanda meterai bila relevan (mengikuti aturan bea meterai Story 24).
- Tiap halaman punya penjelasan singkat "struktur surat yang baik" dan FAQ
  untuk konten SEO.

## Monetisasi

AdSense dan donasi. Iklan tidak pernah di dalam PDF atau pratinjau.

## Out of scope

- Ekspor `.docx` (kandidat lanjutan).
- Surat resmi instansi dengan format baku tertentu (mis. surat dinas).
- Kirim surat lewat email dari server.

## Acceptance Criteria

- [ ] Unit test pengisian template: placeholder terisi, kolom wajib kosong
      ditandai, karakter khusus aman di PDF.
- [ ] PDF tampil sama di Chrome, Safari, dan pembaca PDF desktop untuk A4
      dan F4.
- [ ] Data tersimpan lokal setelah reload dan bisa dihapus.
- [ ] Tidak ada request jaringan yang membawa isi surat.
- [ ] Muncul di registry (satu entri per jenis surat atau satu entri hub,
      diputuskan saat implementasi), meta/JSON-LD, sitemap; lint, test,
      e2e lulus.
