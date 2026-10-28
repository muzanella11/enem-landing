# Story 23: Alat PDF dan Gambar (Client-side)

**Apps touched:** `enem-landing-tools`

**Depends on:** Story 20 (fondasi tools hub)

## Background

Gabung PDF, kompres foto, dan ubah HEIC ke JPG adalah kebutuhan harian
(daftar kerja, lamaran CPNS, upload dokumen ke aplikasi yang membatasi
ukuran file). Situs yang populer untuk ini meng-upload file ke server
mereka, padahal isinya sering dokumen pribadi (KTP, KK, ijazah). Dengan
pdf-lib dan codec WASM, semuanya bisa dikerjakan di browser: lebih aman
untuk pengguna dan tidak memakan CPU, RAM, maupun bandwidth VPS.

## Goal

Sekumpulan tool di `tools.muzanella.com` yang memproses file sepenuhnya di
browser, dengan pesan jelas "file kamu tidak pernah di-upload".

## Keputusan awal

1. **Tidak ada upload ke server sama sekali.** Tidak ada server route untuk
   tool ini. Ini dijadikan acceptance criteria yang diverifikasi.
2. **Proses berat di Web Worker**, supaya UI tidak membeku di HP kelas
   menengah.
3. **WASM dan library di-lazy-load per tool**, tidak masuk bundle halaman
   index atau tool lain. Library kandidat (cek lisensi dan ukuran saat
   implementasi): `pdf-lib` (gabung/pisah/putar), `pdfjs-dist` (render
   thumbnail), `@jsquash/*` (encode/decode JPG, PNG, WebP, AVIF),
   `libheif-js` atau sejenisnya (HEIC).
4. **Batas ukuran file** ditetapkan dengan sopan (peringatan, bukan blokir)
   berdasarkan perkiraan memori perangkat.
5. Satu halaman per tool (bukan satu halaman serba bisa) supaya tiap tool
   bisa ditemukan lewat pencarian dengan kata kuncinya sendiri.

## Scope

### PDF

- `/gabung-pdf`: pilih beberapa file, atur urutan (drag), unduh hasil.
- `/pisah-pdf`: pilih halaman/rentang, unduh per file atau satu file.
- `/atur-halaman-pdf`: urutkan ulang, putar, hapus halaman dengan
  thumbnail.
- `/gambar-ke-pdf`: beberapa foto (JPG/PNG/HEIC) jadi satu PDF, pilihan
  ukuran kertas A4/F4 dan margin. F4 penting untuk dokumen Indonesia.

### Gambar

- `/kompres-gambar`: target kualitas atau target ukuran (mis. "di bawah
  200 KB", kebutuhan umum form pendaftaran), banyak file sekaligus,
  unduh ZIP.
- `/ubah-ukuran-gambar`: resize berdasarkan piksel atau persen, preset
  ukuran pas foto (2x3, 3x4, 4x6) dengan crop.
- `/konversi-gambar`: JPG, PNG, WebP, AVIF, dan HEIC ke JPG.

### Umum

- Komponen dropzone, daftar file, progress, dan tombol unduh dipakai
  bersama oleh semua tool di atas.
- Metadata EXIF (termasuk lokasi GPS) dihapus secara default saat
  kompres/konversi, dengan penjelasan singkat.

## Monetisasi

Tool utilitas file punya volume trafik paling tinggi dan pengguna yang
kembali berulang, tapi niat belinya rendah. Model yang cocok adalah iklan
volume tinggi plus affiliate ringan. Mengikuti aturan hub di Story 20.

- **Iklan display** di area tunggu (saat file diproses) dan di bawah
  tombol unduh. Tidak boleh ada iklan yang mirip tombol unduh (pola
  menipu yang umum di situs sejenis).
- **Affiliate kontekstual:** cloud storage, Canva atau editor desain,
  jasa cetak online (setelah gambar-ke-PDF atau pas foto), toko printer
  dan kertas di marketplace.
- **Tidak ada fitur berbayar** untuk batas ukuran atau jumlah file: semua
  proses di perangkat pengguna, jadi membatasi demi upsell terasa tidak
  jujur dan biayanya nol bagi kita.
- **Donasi** muncul setelah unduhan berhasil (teks kecil, bukan popup).

## Out of scope

- Kompres PDF (ukuran PDF yang benar-benar mengecil butuh render ulang
  gambar di dalamnya; kandidat story lanjutan setelah tool di atas stabil).
- OCR, edit teks PDF, tanda tangan PDF, konversi PDF ke Word.
- Hapus background foto (butuh model ML, terlalu berat untuk tahap ini).

## Acceptance Criteria

- [ ] Tab Network tidak menunjukkan request apa pun yang membawa isi file,
      untuk setiap tool.
- [ ] Tool tetap berfungsi setelah halaman dimuat lalu jaringan diputus.
- [ ] Bundle JS halaman index tools tidak bertambah signifikan (WASM hanya
      dimuat di halaman tool terkait); ukuran sebelum/sesudah dicatat di PR.
- [ ] Diuji di Chrome Android dan Safari iOS: gabung 5 PDF masing-masing
      sekitar 5 MB, kompres 20 foto dari kamera HP, konversi HEIC dari
      iPhone.
- [ ] Mode target ukuran menghasilkan file di bawah target untuk foto
      kamera biasa.
- [ ] Data GPS EXIF hilang dari hasil kompres/konversi (diverifikasi
      dengan pembaca EXIF).
- [ ] Setiap tool muncul di registry, punya meta/JSON-LD, masuk sitemap.
- [ ] `nx lint`, `nx test`, dan e2e dasar (pakai file fixture kecil) lulus.
