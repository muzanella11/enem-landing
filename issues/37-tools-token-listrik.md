# Story 37: Kalkulator Token Listrik PLN

**Status:** Done (2026-11-06). Catatan: tarif Triwulan IV 2026 dari pemberitaan (Kompas, CNBC, CNN), dokumen tariff adjustment PLN belum dicek langsung; pencocokan dengan struk token nyata belum dilakukan; pajak daerah default 3% dan bisa diubah pengguna.

**Apps touched:** `enem-landing-tools`, `enem-landing-api` (seed registry)

**Depends on:** Story 20, Story 25

## Background

"Token listrik 100 ribu dapat berapa kWh" dan variasinya dicari sepanjang
tahun. Jawabannya bergantung pada golongan tarif dan pajak daerah, dan
banyak orang bingung kenapa kWh yang didapat lebih kecil dari perkiraan.

## Goal

1. `/kalkulator-token-listrik`: nominal token ke kWh, dan kebutuhan kWh ke
   nominal token.
2. Halaman jawaban per nominal umum (`/token-listrik/[nominal]`, mis.
   20 ribu, 50 ribu, 100 ribu, 200 ribu, 500 ribu, 1 juta).
3. Estimasi biaya listrik bulanan dari daftar peralatan (watt x jam).

## Keputusan awal

1. **Tarif per golongan sebagai data per triwulan**
   (`app/data/listrik/tarif-YYYY-Qn.ts`) dari penetapan Kementerian ESDM /
   PLN, dengan sumber dan tanggal cek. Golongan rumah tangga (450 VA, 900 VA
   subsidi, 900 VA RTM, 1.300 sampai 2.200 VA, 3.500 VA ke atas) dulu.
2. **Pajak daerah atas tenaga listrik** (dulu PPJ, kini PBJT menurut
   UU 1/2022) berbeda per daerah: input dengan nilai bawaan yang dijelaskan,
   plus pilihan provinsi/kota bila datanya tersedia.
3. **Komponen yang dihitung** (dicek ulang saat implementasi): pajak
   daerah, PPN untuk golongan tertentu, biaya admin bank/aplikasi (input
   pengguna). Rumus dan urutannya ditulis sebagai fungsi murni dengan test.

## Scope

- Input: golongan/daya, nominal (atau kWh), daerah atau persen pajak, biaya
  admin.
- Output: kWh yang didapat, rincian potongan, harga per kWh efektif.
- Estimasi biaya bulanan dari daftar alat (preset alat umum dengan watt
  bawaan yang bisa diubah) dan berapa lama token bertahan.
- FAQ ("kenapa kWh lebih kecil", "beda subsidi dan non-subsidi"), JSON-LD.

## Monetisasi

AdSense dan donasi. Halaman per nominal menambah halaman terindeks.

## Out of scope

- Cek tagihan atau token berdasarkan ID pelanggan (butuh akses PLN).
- Tarif bisnis/industri di rilis pertama.

## Acceptance Criteria

- [ ] Unit test kWh untuk tiap golongan dan beberapa nominal, dicocokkan
      dengan contoh struk token nyata (dicatat di PR).
- [x] Sumber tarif, triwulan berlaku, dan tanggal cek tampil di halaman.
- [x] Muncul di registry (Story 25), punya meta/JSON-LD, masuk sitemap.
- [x] Tidak ada request jaringan yang membawa nilai input pengguna.
- [x] `nx lint`, `nx test`, dan e2e dasar (buka halaman, isi input, hasil muncul) lulus.

## Referensi perhitungan

Dasar perhitungan dan data yang dipakai tool ini (dicek 2026-11-06):

- Tarif listrik Triwulan IV 2026 per golongan: CNBC Indonesia (4 Nov 2026) dan Kompas (2 Nov 2026), belum dicocokkan ke struk token. https://www.cnbcindonesia.com/news/20261104072435-4-782094/resmi-daftar-tarif-listrik-pln-per-kwh-berlaku-hingga-desember-2026 dan https://money.kompas.com/read/2026/11/02/083952426/tarif-listrik-pln-november-2026-cek-daftar-lengkap-semua-golongan
- PLN: penyesuaian tarif tenaga listrik (tariff adjustment). https://web.pln.co.id/
- PPN 11% hanya untuk rumah tangga 6.600 VA ke atas (UU 7/2021 HPP); Pajak Penerangan Jalan/PBJT tenaga listrik per daerah (UU 1/2022, bawaan 3%).
- Data di kode: `app/data/listrik/tarif.ts`.
