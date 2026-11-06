# Story 53: Simulasi Gadai Emas dan Cicil Emas

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

- [ ] Setiap tarif punya sumber resmi penyelenggara dan tanggal cek di
      halaman.
- [ ] Unit test sewa modal per periode (tepat di batas periode dan
      satu hari sesudahnya), tiap golongan pinjaman, biaya admin, dan
      cicilan emas; minimal 3 skenario dicocokkan dengan simulasi resmi
      penyelenggara dan dicatat di PR.
- [ ] Taksiran yang memakai harga Story 38 diberi label perkiraan.
- [ ] Tidak ada request jaringan yang membawa nilai input pengguna (diuji
      e2e).
- [ ] Muncul di registry (Story 25), punya meta/JSON-LD, masuk sitemap.
- [ ] `nx lint`, `nx test`, dan e2e dasar lulus.
- [ ] Bagian "Referensi perhitungan" di file ini diisi saat story selesai.
