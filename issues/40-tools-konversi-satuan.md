# Story 40: Konversi Satuan (Luas Tanah Lokal, Panjang, Berat, Volume, Suhu)

**Apps touched:** `enem-landing-tools`, `enem-landing-api` (seed registry)

**Depends on:** Story 20, Story 25

## Background

Pertanyaan seperti "1 tumbak berapa meter persegi" atau "1 bata berapa
meter" sangat sering dicari karena satuan luas tanah tradisional masih
dipakai dalam jual beli tanah, dan nilainya berbeda per daerah.

## Goal

1. `/konversi-luas-tanah` dengan satuan lokal (tumbak, bata, ubin, are,
   bau, hektar) dan satuan metrik.
2. `/konversi-satuan` untuk panjang, berat, volume, suhu, dan kecepatan.
3. Halaman jawaban per satuan lokal (mis. `/konversi-luas-tanah/tumbak`).

## Keputusan awal

1. **Satuan lokal sebagai data dengan variasi daerah**
   (`app/data/satuan/luas-lokal.ts`): tiap satuan punya nilai m² per
   daerah, daerah yang memakainya, sumber, dan catatan. Contoh yang harus
   diverifikasi: tumbak dan bata (Jawa Barat), ubin (Jawa Tengah/Timur),
   are (100 m²), bau (sekitar 7.000 m², bervariasi).
2. Bila satu satuan punya beberapa nilai, pengguna memilih daerah dan halaman
   menampilkan semua variasinya dengan jelas, bukan satu angka yang dianggap
   pasti.
3. Konversi metrik/imperial memakai faktor standar SI sebagai fungsi murni.

## Scope

- Konversi dua arah, banyak satuan sekaligus, salin hasil.
- Kalkulator luas tanah sederhana dari panjang x lebar (dan trapesium) lalu
  dikonversi ke satuan lokal.
- FAQ per satuan lokal, JSON-LD.

## Monetisasi

AdSense dan donasi. Cross-link ke simulasi KPR (Story 21) dan biaya properti
(Story 47).

## Out of scope

- Pengukuran luas dari peta/foto.

## Acceptance Criteria

- [ ] Setiap nilai satuan lokal punya sumber dan daerah berlaku.
- [ ] Unit test konversi dua arah dan presisi pembulatan.
- [ ] Muncul di registry (Story 25), punya meta/JSON-LD, masuk sitemap.
- [ ] Tidak ada request jaringan yang membawa nilai input pengguna.
- [ ] `nx lint`, `nx test`, dan e2e dasar (buka halaman, isi input, hasil muncul) lulus.
