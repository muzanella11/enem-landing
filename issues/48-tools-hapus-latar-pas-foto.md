# Story 48: Hapus Latar Foto dan Pas Foto Latar Merah/Biru

**Status:** Done untuk kode (2026-11-06), sebagian kriteria belum terpenuhi. Catatan: model MediaPipe Selfie Segmentation (paket npm `@mediapipe/selfie_segmentation` 0.1.1675465747, lisensi Apache-2.0 menurut package.json; paket tidak menyertakan file LICENSE sendiri) di-host sendiri di `/mediapipe/selfie/` dengan cache 1 tahun. Unduhan saat halaman dipakai: JS loader 44 KB + 276 KB, wasm SIMD 5,7 MB, model 249 KB. Kode halaman yang memanggil model hanya chunk 6,7 KB dan halaman lain tidak memuat model (diuji e2e). E2e memproses gambar sintetis di Chromium, Firefox, WebKit headless; **belum diuji dengan foto orang sungguhan** dan belum di Chrome Android/Safari iOS, jadi kualitas potongan rambut dan waktu proses belum tercatat. Deteksi wajah tidak dipakai; crop pas foto memakai kotak orang dari mask (puncak kepala sekitar 10% dari atas). Warna merah/biru adalah preset umum, bukan standar resmi.

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

## Referensi perhitungan

Dasar perhitungan dan data yang dipakai tool ini (dicek 2026-11-06):

- Model segmentasi: MediaPipe Selfie Segmentation (Google), lisensi Apache-2.0, paket npm `@mediapipe/selfie_segmentation`. https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/selfie_segmentation.md dan https://www.npmjs.com/package/@mediapipe/selfie_segmentation
- Komposit: out = foto x alpha + latar x (1 - alpha), alpha dari mask dengan smoothstep 0,35-0,65 untuk tepi halus.
- Ukuran pas foto 2x3, 3x4, 4x6 cm pada 300 dpi (sama dengan Story 23); konversi px = cm / 2,54 x 300.
- Kertas cetak 4R = 10,2 x 15,2 cm (ukuran cetak foto umum), A4 = 21 x 29,7 cm (ISO 216); jarak antarfoto 0,3 cm.
- Kode: `app/utils/files/latar.ts`, `app/composables/use-segmentasi.ts`, `app/components/LatarFoto.vue`.
