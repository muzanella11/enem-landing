# Story 26: Tools UMP/UMK 2027, Kalkulator Lembur, dan Kalkulator THR

**Status:** Done (2026-11-06). Catatan: angka UMP 2025/2026 dari tabel Kontan (26 Des 2025), belum dicocokkan dengan SK gubernur; Aceh dan Papua Pegunungan belum ada di sumber; UMP 2027 dan UMK menyusul setelah diumumkan; tanggal hari raya 2027 diisi pengguna sampai kalender BI 2027 terbit.

**Apps touched:** `enem-landing-tools`, `enem-landing-api` (migrasi seed
registry)

**Depends on:** Story 20 (fondasi tools hub, `utils/payroll`), Story 25
(registry tool di CMS)

## Background

Hasil brainstorming sesi 2026-11-06: untuk menaikkan trafik AdSense, tool
berikutnya dipilih dari kelompok kerja dan gaji karena:

- Topik keuangan dan kerja punya nilai iklan yang relatif tinggi.
- Kodenya sebagian besar sudah ada (`utils/payroll`, `RupiahInput`,
  `ToolShell`, pola share link dan tracking).
- Ketiganya saling menautkan dengan kalkulator gaji bersih, sehingga trafik
  satu halaman mengalir ke halaman lain.
- Momennya dekat: UMP diumumkan sekitar akhir November, UMK sekitar
  Desember, dan pencarian THR memuncak menjelang Lebaran 2027 (sekitar
  Februari sampai Maret). Halaman perlu live paling lambat awal Desember
  2026 supaya sempat terindeks.

## Goal

1. Halaman **UMP/UMK 2027**: daftar upah minimum per provinsi (dan kota
   besar), dengan halaman tersendiri per provinsi untuk SEO.
2. **Kalkulator lembur** sesuai PP 35/2021.
3. **Kalkulator THR** sesuai Permenaker 6/2016, termasuk estimasi potongan
   PPh 21 di bulan THR dibayar.

## Keputusan awal

1. **Data upah minimum disimpan di kode**, bukan di CMS, sama seperti tarif
   pajak (Story 25 keputusan 6): `app/data/upah-minimum/2027.ts` dan
   `2026.ts` (untuk perbandingan kenaikan). Setiap entri wajib punya sumber
   (nomor SK gubernur atau tautan resmi) dan tanggal pengecekan. Pembaruan
   data lewat PR dan rilis biasa.
2. **Bertahap untuk UMK.** Rilis pertama berisi UMP 38 provinsi. UMK
   ditambahkan bertahap, mulai dari kota/kabupaten dengan pencarian
   terbesar (mis. Jakarta, Surabaya, Bandung, Bekasi, Karawang, Tangerang,
   Semarang, Medan, Makassar, Batam), mengikuti kapan SK-nya terbit.
   Provinsi atau kota yang SK-nya belum terbit ditandai "belum diumumkan",
   tidak diisi perkiraan.
3. **Halaman per provinsi di-prerender** (`/upah-minimum/[provinsi]`)
   dengan judul dan meta sendiri (mis. "UMP Jawa Barat 2027"), karena itu
   kata kunci yang paling banyak dicari. Daftar slug provinsi dibuat dari
   data, bukan diketik ulang.
4. **Logika lembur dan THR sebagai fungsi murni** di
   `app/utils/payroll/lembur.ts` dan `app/utils/payroll/thr.ts`, diuji unit
   menyeluruh, memakai ulang tipe dan helper payroll yang ada.
5. **Tiga entri baru di registry tool** (Story 25) lewat migrasi seed:
   `upah-minimum`, `kalkulator-lembur`, `kalkulator-thr`, kategori
   `keuangan`. Snapshot registry di `shared/tools-registry.ts` ikut
   diperbarui.

## Aturan hitung (wajib diverifikasi ulang saat implementasi)

### Lembur (PP 35/2021 Pasal 31 dan 32)

- **Upah sejam** = 1/173 x upah sebulan.
- **Dasar upah sebulan:**
  - Bila upah terdiri dari upah pokok dan tunjangan tetap: 100% upah.
  - Bila upah terdiri dari upah pokok, tunjangan tetap, dan tunjangan tidak
    tetap, dan upah pokok + tunjangan tetap kurang dari 75% total upah:
    dasar = 75% dari total upah.
- **Hari kerja biasa:** jam pertama 1,5 x upah sejam, jam berikutnya 2 x.
- **Hari istirahat mingguan atau libur resmi:**
  - Pola 6 hari kerja: jam ke-1 s.d. 7 = 2x, jam ke-8 = 3x, jam ke-9 s.d.
    11 = 4x. Bila jatuh pada hari kerja terpendek: jam ke-1 s.d. 5 = 2x,
    jam ke-6 = 3x, jam ke-7 s.d. 9 = 4x.
  - Pola 5 hari kerja: jam ke-1 s.d. 8 = 2x, jam ke-9 = 3x, jam ke-10 s.d.
    12 = 4x.
