# Story 49: SEO dan Distribusi Tools Hub (Halaman Jawaban, Gambar Pratinjau, Widget, Konten)

**Status:** Done untuk kode (2026-11-06), sisa pekerjaan ada di luar kode. Catatan: halaman jawaban baru `/gaji-bersih/<nominal>` dan `/thr/<nominal>` (11 nominal masing-masing, 3-25 juta) memakai fungsi kalkulator yang sama; halaman jawaban token listrik, jadwal sholat per kota, UMP per provinsi, satuan tanah lokal, dan jenis surat sudah ada dari story sebelumnya. Jumlah di sitemap per jenis: gaji 11, THR 11, token sesuai `NOMINAL_TOKEN`, sholat dan imsakiyah masing-masing 513 kota, UMP 38 provinsi, satuan tanah 6, surat 6. Nominal belum dipilih dari data Search Console karena belum ada data; tinjau setelah 4 minggu. OG image tetap per tool/halaman (tidak bergantung fragment, diuji e2e). Widget `/embed/<tool>` untuk gaji, THR, zakat: tanpa iklan, donasi, dan tracker, noindex, `frame-ancestors *`; diuji dari origin yang sama, belum di halaman pihak ketiga sungguhan. Halaman `/pasang-widget` berisi kode iframe. Rencana konten 6 bulan dan daftar periksa Search Console ditambahkan ke `articles/SEO-PLAN.md`; artikelnya sendiri belum ditulis dan verifikasi Search Console perlu dilakukan pemilik domain.

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

## Referensi perhitungan

Dasar perhitungan dan data yang dipakai tool ini (dicek 2026-11-06):

- Halaman jawaban gaji bersih: fungsi `calculateYear` yang sama dengan kalkulator gaji (PP 58/2023 TER, PMK 168/2023, iuran BPJS; lihat Story 20), asumsi tanpa tunjangan, JKK risiko terendah.
- Halaman jawaban THR: `hitungThr` dan `pajakThr` (Permenaker 6/2016, PMK 168/2023; lihat Story 26), pajak untuk TK/0 dibayar di bulan Maret.
- Pedoman konten tipis dan halaman massal: Google Search Central, "Spam policies: scaled content abuse" dan "Creating helpful, reliable, people-first content". https://developers.google.com/search/docs/essentials/spam-policies dan https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Header iframe: CSP `frame-ancestors` (MDN). https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors
- Kode: `app/data/distribusi.ts`, `app/utils/halaman-jawaban.ts`, `app/pages/embed/[slug].vue`, `app/pages/pasang-widget.vue`.
