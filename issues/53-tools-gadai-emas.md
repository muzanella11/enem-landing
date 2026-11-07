# Story 53: Simulasi Gadai Emas dan Cicil Emas

**Status:** Done (2026-11-06). Catatan: dua tool (`/simulasi-gadai-emas` dengan mode gadai 120 hari dan gadai emas angsuran, `/simulasi-cicil-emas`). Pegadaian hanya mempublikasikan rentang (sewa modal 1%-1,2% per 15 hari, admin Rp2.000 sampai Rp125.000, rasio taksir 92%-95%, Krasida 1,25%-1,40% per bulan), bukan tabel golongan lengkap, jadi tarif berupa input dengan nilai bawaan dari rentang itu. Biaya admin hanya terisi otomatis untuk dua titik yang disebut resmi (pinjaman sampai Rp500.000 dan di atas Rp20 juta). Metode angsuran flat dicocokkan dengan simulasi Customer Care Pegadaian untuk produk BPKB (Rp1.916.667 dan Rp1.083.333), belum dengan simulasi Krasida sendiri. Bank syariah dan cicil emas Pegadaian belum punya data tarif; margin cicil emas diisi pengguna.

**Apps touched:** `enem-landing-tools`, `enem-landing-api` (seed registry)

**Depends on:** Story 20, Story 25, Story 38 (harga emas)

## Background

"Simulasi gadai emas", "gadai emas 10 gram dapat berapa", dan "cicil emas"
dicari sangat sering, terutama menjelang kebutuhan sekolah dan hari raya.
Topik pinjaman dan emas sama-sama punya tarif iklan baik, dan harga emas
harian sudah tersedia dari Story 38.

## Goal

1. `/simulasi-gadai-emas`: uang pinjaman yang bisa didapat dari emas yang
   digadaikan, sewa modal/biaya per periode, total tebusan, dan
   perbandingan tebus cepat vs tebus di akhir.
2. `/simulasi-cicil-emas`: cicilan per bulan untuk membeli emas batangan
   dengan uang muka dan tenor tertentu.

## Keputusan awal

1. **Tarif sebagai data dengan sumber** (`app/data/gadai/`): untuk
   Pegadaian (gadai konvensional dan syariah) dan beberapa bank syariah
   yang punya produk gadai/cicil emas: rasio pinjaman terhadap taksiran,
   sewa modal/ujrah per periode menurut golongan pinjaman, biaya
   administrasi, dan lama periode (mis. per 15 hari). Diambil dari halaman
   resmi masing-masing saat implementasi, dengan tanggal cek. Hanya
   penyelenggara berizin OJK.
2. **Taksiran emas** memakai harga taksiran resmi penyelenggara bila
   dipublikasikan; bila tidak, memakai harga emas Story 38 dikali kadar
   dengan label "perkiraan", dan selalu bisa diubah pengguna.
3. **Metode dihitung sesuai penjelasan resmi** (mis. sewa modal dihitung
   per periode berjalan, dibulatkan ke atas). Bila aturan rinci tidak
   dipublikasikan, ditandai sebagai perkiraan.
4. Tidak ada affiliate, tidak ada formulir pengajuan.

## Scope

- Gadai: berat, kadar/karat, jenis (perhiasan/batangan), penyelenggara,
  lama pinjam; hasil taksiran, maksimal pinjaman, biaya admin, sewa modal
  per periode, total tebusan, dan tabel bila ditebus di tiap periode.
- Cicil emas: berat/gram, harga per gram, uang muka, tenor, margin/biaya
  penyelenggara; hasil cicilan per bulan dan total bayar dibanding beli
  tunai.
- FAQ, sumber, JSON-LD, cross-link ke harga emas, kalkulator emas, dan
  simulasi KTA (Story 29) sebagai pembanding biaya pinjaman.

## Monetisasi

AdSense (pinjaman dan emas) dan donasi. Filter iklan memblokir gadai dan
pinjaman tidak berizin.

## Out of scope

- Cek harga taksiran langsung dari sistem penyelenggara.
- Investasi emas digital dan perbandingan produk.

## Acceptance Criteria

- [x] Setiap tarif punya sumber resmi penyelenggara dan tanggal cek di
      halaman.
- [ ] Unit test sewa modal per periode (tepat di batas periode dan
      satu hari sesudahnya), tiap golongan pinjaman, biaya admin, dan
      cicilan emas; minimal 3 skenario dicocokkan dengan simulasi resmi
      penyelenggara dan dicatat di PR.
- [x] Taksiran yang memakai harga Story 38 diberi label perkiraan.
- [x] Tidak ada request jaringan yang membawa nilai input pengguna (diuji
      e2e).
- [x] Muncul di registry (Story 25), punya meta/JSON-LD, masuk sitemap.
- [x] `nx lint`, `nx test`, dan e2e dasar lulus.
- [x] Bagian "Referensi perhitungan" di file ini diisi saat story selesai.

## Referensi perhitungan

Dasar perhitungan dan data yang dipakai tool ini (dicek 2026-11-06):

- Pegadaian, "Sistem Pembayaran di Pegadaian, Sudah Tahu Bedanya?" (26 Jul 2026) beserta jawaban Customer Care Pegadaian di halaman yang sama: KCA 120 hari dengan sewa modal 1%-1,2% per 15 hari, biaya admin Rp2.000-Rp125.000, rasio taksir 92%-95%; Krasida 1,25%-1,40% per bulan, rasio 95%, tenor 6-36 bulan; contoh angsuran flat Rp20 juta 1,25% (12 bulan Rp1.916.667, 24 bulan Rp1.083.333). https://pegadaian.co.id/artikel/keuangan/sistem-pembayaran-dan-bunga-di-pegadaian
- Periode sewa modal: hari ke-1 sampai ke-15 satu periode, dibulatkan ke atas per 15 hari.
- Taksiran = berat x kadar (Story 38) x harga per gram; harga spot dari Story 38 hanya sebagai perkiraan.
- Kode: `app/data/gadai/index.ts`, `app/utils/gadai.ts`.
