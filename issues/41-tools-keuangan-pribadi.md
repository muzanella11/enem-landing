# Story 41: Kalkulator Keuangan Pribadi (Deposito, Tabungan, Investasi Rutin, Dana Darurat, Dana Pensiun)

**Status:** Done (2026-11-06). Catatan: rumus di `app/utils/finance/` diuji terhadap definisi FV/PV/PMT spreadsheet (nilai acuan dihitung ulang, belum dibandingkan langsung di Excel/Sheets). Pajak bunga 20% (PP 131/2000) dan batas bebas pajak Rp7,5 juta; tingkat bunga penjaminan LPS tidak ditulis angkanya karena berubah berkala, halaman mengarahkan ke situs LPS. Pedoman dana darurat (6/9/12 bulan, +3 untuk penghasilan tidak tetap) adalah pedoman umum, bukan aturan.

**Apps touched:** `enem-landing-tools`, `enem-landing-api` (seed registry)

**Depends on:** Story 20, Story 25

## Background

Kalkulator perencanaan keuangan punya nilai iklan tinggi (topik investasi
dan perbankan) dan cocok dengan pengunjung kalkulator gaji. Semuanya
hitungan bunga majemuk yang bisa diuji dengan rumus standar.

## Goal

Lima tool: `/kalkulator-deposito`, `/kalkulator-tabungan` (target
menabung), `/kalkulator-investasi` (investasi rutin/DCA dengan bunga
majemuk), `/kalkulator-dana-darurat`, `/kalkulator-dana-pensiun`.

## Keputusan awal

1. **Pajak bunga deposito** (PPh final atas bunga) dan batas penjaminan
   LPS sebagai data dengan sumber; deposito di bawah ambang tertentu bisa
   tidak dikenai pajak (dicek ulang saat implementasi).
2. **Asumsi selalu terlihat:** imbal hasil, inflasi, dan kenaikan
   pengeluaran adalah input dengan nilai bawaan yang dijelaskan, bukan
   janji hasil. Tool tidak merekomendasikan produk investasi.
3. Fungsi murni di `app/utils/finance/`: nilai masa depan, nilai sekarang,
   anuitas, bunga majemuk dengan frekuensi berbeda, penyesuaian inflasi.

## Scope

- Deposito: nominal, tenor, bunga, pajak, ARO; hasil bunga bersih.
- Tabungan: target, waktu, setoran awal; hasil setoran bulanan yang
  dibutuhkan.
- Investasi rutin: setoran per bulan, durasi, imbal hasil; grafik
  pertumbuhan, nilai riil setelah inflasi.
- Dana darurat: pengeluaran bulanan, status (lajang/menikah/tanggungan),
  rekomendasi 3 sampai 12 bulan dengan penjelasan.
- Dana pensiun: usia sekarang dan pensiun, pengeluaran, inflasi; dana yang
  dibutuhkan dan setoran per bulan.
- FAQ, JSON-LD, cross-link ke kalkulator gaji.

## Monetisasi

AdSense dan donasi. Blokir investasi bodong, robot trading, dan kripto
berisiko tinggi.

## Out of scope

- Rekomendasi produk, perbandingan bunga bank riil, affiliate.

## Acceptance Criteria

- [ ] Unit test tiap rumus dicocokkan dengan fungsi FV/PV/PMT spreadsheet.
- [ ] Disclaimer "bukan nasihat investasi" tampil di dekat hasil.
- [ ] Muncul di registry (Story 25), punya meta/JSON-LD, masuk sitemap.
- [ ] Tidak ada request jaringan yang membawa nilai input pengguna.
- [ ] `nx lint`, `nx test`, dan e2e dasar (buka halaman, isi input, hasil muncul) lulus.

## Referensi perhitungan

Dasar perhitungan dan data yang dipakai tool ini (dicek 2026-11-06):

- Rumus nilai waktu uang: FV, PV, PMT dengan pembayaran akhir periode (setara fungsi spreadsheet), bunga bulanan efektif (1 + r)^(1/12) - 1, dan nilai riil setelah inflasi.
- PPh final 20% atas bunga deposito dan tabungan: PP 131/2000. https://peraturan.bpk.go.id/Details/52916/pp-no-131-tahun-2000
- Batas tidak dipotong pajak Rp7.500.000: KMK 51/KMK.04/2001.
- Penjaminan LPS Rp2 miliar per nasabah per bank (UU 24/2004 dan PP 66/2008) dengan syarat bunga tidak melebihi tingkat bunga penjaminan LPS. https://lps.go.id/
- Dana darurat 6/9/12 bulan pengeluaran: pedoman umum perencanaan keuangan, bukan aturan.
- Data di kode: `app/data/keuangan/index.ts`, `app/utils/finance/index.ts`.
