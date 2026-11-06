# Story 30: Kalender Libur Nasional dan Cuti Bersama 2027, Hitung Hari Kerja

**Apps touched:** `enem-landing-tools`, `enem-landing-api` (seed registry)

**Depends on:** Story 20, Story 25

## Background

"Libur nasional 2027" dan "cuti bersama 2027" adalah kata kunci dengan
volume sangat besar setiap akhir tahun, dan pencariannya berlanjut sepanjang
tahun (orang merencanakan cuti dan "harpitnas"). Nilai iklannya lebih rendah
dari topik keuangan, tapi volumenya menambah inventaris iklan dan membawa
pengunjung ke tool lain.

## Goal

1. Halaman `/libur-nasional-2027` berisi daftar libur nasional dan cuti
   bersama, tampilan kalender, dan saran "long weekend".
2. Tool `/hitung-hari-kerja` untuk menghitung hari kerja di antara dua
   tanggal, dengan libur nasional ikut diperhitungkan.

## Keputusan awal

1. **Sumber data selalu kalender Bank Indonesia** (keputusan user
   2026-11-06): halaman https://www.bi.go.id/id/publikasi/kalender/Default.aspx,
   tombol "Hari Libur dan Cuti Bersama Tahun YYYY", yang mengarah ke PDF
   `https://www.bi.go.id/id/publikasi/Kalender/Documents/Kalender-Libur-BI-YYYY.pdf`.
   Tidak memakai sumber lain (SKB langsung, situs berita, API pihak ketiga).
2. **Format sumber (dicek 2026-11-06 lewat browser, file 2026):** PDF 2 halaman
   berjudul "Hari Libur dan Cuti Bersama Tahun 2026 di Bank Indonesia", berisi
   tabel "Hari Libur Tahun 2026" dan "Cuti Bersama Tahun 2026" dengan kolom
   No, Tanggal, Hari, Hari Libur. Tanggal yang bisa bergeser (hari besar
   Islam) diberi tanda `*)`.
3. **Data disimpan di kode** (`app/data/libur/2027.ts`, juga `2026.ts`), hasil
   salin manual dari PDF BI, dengan URL PDF, tanggal pengecekan, dan
   `last-modified` file sebagai sumber. Entri bertanda `*)` disimpan dengan
   flag `dapatBerubah` dan ditampilkan dengan label. Halaman menyebut
   sumbernya "Kalender Bank Indonesia".
4. **Kenapa salin manual, bukan ambil otomatis:** akses otomatis ke bi.go.id
   dari terminal dan dari agent diputus server (connection reset) saat dicek;
   halaman hanya bisa dibuka lewat browser. Selain itu URL tahun yang belum
   terbit tidak mengembalikan 404, melainkan halaman HTML biasa (status 200),
   jadi pengecekan ketersediaan harus memeriksa isi file diawali `%PDF-`.
5. **Saran long weekend** dihitung otomatis: rangkaian libur + akhir pekan,
   dan berapa hari cuti yang perlu diambil untuk menyambungnya.
6. **Ekspor kalender** ke file `.ics` dibuat di browser, supaya bisa
   ditambahkan ke Google Calendar/iPhone tanpa akun.

## Scope

- Libur nasional: daftar per bulan, tampilan kalender 12 bulan, filter
  libur/cuti bersama, hitung mundur ke libur berikutnya, saran long weekend,
  unduh `.ics`.
- Hitung hari kerja: tanggal mulai dan selesai, pola kerja (5 atau 6 hari),
  centang "hitung libur nasional dan cuti bersama", hasil hari kerja, hari
  libur yang terlewati, dan hari kalender. Berguna juga untuk tenggat dokumen
  dan masa kerja.
- JSON-LD `Event` per hari libur (atau `ItemList`), FAQ, sitemap.

## Monetisasi

AdSense (halaman daftar dengan kunjungan berulang) dan donasi. Cross-link
ke kalkulator THR (Story 26) di sekitar Idul Fitri dan Natal.

## Out of scope

- Libur daerah/provinsi dan libur sekolah.
- Kalender sinkron otomatis (langganan URL `.ics`), butuh server.

## Pertanyaan terbuka

1. **Kapan PDF 2027 terbit di situs BI.** Per 2026-11-06 hanya PDF 2026 yang
   tersedia (diunggah BI 22 Desember 2025, menurut header `last-modified`),
   jadi PDF 2027 kemungkinan baru ada sekitar akhir Desember 2026. Sampai
   itu, halaman 2027 tampil sebagai "menunggu publikasi kalender Bank
   Indonesia" (tanpa angka perkiraan), sementara kalender 2026 tetap
   tersedia. Begitu PDF 2027 terbit, data disalin dan dirilis lewat PR.
2. **Pengingat pengecekan:** perlu ada pengingat rutin (mis. mingguan mulai
   pertengahan Desember) untuk mengecek apakah PDF tahun berikutnya sudah
   terbit, karena pengecekan otomatis dari server tidak bisa dipakai.

## Acceptance Criteria

- [ ] Semua tanggal berasal dari PDF kalender Bank Indonesia tahun terkait;
      URL PDF dan tanggal pengecekan tampil di halaman.
- [ ] Entri bertanda `*)` di PDF BI tampil dengan label "dapat berubah".
- [ ] Tahun yang PDF-nya belum terbit tampil "menunggu publikasi kalender
      Bank Indonesia", tanpa tanggal perkiraan.
- [ ] Unit test hitung hari kerja (rentang yang melewati libur, akhir pekan,
      pola 5 dan 6 hari, tanggal terbalik) dan saran long weekend.
- [ ] File `.ics` terbuka benar di Google Calendar dan Apple Calendar.
- [ ] Muncul di registry, meta/JSON-LD, sitemap; lint, test, e2e lulus.
