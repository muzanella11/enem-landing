# Story 31: Hitung Weton, Konversi Hijriah, Hitung Umur dan Selisih Tanggal

**Apps touched:** `enem-landing-tools`, `enem-landing-api` (seed registry)

**Depends on:** Story 20, Story 25

## Background

Kalkulator tanggal punya volume pencarian sangat besar di Indonesia,
terutama "weton" (kalender Jawa) dan "kalender Hijriah". Nilai iklannya
rendah, tapi dikunjungi berulang dan mudah dibagikan, sehingga menambah
trafik keseluruhan hub.

## Goal

Empat tool kecil: `/hitung-weton`, `/konversi-hijriah`, `/hitung-umur`,
`/selisih-tanggal`.

## Keputusan awal

1. **Weton dihitung dari tanggal acuan yang terverifikasi**, mis. 17 Agustus
   1945 = Jumat Legi, dengan siklus pasaran 5 hari. Neptu hari: Minggu 5,
   Senin 4, Selasa 3, Rabu 7, Kamis 8, Jumat 6, Sabtu 9. Neptu pasaran:
   Legi 5, Pahing 9, Pon 7, Wage 4, Kliwon 8. Acuan dan nilai neptu dicek
   ulang ke sumber saat implementasi dan diuji dengan beberapa tanggal yang
   diketahui.
2. **Konversi Hijriah memakai `Intl.DateTimeFormat` kalender
   `islamic-umalqura`** (tanpa library), dengan catatan bahwa penetapan
   awal bulan Kemenag (rukyat/hisab) bisa berbeda satu hari. Untuk Ramadan,
   Syawal, dan Dzulhijjah ditampilkan tanggal penetapan resmi bila sudah
   ada di data.
3. **Konten budaya disajikan netral:** tool weton menampilkan hari, pasaran,
   neptu, dan wuku sebagai informasi kalender Jawa. Tafsiran (mis.
   kecocokan jodoh) bila ditampilkan diberi label sebagai tradisi, bukan
   ramalan yang pasti.
4. Semua fungsi tanggal murni di `app/utils/dates/`, bebas zona waktu
   (bekerja dengan tanggal kalender, bukan timestamp).

## Scope

- Weton: input tanggal lahir, output hari pasaran, neptu, wuku; opsi
  hitung weton dua orang (jumlah neptu) dengan label tradisi.
- Hijriah: Masehi ke Hijriah dan sebaliknya, nama bulan Hijriah, dan
  kalender bulan berjalan.
- Hitung umur: umur dalam tahun/bulan/hari, hari ulang tahun berikutnya,
  weton kelahiran (tautan).
- Selisih tanggal: jumlah hari/minggu/bulan, tambah/kurang hari dari
  tanggal tertentu. Tautan ke hitung hari kerja (Story 30).
- FAQ, JSON-LD, link berbagi, event standar.

## Monetisasi

AdSense dan donasi. Tidak ada kategori tambahan yang perlu diblokir di luar
daftar Story 20.

## Out of scope

- Primbon lengkap, ramalan, atau rekomendasi tanggal baik.
- Kalender Jawa (Saka/Sultan Agungan) penuh selain weton dan wuku.

## Acceptance Criteria

- [ ] Unit test weton untuk minimal 5 tanggal yang diketahui (termasuk acuan),
      sebelum dan sesudah acuan, dan tahun kabisat.
- [ ] Unit test konversi Hijriah dua arah dan perhitungan umur di sekitar
      29 Februari dan akhir bulan.
- [ ] Hasil konsisten di semua zona waktu (test dengan `TZ` berbeda).
- [ ] Muncul di registry, meta/JSON-LD, sitemap; lint, test, e2e lulus.
