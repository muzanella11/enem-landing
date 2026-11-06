# Story 55: Kalkulator PPN, PPh 23/4(2), dan Simulasi SPT Tahunan

**Status:** Done (2026-11-06). Catatan: empat tool (`/kalkulator-ppn`, `/kalkulator-pph-23`, `/kalkulator-pph-sewa`, `/simulasi-spt-tahunan`). PPN memakai tarif 12% dengan DPP nilai lain 11/12 untuk nonmewah (PMK 131/2024, dikonfirmasi lewat DDTC dan DJP); DPP nilai lain atau besaran tertentu lain (PMK 11/2025) belum dimasukkan. SPT memakai `getPtkp` dan `pasal17Tax` dari Story 20, dengan input penghasilan neto dan PPh 21 dari tiap bukti potong 1721-A1, PKP dibulatkan ke bawah ke ribuan. Tarif PPh 23 dan PPh sewa ditulis dari UU PPh dan PP 34/2017 (dokumen belum dibuka langsung). Belum dicocokkan dengan contoh resmi DJP. Saat mengerjakan story ini ditemukan dan diperbaiki bug Story 25: saat API mati, snapshot registry membuat tool nonaktif (mis. waris) tampil sebagai aktif, terindeks, dan masuk sitemap.

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

- [x] Setiap tarif punya dasar hukum dan tanggal cek di halaman.
- [x] Unit test PPN dua arah (termasuk DPP nilai lain bila berlaku), tiap
      jenis PPh 23 dan sewa dengan/tanpa NPWP, dan SPT: satu pemberi kerja
      (nihil), dua pemberi kerja (kurang bayar), penghasilan lain, dan
      lebih bayar.
- [ ] Minimal 3 skenario SPT dicocokkan dengan contoh resmi DJP dan dicatat
      di PR.
- [x] Tidak ada request jaringan yang membawa nilai input pengguna (diuji
      e2e).
- [x] Muncul di registry (Story 25), punya meta/JSON-LD, masuk sitemap.
- [x] `nx lint`, `nx test`, dan e2e dasar lulus.
- [x] Bagian "Referensi perhitungan" di file ini diisi saat story selesai.

## Referensi perhitungan

Dasar perhitungan dan data yang dipakai tool ini (dicek 2026-11-06):

- PPN 12% (UU 7/2021 HPP) dan DPP nilai lain 11/12 untuk barang/jasa nonmewah, 12% penuh untuk barang mewah (PMK 131/2024).
  - DDTC: tarif efektif setelah PPN 12%. https://news.ddtc.co.id/literasi/kamus/1807955/memahami-sekilas-soal-tarif-efektif-setelah-ppn-12-berlaku
  - DJP: PMK 131/2024. https://www.pajak.go.id/index.php/en/node/113886
- PPh Pasal 23: 2% jasa dan sewa harta selain tanah/bangunan, 15% dividen, bunga, royalti, hadiah; tarif 100% lebih tinggi tanpa NPWP (UU 36/2008 Pasal 23). https://peraturan.bpk.go.id/Details/39704/uu-no-36-tahun-2008
- PPh final 10% atas sewa tanah dan/atau bangunan (PP 34/2017). https://peraturan.bpk.go.id/Details/64646/pp-no-34-tahun-2017
- SPT tahunan: tarif Pasal 17 (UU 7/2021 HPP), PTKP, dan bukti potong 1721-A1 (PMK 168/2023), memakai fungsi Story 20; zakat lewat BAZNAS/LAZ mengurangi penghasilan bruto (PP 60/2010). https://peraturan.bpk.go.id/Details/185162/uu-no-7-tahun-2021 dan https://peraturan.bpk.go.id/Details/5110/pp-no-60-tahun-2010
- Kode: `app/data/tax/usaha.ts`, `app/utils/pajak-usaha.ts`.
