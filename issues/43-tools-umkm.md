# Story 43: Kalkulator UMKM (HPP, Harga Jual, Margin, Titik Impas, Fee Marketplace, PPh Final 0,5%)

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

- [ ] Unit test tiap kalkulator, termasuk batas omzet bebas pajak PPh UMKM.
- [ ] Preset fee marketplace menampilkan tanggal cek dan tautan sumber.
- [ ] Muncul di registry (Story 25), punya meta/JSON-LD, masuk sitemap.
- [ ] Tidak ada request jaringan yang membawa nilai input pengguna.
- [ ] `nx lint`, `nx test`, dan e2e dasar (buka halaman, isi input, hasil muncul) lulus.
