# Story 42: Biaya SIM, STNK, BPKB, dan Estimasi Pajak Kendaraan

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

- [ ] Setiap tarif punya dasar hukum dan tanggal cek.
- [ ] Unit test PKB + opsen + denda untuk tiap provinsi yang dirilis,
      dicocokkan dengan contoh dari situs Bapenda/Samsat provinsi.
- [ ] Muncul di registry (Story 25), punya meta/JSON-LD, masuk sitemap.
- [ ] Tidak ada request jaringan yang membawa nilai input pengguna.
- [ ] `nx lint`, `nx test`, dan e2e dasar (buka halaman, isi input, hasil muncul) lulus.