- **Batas waktu lembur:** maksimal 4 jam per hari dan 18 jam per minggu
  (di luar hari istirahat/libur). Tool memberi peringatan bila input
  melewati batas, tidak menolak hitungan.

### THR (Permenaker 6/2016)

- Masa kerja **12 bulan atau lebih**: 1 bulan upah.
- Masa kerja **1 bulan sampai kurang dari 12 bulan**: masa kerja (bulan) /
  12 x 1 bulan upah.
- **Upah** = upah pokok + tunjangan tetap (atau upah bersih tanpa
  tunjangan bila struktur upahnya begitu).
- **Pekerja harian lepas:** masa kerja 12 bulan atau lebih memakai rata-rata
  upah 12 bulan terakhir; kurang dari 12 bulan memakai rata-rata upah per
  bulan selama masa kerja.
- Dibayar paling lambat 7 hari sebelum hari raya keagamaan.
- **Pajak:** THR ditambahkan ke bruto bulan dibayarkan dan dipotong dengan
  TER (Story 20). Tool menampilkan estimasi potongan PPh 21 di bulan itu
  dengan memanggil `calculateMonth` yang sudah ada, plus catatan bahwa
  selisihnya dikoreksi di Desember.

### Upah minimum

- UMP ditetapkan gubernur; UMK ditetapkan gubernur atas rekomendasi
  bupati/wali kota dan tidak boleh lebih rendah dari UMP.
- Formula dan tenggat penetapan tahun 2027 mengikuti regulasi yang berlaku
  saat itu; dicatat di halaman beserta sumbernya. Tool tidak menghitung
  sendiri perkiraan UMP.

## Scope

### Upah minimum (`/upah-minimum`, `/upah-minimum/[provinsi]`)

- Tabel UMP 2027 per provinsi: nilai 2027, nilai 2026, kenaikan (rupiah dan
  persen), tanggal berlaku, sumber. Bisa diurutkan dan dicari.
- Halaman per provinsi: UMP provinsi, daftar UMK kota/kabupaten yang sudah
  tersedia, catatan "belum diumumkan" bila belum ada, dan tombol "Hitung
  gaji bersih dari angka ini" yang membuka kalkulator gaji dengan gaji pokok
  terisi (lewat state link berbagi Story 20, bukan query string).
- JSON-LD `Dataset` atau `Table` yang sesuai, `BreadcrumbList`, dan FAQ
  ("Kapan UMP 2027 diumumkan", "Apa beda UMP dan UMK", dll).
- Semua halaman provinsi masuk sitemap.

### Kalkulator lembur (`/kalkulator-lembur`)

- **Input:** upah pokok, tunjangan tetap, tunjangan tidak tetap
  (opsional), pola kerja (5 atau 6 hari), daftar entri lembur (tanggal atau
  jenis hari: hari kerja / hari istirahat / libur resmi / hari kerja
  terpendek, dan jumlah jam). Mode cepat: total jam lembur hari kerja dan
  hari libur dalam sebulan.
- **Output:** upah sejam, rincian per entri per jam (pengali dan nominal),
  total upah lembur sebulan, peringatan bila melewati batas jam.
- Tautan "Hitung gaji bersih termasuk lembur" ke kalkulator gaji, dengan
  total lembur masuk sebagai tunjangan tidak tetap.
- Bagian "cara hitung" dengan angka pengguna, FAQ, JSON-LD.

### Kalkulator THR (`/kalkulator-thr`)

- **Input:** status (karyawan tetap/kontrak atau harian lepas), tanggal
  mulai kerja dan tanggal hari raya (atau langsung masa kerja dalam bulan),
  upah pokok + tunjangan tetap (atau rata-rata upah untuk harian lepas),
  status PTKP dan BPJS untuk estimasi pajak.
- **Output:** besar THR, masa kerja yang dipakai, estimasi PPh 21 di bulan
  THR dibayar (dibanding bulan tanpa THR), estimasi THR bersih diterima,
  dan batas tanggal pembayaran (H-7).
- Pilihan hari raya keagamaan (Idul Fitri, Natal, Nyepi, Waisak, Imlek,
  Kenaikan Isa Almasih tidak termasuk) dengan tanggal 2027 sebagai data
  yang bisa diubah pengguna.
- Bagian "cara hitung", FAQ, JSON-LD.

### Umum

- Pola Story 20: tanpa backend, hitungan di browser, link berbagi via
  fragment, event `tool_view`/`tool_calculate`/`tool_share` dengan
  whitelist payload Story 25.
- Cross-link antar empat tool kerja (gaji bersih, lembur, THR, upah
  minimum) di bagian "Tools terkait".
- Artikel blog pendukung (skill `write-article`) dicatat sebagai tindak
  lanjut: "Cara menghitung lembur", "Cara menghitung THR 2027", "UMP 2027
  semua provinsi".

## Monetisasi

Mengikuti aturan hub di Story 20 (AdSense dan donasi, affiliate ditunda).

