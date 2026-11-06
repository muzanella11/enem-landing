# Story 50: Kalkulator BBM, Jarak Tempuh, dan Kecepatan (Kendaraan, Kapal Laut, Kereta, Pesawat)

**Apps touched:** `enem-landing-tools`, `enem-landing-api` (seed registry)

**Depends on:** Story 20, Story 25, Story 40 (konversi satuan, termasuk knot)

## Background

"Konsumsi BBM motor/mobil berapa km per liter", "biaya bensin
Jakarta-Surabaya", dan "berapa lama perjalanan 300 km dengan kecepatan 60
km/jam" dicari terus, memuncak saat mudik dan libur panjang. Pertanyaan
serupa muncul untuk moda lain: berapa knot kecepatan kapal, berapa lama
kapal menyeberang, berapa liter avtur yang dibakar pesawat per jam, dan
berapa lama naik kereta untuk jarak tertentu.

Semua hitungannya rumus dasar (jarak = kecepatan x waktu, konsumsi = jarak
/ bahan bakar), jadi bisa dibuat akurat, dijalankan di browser, dan
ditautkan dengan kalkulator libur nasional (Story 30) untuk perencanaan
mudik.

## Goal

Lima tool:

1. `/kalkulator-bbm`: konsumsi BBM kendaraan darat (km/liter dan liter/100
   km), biaya BBM perjalanan, dan jarak yang bisa ditempuh dengan isi tangki
   atau sejumlah rupiah.
2. `/kalkulator-kecepatan`: satu kalkulator jarak, waktu, dan kecepatan
   (isi dua, dapat yang ketiga) untuk darat, laut (knot dan mil laut), dan
   udara, plus perkiraan waktu tiba.
3. `/kalkulator-bbm-kapal`: kecepatan dalam knot, waktu tempuh dalam mil
   laut, konsumsi bahan bakar per jam atau per hari, kebutuhan bahan bakar
   dan biayanya untuk satu pelayaran, dan jarak jelajah dari isi tangki.
4. `/kalkulator-perjalanan-kereta`: waktu tempuh dari jarak dan kecepatan
   rata-rata (termasuk waktu berhenti di stasiun), kecepatan rata-rata dari
   jadwal, dan perkiraan konsumsi serta biaya BBM lokomotif diesel bila
   datanya diisi.
5. `/kalkulator-bahan-bakar-pesawat`: waktu terbang dari jarak dan
   kecepatan jelajah (knot atau km/jam, angin depan/belakang opsional),
   konsumsi bahan bakar per jam (kg atau liter), kebutuhan bahan bakar dan
   biayanya untuk satu penerbangan, dan jarak jelajah.

## Keputusan awal

1. **Rumus murni di `app/utils/transportasi/`** dengan satuan eksplisit:
   - Jarak = kecepatan x waktu; kecepatan rata-rata = jarak / (waktu jalan
     + waktu berhenti).
   - Konsumsi: km/liter = jarak / liter; liter/100 km = 100 / (km/liter).
   - Jarak tempuh = bahan bakar tersedia x efisiensi, dengan cadangan
     persen yang bisa diatur (bawaan 10%).
   - Laut: 1 mil laut = 1.852 m, 1 knot = 1 mil laut per jam (definisi
     internasional, sama dengan Story 40).
   - Udara: kecepatan terhadap darat = kecepatan jelajah + angin
     belakang (atau - angin depan); konversi avtur kg ke liter memakai
     massa jenis yang bisa diubah (bawaan sekitar 0,8 kg/liter, dicek
     ulang dari spesifikasi Jet A-1 saat implementasi).
2. **Harga BBM sebagai data dengan sumber dan tanggal**
   (`app/data/bbm/harga.ts`): harga resmi Pertamina per jenis (Pertalite,
   Pertamax, Pertamax Turbo, Dexlite, Pertamina Dex, Solar/Bio Solar) dan,
   bila tersedia, SPBU lain. Harga non-subsidi berubah tiap bulan dan
   berbeda per provinsi, jadi harga selalu bisa diubah pengguna dan halaman
   menampilkan tanggal berlakunya. Harga diambil dari situs resmi
   Pertamina saat implementasi.
3. **Konsumsi kendaraan, kapal, lokomotif, dan pesawat adalah input
   pengguna.** Preset hanya diberikan bila ada sumber yang bisa dicantumkan
   (mis. spesifikasi pabrikan atau publikasi resmi), dengan label
   "perkiraan" dan rentang, bukan satu angka pasti. Tidak ada preset tanpa
   sumber.
4. **Bukan alat navigasi atau perencanaan operasional.** Halaman kapal dan
   pesawat diberi catatan jelas bahwa perencanaan bahan bakar resmi
   mengikuti aturan otoritas (cadangan wajib, rute, cuaca) dan tidak boleh
   memakai kalkulator ini.
5. **Biaya dalam rupiah di setiap tool yang memakai bahan bakar** (BBM
   kendaraan, kapal, kereta, pesawat): ada field harga bahan bakar, dan
   hasil selalu menampilkan berapa rupiah yang dikeluarkan, yaitu jumlah
   bahan bakar x harga per satuan. Satuan harga mengikuti satuan bahan
   bakar yang dipilih: per liter, per kg (avtur), atau per ton (bahan bakar
   kapal). Bila satuan harga berbeda dengan satuan konsumsi, dikonversi
   dengan massa jenis yang tampil dan bisa diubah. Biaya juga ditampilkan
   per km (atau per mil laut) dan, bila jumlah penumpang diisi, per orang.
   Field harga untuk kendaraan darat terisi otomatis dari data harga BBM
   (keputusan 2) tetapi tetap bisa diubah; untuk kapal, kereta, dan pesawat
   harga diisi pengguna karena harga solar industri, MFO/HSD, dan avtur
   berbeda per lokasi dan kontrak.
