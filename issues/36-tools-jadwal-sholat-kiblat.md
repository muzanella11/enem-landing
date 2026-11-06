# Story 36: Jadwal Sholat, Imsakiyah Ramadan, dan Arah Kiblat

**Status:** Done (2026-11-06). Catatan: jadwal divalidasi terhadap data Kemenag (via api.myquran.com) untuk 6 kota di 3 zona waktu, selisih maksimal 2 menit; koordinat 513 kabupaten/kota dari Wikidata (CC0); awal Ramadan 1448 H masih perkiraan Umm al-Qura sampai sidang isbat; halaman ibadah default tanpa iklan.

**Apps touched:** `enem-landing-tools`, `enem-landing-api` (seed registry)

**Depends on:** Story 20, Story 25

## Background

"Jadwal sholat [kota]" dan "jadwal imsakiyah" punya volume pencarian
sangat besar, dikunjungi setiap hari, dan melonjak saat Ramadan (sekitar
Februari sampai Maret 2027). Waktu sholat bisa dihitung secara astronomis di
browser, jadi tidak butuh API dan tidak menambah beban server.

## Goal

1. `/jadwal-sholat` dan halaman per kota `/jadwal-sholat/[kota]` (satu
   halaman per kabupaten/kota untuk SEO).
2. `/jadwal-imsakiyah` dan per kota untuk Ramadan 1448 H.
3. `/arah-kiblat` dengan arah derajat dan kompas (bila perangkat
   mendukung).

## Keputusan awal

1. **Perhitungan di browser** dengan library astronomi waktu sholat
   (kandidat: `adhan`, cek lisensi dan versi saat implementasi) memakai
   parameter Kemenag RI: sudut Subuh dan Isya, ihtiyat (koreksi menit), dan
   Imsak = Subuh dikurangi 10 menit. Semua parameter disimpan sebagai data
   (`app/data/sholat/kemenag.ts`) dengan sumber dan tanggal cek.
2. **Data koordinat kota** (kabupaten/kota se-Indonesia: nama, provinsi,
   lintang, bujur, zona waktu WIB/WITA/WIT) dari sumber terbuka yang
   lisensinya jelas (dicek saat implementasi), disimpan di kode.
3. **Validasi terhadap jadwal resmi Kemenag** (Bimas Islam) untuk beberapa
   kota dan tanggal; selisih maksimal 2 menit.
4. **Lokasi pengguna** (Geolocation API) opsional, hanya dipakai di
   browser, tidak pernah dikirim ke server dan tidak dicatat di event.
5. Halaman per kota di-render server dengan jadwal hari ini (SWR cache
   harian), lalu diperbarui di browser sesuai tanggal lokal pengguna.
6. Awal Ramadan dan Syawal untuk imsakiyah mengikuti penetapan resmi
   (sidang isbat); sebelum ditetapkan ditampilkan dengan label "perkiraan".

## Scope

- Jadwal harian (Imsak, Subuh, Terbit, Dhuha, Dzuhur, Ashar, Maghrib, Isya)
  dan jadwal sebulan, unduh PDF/cetak jadwal sebulan.
- Imsakiyah Ramadan per kota (tabel 30 hari), siap cetak dan unduh PDF.
- Arah kiblat: sudut dari utara sejati (rumus great-circle ke Ka'bah),
  kompas memakai DeviceOrientation bila tersedia, dengan catatan kalibrasi.
- Pencarian kota, hitung mundur ke waktu sholat berikutnya.
- Cross-link ke kalkulator zakat dan fidyah (Story 45).

## Monetisasi

AdSense dengan filter ketat seperti halaman zakat (Story 22): blokir juga
kategori yang tidak pantas untuk konteks ibadah. Iklan bisa dimatikan per
tool dari CMS. Halaman ini terutama magnet trafik.

## Out of scope

- Adzan/notifikasi pengingat (butuh service worker dan izin notifikasi;
  kandidat lanjutan).
- Jadwal sholat di luar Indonesia.

## Acceptance Criteria

- [x] Unit test waktu sholat untuk minimal 5 kota di 3 zona waktu
      dibandingkan jadwal resmi Kemenag, selisih maksimal 2 menit.
- [ ] Unit test arah kiblat untuk beberapa kota (cocok dengan nilai
      referensi Kemenag/BMKG dalam toleransi 0,5 derajat).
- [x] Semua halaman kota masuk sitemap dan punya judul/meta sendiri.
- [x] Lokasi pengguna tidak pernah muncul di request jaringan.
- [x] Muncul di registry (Story 25), punya meta/JSON-LD, masuk sitemap.
- [x] Tidak ada request jaringan yang membawa nilai input pengguna.
- [x] `nx lint`, `nx test`, dan e2e dasar (buka halaman, isi input, hasil muncul) lulus.

## Referensi perhitungan

Dasar perhitungan dan data yang dipakai tool ini (dicek 2026-11-06):

- Kemenag RI (Bimas Islam): jadwal sholat sebagai acuan validasi. https://bimasislam.kemenag.go.id/jadwalshalat
- Parameter Kemenag: sudut Subuh 20 derajat, Isya 18 derajat, ihtiyat per waktu, Imsak 10 menit sebelum Subuh, koreksi kerendahan ufuk 0,0293 x akar ketinggian. Divalidasi terhadap 12 jadwal acuan dari api.myquran.com (data Kemenag) dengan selisih maksimal 2 menit.
- Perhitungan astronomi: pustaka adhan-js 4.4.6. https://github.com/batoulapps/adhan-js
- Koordinat dan ketinggian 513 kabupaten/kota: Wikidata (CC0). https://www.wikidata.org/
- Arah kiblat: fungsi `Qibla` dari adhan-js (arah great-circle ke Ka'bah dari koordinat kota).
- Data di kode: `app/data/sholat/`.
