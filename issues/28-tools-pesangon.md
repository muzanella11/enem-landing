# Story 28: Kalkulator Pesangon

**Apps touched:** `enem-landing-tools`, `enem-landing-api` (seed registry)

**Depends on:** Story 20, Story 25, Story 26 (helper masa kerja dari THR)

## Background

Pencarian "hitung pesangon" melonjak setiap ada gelombang PHK, dan banyak
pekerja tidak tahu bahwa besarnya bergantung pada alasan PHK. Tool ini
melengkapi kelompok tool kerja (gaji, lembur, THR, upah minimum).

## Goal

Tool `/kalkulator-pesangon` yang menghitung uang pesangon (UP), uang
penghargaan masa kerja (UPMK), uang penggantian hak (UPH), dan PPh 21 final
atas pesangon.

## Aturan hitung (wajib diverifikasi ulang saat implementasi)

Rangkuman PP 35/2021 (turunan UU Cipta Kerja). Klaster ketenagakerjaan
UU 6/2023 sempat diuji di MK (putusan 168/PUU-XXI/2024); status aturan
pesangon terbaru wajib dicek sebelum rilis dan sumbernya dicantumkan.

- **UP** (Pasal 40 ayat 2): masa kerja < 1 tahun = 1 bulan upah; 1 sampai
  < 2 tahun = 2 bulan; dan seterusnya naik 1 bulan per tahun; 8 tahun atau
  lebih = 9 bulan upah.
- **UPMK** (Pasal 40 ayat 3): 3 sampai < 6 tahun = 2 bulan; 6 sampai < 9 =
  3; 9 sampai < 12 = 4; 12 sampai < 15 = 5; 15 sampai < 18 = 6; 18 sampai
  < 21 = 7; 21 sampai < 24 = 8; 24 tahun atau lebih = 10 bulan upah.
- **UPH:** cuti tahunan yang belum diambil, biaya pulang ke tempat
  diterima kerja, dan hal lain di perjanjian kerja (input pengguna).
- **Pengali per alasan PHK** (Pasal 41 s.d. 59), mis. efisiensi, perusahaan
  merugi, pailit, pensiun, meninggal, sakit berkepanjangan, mengundurkan
  diri. Tabel alasan dan pengali disimpan sebagai data, bukan di template.
- **Upah** = upah pokok + tunjangan tetap.
- **PPh 21 final pesangon** (PP 68/2009): 0% sampai Rp50 juta, 5% di atas
  Rp50 juta sampai Rp100 juta, 15% di atas Rp100 juta sampai Rp500 juta,
  25% di atas Rp500 juta (progresif per lapisan).

## Scope

- **Input:** tanggal mulai kerja dan tanggal PHK (atau masa kerja), upah
  pokok + tunjangan tetap, alasan PHK, sisa cuti, biaya pulang (opsional).
- **Output:** rincian UP, UPMK, UPH dengan pengalinya, total bruto, PPh 21
  final per lapisan, total bersih, dan penjelasan dasar hukum alasan PHK
  yang dipilih.
- Logika di `app/utils/payroll/pesangon.ts`, tabel di
  `app/data/pesangon/pp-35-2021.ts` dengan sumber dan tanggal cek.
- Cross-link ke kalkulator gaji, THR, dan upah minimum.
- Cara hitung, FAQ, JSON-LD, link berbagi via fragment, event standar.

## Monetisasi

AdSense dan donasi (Story 20). Audiens sedang kehilangan pekerjaan dan
rentan: daftar blokir kategori iklan (pinjol, judi, investasi bodong) wajib
aktif sebelum iklan dinyalakan di halaman ini.

## Out of scope

- PHK karyawan kontrak (PKWT) dan uang kompensasi PKWT (kandidat story
  lanjutan).
- Sengketa dan perhitungan di luar ketentuan minimum (perjanjian kerja
  bersama yang lebih baik dari aturan).

## Acceptance Criteria

- [ ] Unit test: tiap batas masa kerja UP dan UPMK (tepat di batas dan
      satu bulan di bawahnya), tiap alasan PHK, dan PPh final per lapisan.
- [ ] 3 skenario dicocokkan manual dengan contoh resmi atau kalkulator lain,
      dicatat di PR.
- [ ] Dasar hukum dan tanggal pengecekan tampil di halaman.
- [ ] Tidak ada request jaringan yang membawa nilai upah pengguna.
- [ ] Muncul di registry, meta/JSON-LD, sitemap; lint, test, e2e lulus.