6. Semua dihitung di browser; link berbagi memakai fragment (pola Story
   20). Tidak ada lokasi atau rute yang diambil dari peta.

## Scope

- BBM kendaraan:
  - Mode "hitung konsumsi": isi jarak (dari odometer) dan liter yang
    diisi (metode full-to-full), hasil km/liter dan liter/100 km.
  - Mode "biaya perjalanan": jarak, konsumsi, jenis BBM dan harga per liter
    (field, terisi dari data harga dan bisa diubah), pulang pergi, jumlah
    penumpang untuk patungan (tautan ke Story 44); hasil liter, total
    rupiah, rupiah per km, dan rupiah per orang.
  - Mode "jarak tempuh": kapasitas tangki atau nominal rupiah, konsumsi,
    cadangan; hasil km dan biaya mengisi penuh tangki.
  - Mode "hitung konsumsi" juga menampilkan biaya per km dari harga yang
    diisi.
- Kecepatan: isi dua dari jarak, waktu, kecepatan; satuan km/jam, m/s,
  mph, knot; jam berangkat untuk perkiraan jam tiba, dengan zona waktu WIB/
  WITA/WIT bila tiba di zona lain.
- Kapal: jarak (mil laut atau km), kecepatan (knot), konsumsi (liter/jam
  atau ton/hari), isi tangki, cadangan, harga bahan bakar (per liter atau
  per ton); hasil waktu tempuh, bahan bakar yang dibutuhkan, total rupiah
  (termasuk cadangan, ditampilkan terpisah), rupiah per mil laut, dan jarak
  jelajah.
- Kereta: jarak, kecepatan rata-rata atau jadwal berangkat/tiba, jumlah dan
  lama berhenti; hasil waktu tempuh atau kecepatan rata-rata; konsumsi BBM
  lokomotif (liter/km) dan harga per liter opsional, dengan hasil total
  rupiah, rupiah per km, dan rupiah per penumpang bila jumlah penumpang
  diisi.
- Pesawat: jarak (km atau mil laut), kecepatan jelajah, angin, konsumsi
  (kg/jam atau liter/jam), massa jenis avtur, cadangan, harga avtur (per
  liter atau per kg); hasil waktu terbang, bahan bakar perjalanan, total
  rupiah (perjalanan dan cadangan terpisah), rupiah per jam terbang, rupiah
  per penumpang bila diisi, dan jarak jelajah.
- Halaman jawaban terbatas untuk pencarian umum, mis. konsumsi BBM per 100
  km dan "300 km berapa jam" (pola Story 49), hanya bila berguna.
- FAQ, sumber, JSON-LD, event standar, cross-link ke konversi satuan
  (Story 40), libur nasional (Story 30), patungan (Story 44), dan biaya
  kendaraan (Story 42).

## Monetisasi

AdSense dan donasi seperti tool keuangan lain. Topik otomotif dan
perjalanan punya nilai iklan yang baik.

## Out of scope

- Rute dan jarak otomatis dari peta (butuh layanan pihak ketiga dan lokasi
  pengguna).
- Jadwal dan harga tiket resmi kereta, kapal, atau pesawat.
- Perhitungan bahan bakar untuk keperluan operasional penerbangan atau
  pelayaran.
- Emisi CO2 (kandidat story lanjutan bila faktor emisi resmi sudah dicek).

## Acceptance Criteria

- [ ] Unit test tiap rumus dengan satuan berbeda: konversi km/liter dan
      liter/100 km dua arah, jarak-waktu-kecepatan (tiap kombinasi dua
      input), knot dan mil laut, angin depan/belakang, kg ke liter avtur,
      cadangan persen, dan waktu berhenti kereta.
- [ ] Unit test biaya: jumlah bahan bakar x harga untuk tiap satuan harga
      (liter, kg, ton), konversi satuan harga dengan massa jenis, biaya per
      km/mil laut/jam, biaya per orang, dan pulang pergi.
- [ ] Setiap tool yang memakai bahan bakar punya field harga dan menampilkan
      total rupiah yang dikeluarkan.
- [ ] Perkiraan jam tiba benar melewati tengah malam dan antarzona waktu
      WIB/WITA/WIT.
- [ ] Setiap harga BBM punya sumber dan tanggal berlaku yang tampil di
      halaman; setiap preset konsumsi punya sumber.
- [ ] Catatan "bukan untuk navigasi/perencanaan operasional" tampil di
      halaman kapal dan pesawat.
- [ ] Tidak ada request jaringan yang membawa nilai input pengguna (diuji
      e2e).
- [ ] Muncul di registry (Story 25), punya meta/JSON-LD, masuk sitemap.
- [ ] `nx lint`, `nx test`, dan e2e dasar (buka halaman, isi input, hasil
      muncul) lulus.
- [ ] Bagian "Referensi perhitungan" di file ini diisi saat story selesai.
