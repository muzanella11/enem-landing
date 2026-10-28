# Story 21: Tool Simulasi KPR

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

Mengikuti aturan tingkat hub di Story 20 (kategori diblokir, disclosure,
tidak ada data input di tautan). KPR adalah tool dengan nilai komersial
tertinggi di hub ini karena nilai transaksinya besar.

- **Affiliate portal properti:** tautan ke listing rumah sesuai rentang
  harga yang dihitung pengguna (portal properti besar umumnya punya
  program affiliate atau partner; dicek saat implementasi).
- **Referral KPR bank / broker KPR:** beberapa bank dan platform
  perbandingan KPR memberi komisi untuk referral. Dimulai dari tautan
  sederhana, bukan form pengumpulan data.
- **Affiliate asuransi** jiwa dan properti (wajib di KPR, sering
  dibandingkan pengguna).
- **Iklan display** di bawah tabel amortisasi; halaman ini punya waktu
  tinggal lama karena pengguna membaca tabel.
- **Lead generation (tahap lanjut, opsional):** form "minta dihubungi
  untuk konsultasi KPR" yang diteruskan ke mitra. Hanya dikerjakan dengan
  consent eksplisit, kebijakan privasi khusus, dan perjanjian dengan mitra
  sesuai UU PDP. Tidak masuk scope story ini.

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
- [ ] Penawaran affiliate KPR terdaftar di registry affiliate Story 20 dan
      tampil setelah hasil, dengan disclosure.
- [ ] Tool muncul di registry halaman index tools, punya meta/JSON-LD,
      masuk sitemap.
- [ ] `nx lint`, `nx test`, dan e2e dasar lulus.
