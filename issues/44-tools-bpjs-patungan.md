# Story 44: Iuran BPJS Kesehatan Mandiri dan Kalkulator Patungan (Split Bill)

**Apps touched:** `enem-landing-tools`, `enem-landing-api` (seed registry)

**Depends on:** Story 20, Story 25

## Background

Dua tool kecil dengan pola pencarian berbeda: iuran dan denda BPJS
Kesehatan mandiri dicari terus, sementara kalkulator patungan mudah viral
karena hasilnya dibagikan ke grup.

## Goal

1. `/iuran-bpjs-kesehatan`: iuran per kelas untuk satu keluarga, tunggakan,
   dan denda pelayanan.
2. `/kalkulator-patungan`: bagi tagihan makan/liburan dengan pajak,
   service, diskon, dan item per orang.

## Keputusan awal

1. **Iuran per kelas dan aturan denda sebagai data** (Perpres terkait,
   termasuk perubahan sistem kelas/KRIS bila sudah berlaku), dicek ulang
   saat implementasi.
2. **Patungan:** hasil dibagikan sebagai teks rapi untuk WhatsApp (tanpa
   menyimpan data di server) dan lewat link berbagi fragment Story 20.
   Nama orang hanya ada di perangkat.

## Scope

- BPJS: jumlah anggota keluarga per kelas, bulan tunggakan, hasil iuran per
  bulan, total tunggakan, dan estimasi denda pelayanan rawat inap bila
  berlaku.
- Patungan: daftar orang, item per orang atau dibagi rata, pajak/service
  persen, diskon/voucher, ongkir; hasil per orang, pembulatan, teks siap
  kirim.
- FAQ, JSON-LD.

## Monetisasi

AdSense dan donasi.

## Out of scope

- Cek status kepesertaan BPJS (butuh sistem BPJS).
- Pembayaran atau penagihan antar anggota grup.

## Acceptance Criteria

- [ ] Unit test iuran dan denda sesuai aturan yang dicantumkan.
- [ ] Unit test patungan: pembagian item, pajak proporsional, pembulatan
      yang totalnya tetap sama dengan tagihan.
- [ ] Muncul di registry (Story 25), punya meta/JSON-LD, masuk sitemap.
- [ ] Tidak ada request jaringan yang membawa nilai input pengguna.
- [ ] `nx lint`, `nx test`, dan e2e dasar (buka halaman, isi input, hasil muncul) lulus.
