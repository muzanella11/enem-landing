# Story 38: Harga Emas Hari Ini dan Kalkulator Emas

**Status:** Done (2026-11-06). Catatan: riwayat harga dicatat harian oleh enem-landing-api mulai 2026-11-06, jadi grafik terisi bertahap; ketentuan pemakaian gold-api.com dan exchangerate-api.com belum dicek.

**Apps touched:** `enem-landing-tools`, `enem-landing-api` (seed registry)

**Depends on:** Story 22 (server route `/api/harga-emas`), Story 25

## Background

"Harga emas hari ini" adalah salah satu pencarian keuangan dengan volume
terbesar dan pengunjung kembali setiap hari. Story 22 sudah punya server
route harga emas (spot internasional x kurs, cache 6 jam), sehingga halaman
ini sebagian besar memakai ulang yang ada.

## Goal

1. `/harga-emas`: harga emas spot per gram dalam rupiah, beberapa satuan
   (gram, 5 g, 10 g, 25 g, 50 g, 100 g), dan grafik riwayat.
2. `/kalkulator-emas`: konversi gram ke rupiah dan sebaliknya, nilai
   perhiasan berdasarkan karat, dan untung/rugi investasi emas.

## Keputusan awal

1. **Jujur soal jenis harga:** yang ditampilkan adalah harga spot
   internasional yang dikonversi ke rupiah. Harga jual emas batangan (mis.
   Antam) dan harga buyback biasanya berbeda; pengguna bisa memasukkan
   harga toko/butik sendiri. Ketentuan pemakaian sumber data dicek ulang
   (lanjutan pertanyaan terbuka Story 22).
2. **Riwayat harga** disimpan server-side (satu nilai per hari di Redis
   atau tabel kecil di `enem-landing-api`), karena sumber gratis tidak
   menyediakan riwayat. Hanya harga yang disimpan, tidak ada data pengguna.
3. **Kemurnian karat sebagai data:** 24K = 99,9%, 23K, 22K = 91,6%,
   18K = 75%, 17K, 16K, dan kadar emas muda yang lazim di Indonesia, dengan
   catatan bahwa toko bisa memakai kadar berbeda.

## Scope

- Harga hari ini, perubahan dari kemarin, grafik 30/90/365 hari (setelah
  riwayat terkumpul), waktu update, sumber.
- Kalkulator: gram ke rupiah, rupiah ke gram, perhiasan (gram x kadar x
  harga, dikurangi ongkos), investasi (harga beli, jumlah, harga sekarang).
- Cross-link ke zakat maal (Story 22).

## Monetisasi

AdSense (topik investasi bernilai iklan tinggi) dan donasi. Blokir kategori
investasi bodong dan robot trading.

## Out of scope

- Harga Antam/butik resmi otomatis (bila kelak ada sumber yang boleh
  dipakai, jadi story terpisah).
- Jual beli emas atau tautan affiliate (ditunda, Story 20).

## Acceptance Criteria

- [ ] Halaman selalu menyebut jenis harga (spot) dan waktu update.
- [ ] Riwayat harga tercatat sekali per hari tanpa duplikat; bila sumber
      gagal, halaman memakai harga terakhir dengan label.
- [ ] Unit test kalkulator karat, konversi, dan untung/rugi.
- [ ] Muncul di registry (Story 25), punya meta/JSON-LD, masuk sitemap.
- [ ] Tidak ada request jaringan yang membawa nilai input pengguna.
- [ ] `nx lint`, `nx test`, dan e2e dasar (buka halaman, isi input, hasil muncul) lulus.

## Referensi perhitungan

Dasar perhitungan dan data yang dipakai tool ini (dicek 2026-11-06):

- Harga spot emas (XAU/USD): gold-api.com, dicatat harian oleh API sejak 2026-11-06. https://gold-api.com/
- Kurs USD/IDR: exchangerate-api.com. https://www.exchangerate-api.com/
- 1 troy ounce = 31,1034768 gram.
- Kadar karat: kemurnian teoretis karat/24 (24K 99,9%, 22K 91,6%, dan seterusnya); kadar toko emas muda bisa berbeda dan bisa diubah pengguna.
- Data di kode: `app/data/emas/karat.ts`.
