# Story 55: Kalkulator PPN, PPh 23/4(2), dan Simulasi SPT Tahunan

**Apps touched:** `enem-landing-tools`, `enem-landing-api` (seed registry)

**Depends on:** Story 20 (fungsi PPh 21), Story 24 (invoice), Story 25, Story 43 (UMKM)

## Background

"Cara hitung PPN", "PPN 12%", "harga sebelum PPN", "PPh 23 jasa", "pajak
sewa", dan "SPT tahunan kurang bayar" dicari terus oleh pelaku usaha dan
karyawan, dengan puncak saat musim SPT (Januari sampai Maret). Topik pajak
dan akuntansi punya tarif iklan baik, dan fungsi PPh 21 sudah ada di
Story 20.

## Goal

1. `/kalkulator-ppn`: PPN dari harga sebelum pajak, harga termasuk PPN ke
   harga sebelum PPN (DPP), dan perhitungan dengan DPP nilai lain bila
   berlaku.
2. `/kalkulator-pph-23` dan `/kalkulator-pph-sewa`: potongan PPh 23 atas
   jasa, dividen, royalti, bunga, dan PPh final 4 ayat (2) atas sewa
   tanah/bangunan, termasuk tarif tanpa NPWP/NIK bila ada.
3. `/simulasi-spt-tahunan`: SPT tahunan orang pribadi karyawan (satu atau
   dua pemberi kerja), penghasilan lain, dan hasil kurang bayar, lebih
   bayar, atau nihil.

## Keputusan awal

1. **Tarif sebagai data dengan sumber** (`app/data/tax/`): tarif PPN dan
   ketentuan DPP nilai lain yang berlaku (UU HPP dan peraturan
   turunannya), tarif PPh 23 dan PPh final sewa, serta tarif Pasal 17 dan
   PTKP (dipakai bersama Story 20). Semua dicek ulang dari situs DJP dan
   JDIH Kemenkeu saat implementasi, dengan tanggal cek.
2. **SPT memakai fungsi Story 20** (`calculateYear`, tarif Pasal 17, PTKP)
   untuk menghitung PPh setahun dari bukti potong 1721-A1; tidak ditulis
   ulang.
3. **Kasus dua pemberi kerja dan penghasilan tambahan** dijelaskan
   langkah demi langkah karena ini sumber kurang bayar yang paling sering
   ditanyakan.
4. Bukan konsultasi pajak; disclaimer tampil di dekat hasil, dengan
   tautan ke layanan resmi DJP untuk pelaporan.

## Scope

- PPN: harga, mode (belum/sudah termasuk PPN), jenis barang/jasa bila
  memengaruhi DPP; hasil DPP, PPN, dan total; bisa menyalin rincian ke
  invoice (Story 24).
- PPh 23/sewa: nilai bruto, jenis penghasilan, status NPWP; hasil
  potongan dan yang diterima.
- SPT: penghasilan bruto dan PPh 21 terpotong per pemberi kerja (dari
  bukti potong), penghasilan lain, status PTKP, zakat/sumbangan yang
  boleh dikurangkan; hasil PPh terutang setahun, kredit pajak, dan status
  kurang/lebih bayar dengan penjelasan.
- FAQ, sumber, JSON-LD, cross-link ke kalkulator gaji, PPh UMKM, dan
  invoice.

## Monetisasi

AdSense (pajak, akuntansi, software) dan donasi.

## Out of scope

- Pengisian atau pelaporan SPT ke sistem DJP.
- SPT badan, PPN masa, dan e-Faktur.

## Acceptance Criteria

- [ ] Setiap tarif punya dasar hukum dan tanggal cek di halaman.
- [ ] Unit test PPN dua arah (termasuk DPP nilai lain bila berlaku), tiap
      jenis PPh 23 dan sewa dengan/tanpa NPWP, dan SPT: satu pemberi kerja
      (nihil), dua pemberi kerja (kurang bayar), penghasilan lain, dan
      lebih bayar.
- [ ] Minimal 3 skenario SPT dicocokkan dengan contoh resmi DJP dan dicatat
      di PR.
- [ ] Tidak ada request jaringan yang membawa nilai input pengguna (diuji
      e2e).
- [ ] Muncul di registry (Story 25), punya meta/JSON-LD, masuk sitemap.
- [ ] `nx lint`, `nx test`, dan e2e dasar lulus.
- [ ] Bagian "Referensi perhitungan" di file ini diisi saat story selesai.
