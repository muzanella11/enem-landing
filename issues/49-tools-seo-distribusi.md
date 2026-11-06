# Story 49: SEO dan Distribusi Tools Hub (Halaman Jawaban, Gambar Pratinjau, Widget, Konten)

**Apps touched:** `enem-landing-tools`, `enem-landing-web` (blog), `articles/`

**Depends on:** Story 20, Story 25, Story 19 (blog), tool-tool yang sudah rilis

## Background

Selain menambah tool, trafik bisa naik dengan memperbanyak pintu masuk dari
mesin pencari dan media sosial untuk tool yang sudah ada. Usulan ini dari
brainstorming sesi 2026-11-06.

## Goal

1. **Halaman jawaban spesifik** yang dibuat dari data, mis. "Gaji 5 juta
   bersih berapa", "THR gaji 4 juta", "Token listrik 100 ribu berapa kWh",
   "Jadwal sholat Bandung", "1 tumbak berapa meter".
2. **Gambar pratinjau dinamis** (OG image) per halaman saat dibagikan ke
   WhatsApp/media sosial.
3. **Widget embed** kalkulator untuk situs lain dengan tautan balik
   (rencana tahap lanjut di Story 20).
4. **Rutinitas konten dan pemantauan**: artikel blog musiman dan Google
   Search Console.

## Keputusan awal

1. **Halaman jawaban hanya dibuat bila benar-benar berguna**: tiap halaman
   punya hasil hitungan nyata untuk angka itu, penjelasan, dan kalkulator
   yang sudah terisi, bukan teks yang diulang-ulang. Jumlahnya dibatasi
   pada variasi yang memang dicari (dari data Search Console), untuk
   menghindari dianggap konten tipis oleh Google.
2. **OG image** dibuat server-side (mis. modul OG image Nuxt atau route
   Satori) per jenis halaman, berisi judul tool/halaman saja. **Tidak pernah
   berisi angka dari input pengguna**, karena gambar dibuat dari URL tanpa
   state (state ada di fragment).
3. **Widget embed** berupa iframe ringan per tool dengan tautan "dibuat
   oleh tools.muzanella.com"; tanpa iklan di dalam widget; konfigurasi
   (tema, tool) lewat parameter yang tidak berisi data pengguna.
4. **Konten blog** memakai skill `write-article`, dijadwalkan mengikuti
   musim: UMP (November), rekonsiliasi PPh 21 (Desember), THR dan zakat
   (Januari sampai Maret), CPNS (sesuai jadwal).

## Scope

- Generator halaman jawaban berbasis data untuk: gaji bersih (nominal umum),
  THR, token listrik, jadwal sholat per kota, konversi satuan lokal.
  Masing-masing dengan canonical, internal link ke kalkulator, dan sitemap
  terpisah per jenis bila jumlahnya besar.
- OG image per halaman tool dan halaman jawaban.
- Widget embed untuk kalkulator gaji, THR, dan zakat, dengan halaman
  "Pasang di situsmu" berisi kode embed.
- Daftar periksa Search Console: verifikasi domain, kirim sitemap, pantau
  kueri dan halaman, perbaiki halaman dengan CTR rendah.
- Rencana konten 6 bulan di `articles/SEO-PLAN.md`.

## Monetisasi

Tidak menambah monetisasi baru; menambah halaman terindeks dan kunjungan
untuk AdSense yang sudah ada. Widget tidak memuat iklan.

## Out of scope

- Situs berbahasa Inggris, backlink berbayar, atau taktik SEO yang melanggar
  pedoman Google.

## Acceptance Criteria

- [ ] Setiap halaman jawaban menampilkan hasil hitungan yang benar untuk
      angkanya (diuji unit/e2e) dan menautkan ke kalkulatornya.
- [ ] OG image tidak pernah berisi data input pengguna (diuji dengan URL
      berfragment).
- [ ] Widget berjalan di halaman uji pihak ketiga tanpa membocorkan data
      ke situs penanam (komunikasi dibatasi, tanpa akses cookie situs kita).
- [ ] Sitemap memuat halaman jawaban; jumlah halaman per jenis tercatat.
- [ ] `nx lint`, `nx test`, dan e2e lulus.
