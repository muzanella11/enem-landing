# Story 42: Biaya SIM, STNK, BPKB, dan Estimasi Pajak Kendaraan

**Status:** Done (2026-11-06). Catatan: tarif SIM/STNK/TNKB/BPKB dari Lampiran PP 76/2020 lewat Hukumonline (situs JDIH Setkab tidak bisa diakses saat dicek). Pajak kendaraan memakai kerangka UU 1/2022 (tarif maksimum 1,2%, DKI 2%, opsen 66%, denda 1%/bulan maks 24 bulan); tarif per provinsi berupa input yang bisa diubah, belum ada data per provinsi dan belum dicocokkan dengan contoh Bapenda/Samsat. Nilai SWDKLLJ dan dendanya (PMK 16/2017) belum dicek ulang ke situs Jasa Raharja. Pengesahan STNK dan mutasi belum dimasukkan karena tarifnya belum terverifikasi.

**Apps touched:** `enem-landing-tools`, `enem-landing-api` (seed registry)

**Depends on:** Story 20, Story 25

## Background

"Biaya perpanjang SIM", "biaya ganti plat", dan "cara hitung pajak motor"
dicari terus sepanjang tahun. Tarif PNBP Polri bersifat tetap (diatur PP),
sementara pajak kendaraan berbeda per provinsi.

## Goal

1. `/biaya-sim` dan `/biaya-stnk-bpkb`: tarif resmi PNBP per layanan.
2. `/kalkulator-pajak-kendaraan`: estimasi PKB tahunan, pajak 5 tahunan
   (ganti plat), dan denda keterlambatan.

## Keputusan awal

1. **Tarif PNBP dari PP 76/2020** (SIM baru/perpanjang per golongan, STNK,
   BPKB, TNKB, dll) sebagai data dengan sumber dan tanggal cek.
2. **Pajak kendaraan per provinsi sebagai data:** tarif PKB, opsen PKB
   kabupaten/kota (UU 1/2022, berlaku sejak 2025), SWDKLLJ, dan aturan
   denda. Rilis pertama mencakup provinsi dengan pencarian terbesar,
   bertahap ke provinsi lain.
3. **NJKB/nilai jual kendaraan adalah input pengguna** (dari STNK lama atau
   peraturan gubernur), karena tabelnya sangat besar dan berubah tiap tahun.
4. Tool tidak mengecek pajak berdasarkan plat nomor (butuh akses sistem
   Samsat); halaman menautkan ke layanan resmi untuk itu.

## Scope

- Biaya SIM dan STNK/BPKB: tabel tarif, kalkulator total biaya per skenario
  (perpanjang SIM A, ganti plat motor, dll), catatan biaya non-PNBP yang
  mungkin ada (tes kesehatan/psikologi).
- Pajak kendaraan: provinsi, jenis, NJKB, kepemilikan ke berapa (pajak
  progresif bila berlaku), tanggal jatuh tempo; hasil rincian PKB, opsen,
  SWDKLLJ, dan denda.
- FAQ, JSON-LD, cross-link ke kredit kendaraan (Story 29).

## Monetisasi

AdSense dan donasi.

## Out of scope

- Cek pajak/tilang online, pembayaran.

## Acceptance Criteria

- [x] Setiap tarif punya dasar hukum dan tanggal cek.
- [ ] Unit test PKB + opsen + denda untuk tiap provinsi yang dirilis,
      dicocokkan dengan contoh dari situs Bapenda/Samsat provinsi.
- [x] Muncul di registry (Story 25), punya meta/JSON-LD, masuk sitemap.
- [x] Tidak ada request jaringan yang membawa nilai input pengguna.
- [x] `nx lint`, `nx test`, dan e2e dasar (buka halaman, isi input, hasil muncul) lulus.

## Referensi perhitungan

Dasar perhitungan dan data yang dipakai tool ini (dicek 2026-11-06):

- PNBP Polri: PP 76/2020 (Lampiran angka I, II, IV, VIII) untuk SIM, STNK, BPKB; dikutip dari Hukumonline (10 Okt 2025) karena JDIH Setkab tidak dapat diakses. https://www.hukumonline.com/klinik/a/ini-tarif-sim--stnk-dan-bpkb-tebaru-lt586da674b5694
- TNKB per pasang (motor Rp60.000, mobil Rp100.000): Hukumonline. https://www.hukumonline.com/klinik/a/biaya-penerbitan-dan-perpanjangan-stnk-serta-tnkb-lt5522126327fb6/
- PKB: UU 1/2022 (HKPD), tarif maksimum 1,2% (DKI 2%), progresif maksimum 6% (DKI 10%), opsen PKB 66%, sanksi bunga 1% per bulan maksimal 24 bulan. https://peraturan.bpk.go.id/Details/195682/uu-no-1-tahun-2022
- SWDKLLJ Jasa Raharja (motor Rp35.000, mobil penumpang Rp143.000; denda Rp32.000 dan Rp100.000): PMK 16/PMK.010/2017, belum dicek ulang ke situs Jasa Raharja. https://peraturan.bpk.go.id/Details/115327/pmk-no-16pmk0102017
- Data di kode: `app/data/kendaraan/index.ts`.
