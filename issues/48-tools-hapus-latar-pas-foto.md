# Story 48: Hapus Latar Foto dan Pas Foto Latar Merah/Biru

**Apps touched:** `enem-landing-tools`, `enem-landing-api` (seed registry)

**Depends on:** Story 23 (worker gambar, pas foto)

## Background

"Ganti background foto merah" dan "hapus background" punya volume sangat
tinggi dari pelamar CPNS, kerja, dan siswa. Story 23 sengaja menunda fitur
ini karena butuh model ML. Seperti tool lain, prosesnya harus di browser:
foto wajah adalah data pribadi.

## Goal

1. `/hapus-latar-foto`: hapus latar menjadi transparan (PNG) atau warna
   polos.
2. `/pas-foto-latar-merah-biru`: gabungan hapus latar + pas foto
   2x3/3x4/4x6 (Story 23) dengan latar merah, biru, atau putih.

## Keputusan awal

1. **Model berjalan di browser** (WebAssembly/WebGPU) dan dimuat lazy hanya
   di halaman ini. **Lisensi model dan library wajib dicek** sebelum
   memilih: beberapa model populer berlisensi non-komersial atau copyleft
   yang tidak cocok. Kandidat yang perlu dievaluasi: model segmentasi potret
   dengan lisensi permisif (mis. dari keluarga MediaPipe, Apache-2.0).
2. **Ukuran model dan performa di HP kelas menengah** menentukan pilihan;
   target waktu proses dan ukuran unduhan model dicatat di PR.
3. Model di-host sebagai aset statis milik sendiri (bukan CDN pihak ketiga
   yang bisa berubah), dengan cache browser panjang.
4. Hasil boleh dirapikan manual (kuas hapus/kembalikan) karena segmentasi
   rambut sering tidak sempurna.

## Scope

- Unggah foto, proses, pratinjau sebelum/sesudah, kuas koreksi, pilih latar
  (transparan, merah, biru, putih, kustom), unduh PNG/JPG.
- Pas foto: deteksi wajah untuk posisi crop otomatis (bila model
  mendukung), ukuran 2x3/3x4/4x6 di 300 dpi, unduh juga lembar cetak berisi
  beberapa pas foto di kertas 4R/A4.
- FAQ ("warna merah untuk apa, biru untuk apa"), JSON-LD.

## Monetisasi

Iklan di area tunggu saat model dimuat dan foto diproses (Story 23), tidak
pernah mirip tombol unduh. Donasi setelah unduhan. Tanpa fitur berbayar.

## Out of scope

- Edit wajah, filter kecantikan, atau penggantian pakaian.

## Acceptance Criteria

- [ ] Lisensi model dan library tercatat di PR dan boleh dipakai untuk situs
      ber-iklan.
- [ ] Foto tidak pernah meninggalkan perangkat (diuji e2e seperti Story 23).
- [ ] Diuji di Chrome Android dan Safari iOS; waktu proses dan ukuran model
      tercatat.
- [ ] Halaman lain di hub tidak ikut memuat model (ukuran bundle dicatat).
- [ ] Muncul di registry (Story 25), punya meta/JSON-LD, masuk sitemap.
- [ ] Tidak ada request jaringan yang membawa nilai input pengguna.
- [ ] `nx lint`, `nx test`, dan e2e dasar (buka halaman, isi input, hasil muncul) lulus.
