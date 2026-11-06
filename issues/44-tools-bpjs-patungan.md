# Story 44: Iuran BPJS Kesehatan Mandiri dan Kalkulator Patungan (Split Bill)

**Status:** Done (2026-11-06). Catatan: iuran mandiri masih tarif Perpres 64/2020 (kelas 1 Rp150.000, kelas 2 Rp100.000, kelas 3 Rp42.000, dibayar peserta Rp35.000) karena iuran KRIS belum ditetapkan per pengecekan; sumber berupa berita Agustus-September 2026, belum dicek ke situs BPJS. Denda pelayanan butuh biaya diagnosa awal dari rumah sakit, jadi berupa input opsional. Pajak restoran dihitung atas subtotal + service.

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

## Referensi perhitungan

Dasar perhitungan dan data yang dipakai tool ini (dicek 2026-11-06):

- Iuran PBPU/BP (mandiri): Perpres 64/2020 tentang Perubahan Kedua atas Perpres 82/2018 tentang Jaminan Kesehatan (kelas 1 Rp150.000, kelas 2 Rp100.000, kelas 3 Rp42.000 dengan subsidi pemerintah Rp7.000); KRIS lewat Perpres 59/2024 tanpa iuran baru per pengecekan.
  - Bisnis.com (1 Sep 2026): https://finansial.bisnis.com/read/20260901/215/2000251/kelas-1-2-3-segera-dihapus-simak-iuran-bpjs-kesehatan-sekarang-per-bulan-september-2026
  - CNBC Indonesia (2 Agu 2026): https://cnbcindonesia.com/news/20260802092453-4-755779/pemerintah-hapus-kelas-1-2-3-bpjs-kesehatan-ini-iuran-per-2-agustus
- Denda pelayanan: Perpres 64/2020, 5% x biaya diagnosa awal INA-CBG x bulan tertunggak (maks 12 bulan), maks Rp30 juta, untuk rawat inap dalam 45 hari setelah aktif kembali; tunggakan yang dibayar maks 24 bulan.
- Situs resmi: https://www.bpjs-kesehatan.go.id/
- Patungan: pembagian proporsional terhadap subtotal pesanan tiap orang, pajak dihitung atas subtotal + service, pembulatan largest remainder agar total tetap sama dengan tagihan.
- Data di kode: `app/data/bpjs-mandiri.ts`, `app/utils/bpjs-mandiri.ts`, `app/utils/patungan.ts`.
