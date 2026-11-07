# Story 43: Kalkulator UMKM (HPP, Harga Jual, Margin, Titik Impas, Fee Marketplace, PPh Final 0,5%)

**Status:** Done (2026-11-06). Catatan: PPh UMKM mengikuti PP 55/2022 yang diubah PP 20/2026 (berlaku 22 April 2026): hanya orang pribadi, perseroan perorangan, dan koperasi; Rp500 juta bebas pajak hanya untuk orang pribadi. Sumber berupa artikel DJP, IKPI, dan Kompas; teks PP 20/2026 belum dibaca langsung, dan jangka waktu per jenis WP tidak dihitung tool. Fee marketplace sengaja tanpa preset angka karena tarif berubah dan berbeda per kategori; halaman menautkan ke pusat edukasi penjual resmi, jadi kriteria "preset dengan tanggal cek" diganti dengan tautan sumber.

**Apps touched:** `enem-landing-tools`, `enem-landing-api` (seed registry)

**Depends on:** Story 20, Story 24, Story 25

## Background

Pelaku UMKM yang memakai invoice/kwitansi (Story 24) juga butuh menghitung
harga jual dan pajak. Topik bisnis punya nilai iklan yang baik, dan tool ini
saling menautkan dengan tool UMKM lain.

## Goal

Lima tool: `/kalkulator-hpp`, `/kalkulator-harga-jual` (markup dan
margin), `/kalkulator-bep`, `/kalkulator-fee-marketplace`,
`/kalkulator-pph-umkm`.

## Keputusan awal

1. **PPh final UMKM 0,5%** (PP 55/2022): batas omzet, omzet tidak kena pajak
   untuk WP orang pribadi, dan jangka waktu pemakaian tarif sebagai data
   dengan sumber (dicek ulang saat implementasi).
2. **Fee marketplace berubah sering**, jadi nilainya input pengguna dengan
   preset yang diberi tanggal cek dan tautan ke halaman resmi marketplace;
   tidak diklaim selalu terbaru.
3. Fungsi murni di `app/utils/umkm/`.

## Scope

- HPP: bahan baku, tenaga kerja, overhead per batch, jumlah produk; HPP per
  unit.
- Harga jual: dari HPP dengan target margin atau markup, beserta penjelasan
  beda margin dan markup.
- BEP: biaya tetap, harga jual, biaya variabel; unit dan rupiah titik impas.
- Fee marketplace: harga jual, kategori fee, ongkir subsidi, voucher;
  pendapatan bersih dan harga jual minimal agar untung.
- PPh UMKM: omzet bulanan, status WP; PPh final per bulan dan sisa omzet
  bebas pajak.
- FAQ, JSON-LD, cross-link ke invoice dan kwitansi.

## Monetisasi

AdSense dan donasi.

## Out of scope

- Pembukuan, laporan keuangan, stok (sudah out of scope Story 24).

## Acceptance Criteria

- [x] Unit test tiap kalkulator, termasuk batas omzet bebas pajak PPh UMKM.
- [ ] Preset fee marketplace menampilkan tanggal cek dan tautan sumber.
- [x] Muncul di registry (Story 25), punya meta/JSON-LD, masuk sitemap.
- [x] Tidak ada request jaringan yang membawa nilai input pengguna.
- [x] `nx lint`, `nx test`, dan e2e dasar (buka halaman, isi input, hasil muncul) lulus.

## Referensi perhitungan

Dasar perhitungan dan data yang dipakai tool ini (dicek 2026-11-06):

- PPh final 0,5%, batas omzet Rp4,8 miliar, dan omzet Rp500 juta bebas pajak untuk orang pribadi: PP 55/2022 Pasal 56, 57, 60, diubah PP 20/2026 (22 April 2026).
  - DJP (3 Jun 2026): https://pajak.go.id/node/119950
  - IKPI (29 Mei 2026): https://ikpi.or.id/resmi-pemerintah-perpanjang-fasilitas-pph-final-umkm-lewat-revisi-pp-55/
  - Kompas TV (3 Jun 2026), daftar WP yang berhak dan pengecualian jasa pekerjaan bebas: https://www.kompas.tv/ekonomi/672524/pemerintah-persempit-penerima-pph-final-umkm-0-5-persen-ini-daftar-wajib-pajak-yang-berhak
- HPP, margin (laba/harga jual), markup (laba/HPP), dan BEP (biaya tetap / (harga - biaya variabel)): rumus akuntansi biaya standar.
- Fee marketplace: input pengguna; halaman resmi Shopee Pusat Edukasi Penjual (https://seller.shopee.co.id/edu/), Tokopedia/TikTok Shop Seller University (https://seller-id.tokopedia.com/university), Lazada University (https://university.lazada.co.id/).
- Data di kode: `app/data/umkm/index.ts`, `app/utils/umkm/index.ts`.