- **Iklan display** di bawah hasil dan di halaman upah minimum (halaman
  daftar dengan waktu baca lama). Halaman per provinsi menambah jumlah
  halaman terindeks dan inventaris iklan.
- **Donasi:** teks kecil setelah hasil hitung.
- Kategori iklan yang diblokir tetap berlaku (pinjol, judi, dll); audiens
  halaman upah minimum dan THR termasuk yang paling rentan terhadap iklan
  pinjol.

## Out of scope

- UMK seluruh 500+ kabupaten/kota di rilis pertama (bertahap, lihat
  keputusan 2).
- Upah minimum sektoral.
- Perkiraan atau prediksi UMP sebelum diumumkan resmi.
- Pesangon (kandidat story berikutnya, memakai masa kerja dari THR).
- Lembur untuk pekerja dengan sistem jam kerja khusus (mis. sektor energi,
  pertambangan) yang diatur terpisah.

## Pertanyaan terbuka

1. **Regulasi penetapan UMP 2027** (formula dan tenggat) perlu dicek saat
   implementasi; aturannya beberapa kali berubah dalam beberapa tahun
   terakhir.
2. **Sumber data UMK** yang paling cepat dan bisa dipercaya (SK gubernur di
   JDIH provinsi, situs Disnaker provinsi). Perlu daftar sumber per
   provinsi.
3. **Tanggal hari raya 2027** diambil dari kalender hari libur dan cuti
   bersama Bank Indonesia (lihat Story 30 untuk sumber dan formatnya), sama
   dengan data libur nasional. PDF 2027 belum terbit per 2026-11-06; sampai
   itu, tanggal hari raya diisi pengguna sendiri.

## Acceptance Criteria

- [ ] Unit test lembur: hari kerja (jam pertama 1,5x, berikutnya 2x), hari
      istirahat pola 6 hari (termasuk hari kerja terpendek) dan pola 5
      hari, batas pengali 3x/4x, dasar upah 75% bila komponen tetap kurang
      dari 75%, dan peringatan batas 4 jam/hari dan 18 jam/minggu.
- [ ] Unit test THR: masa kerja tepat 12 bulan, 11 bulan, 1 bulan, kurang
      dari 1 bulan (tidak berhak), pekerja harian lepas dengan rata-rata
      upah, dan estimasi PPh 21 bulan THR konsisten dengan
      `calculateMonth`.
- [ ] Minimal 3 skenario lembur dan 3 skenario THR dicocokkan manual dengan
      contoh resmi Kemnaker atau kalkulator lain yang mengikuti PP
      35/2021, hasilnya dicatat di PR.
- [ ] Setiap entri UMP/UMK punya sumber dan tanggal pengecekan; entri yang
      belum diumumkan tampil sebagai "belum diumumkan", bukan angka.
- [ ] Halaman per provinsi ter-render server-side dengan judul, meta,
      canonical, dan JSON-LD sendiri, dan semuanya masuk sitemap.
- [ ] Tombol dari upah minimum dan lembur ke kalkulator gaji membawa angka
      lewat fragment, dan fragment hilang dari address bar sebelum slot
      iklan dimuat.
- [ ] Tidak ada request jaringan yang membawa nilai upah atau jam lembur
      pengguna.
- [ ] Tiga tool baru muncul di registry (migrasi seed dan snapshot),
      terkelola dari CMS, dan event-nya tampil di statistik tool CMS.
- [ ] `nx lint`, `nx test`, dan e2e dasar (buka halaman, isi input, hasil
      muncul) lulus untuk `enem-landing-tools`.
- [ ] Halaman live paling lambat awal Desember 2026 (UMP), data UMK
      menyusul bertahap.

## Referensi perhitungan

Dasar perhitungan dan data yang dipakai tool ini (dicek 2026-11-06):

- UMP 2025 dan 2026: Kontan, "Resmi! Ini UMP 2026 di 38 Provinsi Dari Tertinggi ke Terendah" (26 Desember 2025), belum dicocokkan ke SK gubernur. https://nasional.kontan.co.id/news/resmi-ini-ump-2026-di-38-provinsi-dari-tertinggi-ke-terendah-ump-masih-dibawah-khl
- Lembur: PP 35/2021 Pasal 31 dan 32 (upah sejam = 1/173 upah sebulan, dasar minimal 75% bila ada tunjangan tidak tetap, pengali jam pertama 1,5x dan seterusnya 2x, aturan hari libur 5/6 hari kerja). https://peraturan.bpk.go.id/
- THR: Permenaker 6/2016 (1 bulan upah untuk masa kerja 12 bulan, proporsional di bawahnya, rata-rata upah untuk pekerja harian, dibayar paling lambat H-7). https://jdih.kemnaker.go.id/
- Pajak THR: PMK 168/2023 (lihat Story 20).
- Tanggal hari raya: kalender Bank Indonesia (lihat Story 30).
- Data di kode: `app/data/upah-minimum/index.ts`, `app/utils/payroll/lembur.ts`, `app/utils/payroll/thr.ts`.
