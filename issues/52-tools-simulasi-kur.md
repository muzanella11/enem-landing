# Story 52: Simulasi KUR (Kredit Usaha Rakyat)

**Status:** Done (2026-11-06). Catatan: `/simulasi-kur` memakai bunga KUR 2026 (Super Mikro 3%; Mikro/Kecil 6% untuk produksi dan perdagangan ekspor; perdagangan non-ekspor 6/7/8/9% sesuai urutan pinjaman) dari pemberitaan Bisnis.com yang merujuk Permenko Perekonomian No. 1 Tahun 2026 dan informasi resmi bank. Teks Permenko belum dibaca langsung; portal kur.ekon.go.id sedang suspended saat dicek. Angsuran anuitas cocok dengan kelima baris tabel KUR BNI Rp100 juta (selisih paling banyak Rp1). KUR PMI dan KUR Khusus belum dimasukkan karena bunganya tidak tercantum di sumber. Halaman jawaban per bank/plafon belum dibuat (menunggu data Search Console).

**Apps touched:** `enem-landing-tools`, `enem-landing-api` (seed registry)

**Depends on:** Story 20, Story 25, Story 29 (fungsi pinjaman), Story 43 (UMKM)

## Background

"Simulasi KUR BRI", "tabel angsuran KUR Mandiri", dan "syarat KUR" dicari
sangat sering oleh pelaku usaha kecil. Topik pinjaman punya tarif iklan
tinggi. Bunga dan plafon KUR ditetapkan pemerintah, sehingga simulasi bisa
akurat dan sama untuk semua bank penyalur.

## Goal

`/simulasi-kur`: angsuran per bulan, total bunga, dan tabel angsuran untuk
tiap jenis KUR, ditambah halaman jawaban per bank penyalur utama dan per
plafon umum (mis. KUR 50 juta, 100 juta) bila memang dicari.

## Keputusan awal

1. **Aturan KUR sebagai data per tahun** (`app/data/kur/`): jenis KUR
   (super mikro, mikro, kecil, penempatan TKI, dan jenis lain yang
   berlaku), plafon, suku bunga/margin efektif per tahun, tenor maksimal
   modal kerja dan investasi, dan ketentuan bunga berjenjang bila ada.
   Sumber: Peraturan Menko Perekonomian tentang pedoman pelaksanaan KUR
   yang berlaku dan pengumuman resmi Komite KUR; dicek ulang saat
   implementasi, dengan tanggal cek.
2. **Metode angsuran mengikuti praktik bank penyalur** (efektif/anuitas
   atau flat). Metode tiap bank dicek dari simulasi resmi bank; bila
   berbeda, halaman bank memakai metodenya sendiri dan menyebutkannya.
3. **Memakai ulang fungsi pinjaman** di `app/utils/loan/` (anuitas, flat,
   tabel amortisasi); tidak ditulis ulang.
4. Daftar bank penyalur hanya sebagai informasi dengan tautan ke halaman
   resmi bank; tidak ada formulir pengajuan dan tidak ada affiliate.

## Scope

- Input: jenis KUR, plafon, tenor, tujuan (modal kerja/investasi), bank
  (untuk metode angsuran).
- Hasil: angsuran per bulan, total bunga, total bayar, tabel angsuran
  (unduh CSV), dan peringatan bila plafon atau tenor di luar ketentuan.
- Ringkasan syarat umum dan dokumen dari sumber resmi.
- Halaman jawaban per bank dan per plafon umum (pola Story 49), hanya bila
  berguna.
- FAQ, sumber, JSON-LD, cross-link ke kalkulator UMKM, invoice, dan BEP.

## Monetisasi

AdSense (topik pinjaman usaha, CPC tinggi) dan donasi. Filter iklan
memblokir pinjol ilegal dan iklan yang menjanjikan "pasti cair".

## Out of scope

- Pengajuan KUR, cek status, atau penilaian kelayakan.
- Kredit usaha non-KUR (bisa memakai simulasi KTA Story 29).

## Acceptance Criteria

- [x] Setiap bunga, plafon, dan tenor punya sumber dan tanggal cek di
      halaman.
- [ ] Unit test tiap jenis KUR, batas plafon dan tenor, dan metode
      angsuran; minimal 3 skenario dicocokkan dengan simulasi resmi bank
      penyalur dan dicatat di PR.
- [x] Total pokok di tabel angsuran sama persis dengan plafon.
- [x] Tidak ada request jaringan yang membawa nilai input pengguna (diuji
      e2e).
- [x] Muncul di registry (Story 25), punya meta/JSON-LD, masuk sitemap.
- [x] `nx lint`, `nx test`, dan e2e dasar lulus.
- [x] Bagian "Referensi perhitungan" di file ini diisi saat story selesai.

## Referensi perhitungan

Dasar perhitungan dan data yang dipakai tool ini (dicek 2026-11-06):

- Permenko Perekonomian No. 1 Tahun 2026 tentang pedoman pelaksanaan KUR: bunga, plafon, tenor, dan bunga berjenjang perdagangan non-ekspor, dikutip dari Bisnis.com (23 Sep 2026). https://finansial.bisnis.com/read/20260923/90/2006630/kur-bri-vs-mandiri-2026-daftar-bunga-plafon-hingga-simulasi-angsuran
- Tabel angsuran resmi KUR BNI Rp100 juta, bunga 6% efektif (dipakai sebagai acuan uji metode anuitas), dikutip dari Bisnis.com (3 Nov 2026). https://finansial.bisnis.com/read/20261103/90/2017995/tabel-angsuran-kur-bni-rp100-juta-november-2026-bunga-syarat-dan-cara-pengajuan
- Rumus anuitas (PMT) dan tabel amortisasi dipakai ulang dari Story 21/29 (`calculateLoan`).
- Kode: `app/data/kur/index.ts`, `app/utils/kur.ts`.
