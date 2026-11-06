# Story 21: Tool Simulasi KPR

**Status:** Done (2026-11-06). Catatan: pencocokan 3 skenario dengan kalkulator bank belum dicatat di PR.

**Apps touched:** `enem-landing-tools`

**Depends on:** Story 20 (fondasi tools hub)

## Background

Story 20 membangun `enem-landing-tools` di `tools.muzanella.com` beserta
registry tool, layout bersama, dan pola SEO per tool. Story ini menambah
tool kedua. Simulasi KPR banyak dicari, tapi kebanyakan kalkulator bank
hanya menampilkan cicilan bunga fixed, padahal yang sering bikin kaget
pembeli rumah adalah lonjakan cicilan saat masuk periode floating dan
biaya awal di luar DP.

## Goal

Tool `/simulasi-kpr` yang menghitung cicilan KPR bertahap (fixed lalu
floating), tabel amortisasi, total biaya awal, dan kelayakan cicilan
terhadap penghasilan. Semua hitungan client-side.

## Keputusan awal

1. **Metode anuitas** sebagai default (dipakai mayoritas KPR bank di
   Indonesia), dengan opsi metode efektif dan flat untuk perbandingan.
2. **Bunga berjenjang**: pengguna bisa menambah beberapa periode bunga
   (mis. 3 tahun fixed 3,5%, 2 tahun fixed 7%, sisanya floating 11%).
   Cicilan dihitung ulang tiap pergantian periode atas sisa pokok.
3. **Biaya awal** ditampilkan terpisah dengan nilai default yang bisa
   diubah: provisi, administrasi, appraisal, notaris/PPAT, asuransi jiwa
   dan kebakaran, BPHTB. NPOPTKP BPHTB berbeda per daerah, jadi jadi input
   dengan default yang dijelaskan sumbernya.
4. Logika hitung sebagai fungsi murni di `app/utils/loan/`, bisa dipakai
   ulang nanti untuk simulasi kredit kendaraan/KTA.

## Scope

- **Input:** harga properti, DP (persen atau nominal), tenor, daftar periode
  bunga, metode hitung, penghasilan bulanan (opsional, untuk rasio
  cicilan), biaya awal (opsional, dengan default).
- **Output:**
  - Cicilan per periode bunga dan lonjakannya saat masuk floating.
  - Total bunga dibayar, total pembayaran, dan total biaya awal.
  - Tabel amortisasi per bulan (bisa diciutkan per tahun) dan grafik sisa
    pokok vs komposisi bunga/pokok.
  - Rasio cicilan terhadap penghasilan dengan penanda bila di atas batas
    umum bank (sekitar 30 s.d. 40%, dijelaskan sebagai acuan umum, bukan
    aturan pasti).
  - Simulasi pelunasan sebagian (opsional): nominal dan bulan pelunasan,
    pilihan memendekkan tenor atau mengecilkan cicilan, dengan input denda
    pelunasan.
- Unduh tabel amortisasi sebagai CSV (dibuat di browser).
- Link berbagi dibuat lewat tombol "Bagikan" dengan pola fragment dari
  Story 20 (bukan sinkron otomatis ke query string).
- Bagian "cara hitung" dan FAQ, JSON-LD sesuai pola Story 20.

## Monetisasi

Mengikuti aturan tingkat hub di Story 20: hanya AdSense dan donasi,
affiliate ditunda.

- **Iklan display** di bawah tabel amortisasi. Halaman ini punya waktu
  tinggal lama karena pengguna membaca tabel, jadi cocok untuk iklan.
- **Donasi:** teks kecil setelah hasil simulasi dan setelah unduh CSV.
- **Ditunda:** KPR adalah tool dengan nilai komersial tertinggi di hub
  (affiliate portal properti, referral bank/broker KPR, asuransi, lead
  generation). Ini kandidat pertama bila affiliate dibuka lagi.

## Out of scope

- Perbandingan produk KPR antar bank dengan data bunga riil (butuh data
  yang harus dirawat terus).
- KPR syariah (akad murabahah/MMQ). Kandidat story lanjutan karena skema
  hitungnya berbeda.
- Pengajuan KPR atau integrasi ke bank mana pun.

## Acceptance Criteria

- [ ] Unit test: anuitas satu periode cocok dengan rumus standar (cocokkan
      dengan fungsi PMT spreadsheet), multi-periode bunga, tenor 1 s.d. 30
      tahun, DP 0%, pelunasan sebagian dua mode.
- [ ] Total pokok di tabel amortisasi sama persis dengan plafon (selisih
      pembulatan ditaruh di cicilan terakhir).
- [ ] Minimal 3 skenario dicocokkan dengan kalkulator KPR bank, hasilnya
      dicatat di PR.
- [ ] CSV amortisasi terbuka benar di spreadsheet.
- [ ] Slot iklan dan CTA donasi tampil sesuai aturan hub di Story 20.
- [ ] Tool muncul di registry halaman index tools, punya meta/JSON-LD,
      masuk sitemap.
- [ ] `nx lint`, `nx test`, dan e2e dasar lulus.

## Catatan implementasi (2026-11-06)

- Logika di `app/utils/loan/` (anuitas, efektif, flat, periode bunga berjenjang,
  pelunasan sebagian dua mode, biaya awal, CSV). Untuk anuitas, pokok dihitung dari
  cicilan yang sudah dibulatkan supaya cicilan tampil konstan; selisih pembulatan
  masuk ke cicilan terakhir.
- Metode flat menghitung bunga dari sisa pokok di awal tiap periode bunga (dan
  setelah pelunasan sebagian).
- Grafik sisa pokok memakai SVG biasa, tanpa library chart.

## Referensi perhitungan

Dasar perhitungan dan data yang dipakai tool ini (dicek 2026-11-06):

- Rumus anuitas standar (cicilan tetap, setara fungsi PMT spreadsheet), metode efektif (pokok tetap), dan flat; bunga fixed lalu floating dihitung ulang atas sisa pokok di setiap pergantian periode bunga.
- Rasio cicilan 30-40% dari penghasilan adalah acuan umum perbankan, bukan aturan.
- BPHTB 5% dikurangi NPOPTKP: UU 1/2022 (HKPD); NPOPTKP berbeda per daerah. https://peraturan.bpk.go.id/Details/195682/uu-no-1-tahun-2022
- Kode: `apps/enem-landing-tools/app/utils/loan/index.ts`.
