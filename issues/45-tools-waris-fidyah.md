# Story 45: Kalkulator Waris Islam (Faraid), Fidyah, dan Kafarat

**Status:** Done untuk kode (2026-11-06), **belum rilis**. Catatan: `/kalkulator-waris` sengaja dinonaktifkan di registry (migration dan snapshot) karena kriteria "tinjauan oleh orang yang kompeten" belum dipenuhi; aktifkan dari CMS setelah ditinjau. 21 kasus faraid (termasuk aul, radd, gharrawain, minbariyyah) lulus unit test dengan total tepat 1, tetapi jawabannya disusun dari contoh umum buku faraid, belum dicocokkan halaman per halaman dengan satu rujukan. Kakek bersama saudara dan musytarakah ditandai sebagai perselisihan, tidak dihitung. Paman dan keponakan (ashabah jauh) belum didukung. Fidyah dan kafarat aktif; nilai fidyah Rp65.000 dan sekalian zakat fitrah Story 22 diperbarui ke Rp50.000 (SK Ketua BAZNAS RI 14/2026, dari berita).

**Apps touched:** `enem-landing-tools`, `enem-landing-api` (seed registry)

**Depends on:** Story 20, Story 22, Story 25

## Background

Pencarian kalkulator waris Islam stabil sepanjang tahun, sementara fidyah
dan kafarat melonjak saat Ramadan. Bersama zakat dan jadwal sholat
(Story 36), ketiganya melengkapi kelompok tool ibadah.

## Goal

1. `/kalkulator-waris`: pembagian harta waris menurut faraid.
2. `/kalkulator-fidyah` dan `/kalkulator-kafarat`.

## Keputusan awal

1. **Faraid dibatasi pada kasus yang umum dan disepakati** di rilis pertama:
   ahli waris utama (suami/istri, anak laki-laki/perempuan, ayah, ibu,
   kakek, nenek, saudara), bagian tetap (ashabul furudh), ashabah, hajb
   (penghalang), aul, dan radd. Kasus khusus yang ulama berbeda pendapat
   (mis. gharrawain, musytarakah) ditampilkan dengan catatan atau
   dikecualikan.
2. **Wajib ditinjau oleh orang yang kompeten** di bidang faraid sebelum
   rilis, dengan contoh kasus dari buku/rujukan yang dicantumkan.
3. **Disclaimer kuat:** hasil bukan fatwa atau putusan; pembagian harta
   sebaiknya dikonsultasikan dengan ahli dan disepakati keluarga. Tidak
   mencakup hukum waris perdata atau adat.
4. **Fidyah dan kafarat:** nilai fidyah per hari mengikuti ketetapan
   BAZNAS (uang atau makanan pokok), dengan data per tahun yang bisa
   diubah pengguna.

## Scope

- Waris: harta bersih (setelah utang, wasiat maksimal sepertiga, biaya
  jenazah), daftar ahli waris yang ada, hasil bagian tiap ahli waris
  (pecahan dan rupiah) beserta alasannya (mis. "ibu mendapat 1/6 karena ada
  anak").
- Fidyah: jumlah hari, uang atau beras per hari.
- Kafarat: jenis pelanggaran dan bentuk kafaratnya (informasi), dengan
  hitungan nominal bila relevan.
- FAQ, sumber, JSON-LD.

## Monetisasi

Konservatif seperti halaman zakat (Story 22): filter iklan ketat, iklan
bisa dimatikan per tool, tanpa CTA donasi di dekat hasil.

## Out of scope

- Waris perdata (KUH Perdata) dan waris adat.
- Kasus faraid yang diperselisihkan, kecuali sebagai catatan.

## Acceptance Criteria

- [ ] Unit test faraid untuk minimal 15 kasus dari rujukan yang
      dicantumkan, termasuk aul dan radd; total bagian selalu tepat 100%.
- [ ] Tinjauan oleh orang yang kompeten tercatat di PR.
- [x] Disclaimer tampil di atas hasil.
- [ ] Muncul di registry (Story 25), punya meta/JSON-LD, masuk sitemap.
- [x] Tidak ada request jaringan yang membawa nilai input pengguna.
- [x] `nx lint`, `nx test`, dan e2e dasar (buka halaman, isi input, hasil muncul) lulus.

## Referensi perhitungan

Dasar perhitungan dan data yang dipakai tool ini (dicek 2026-11-06):

- Bagian ahli waris: QS An-Nisa 11, 12, dan 176. https://quran.kemenag.go.id/quran/per-ayat/surah/4?from=11&to=12
- Kompilasi Hukum Islam (Inpres 1/1991) Buku II tentang Hukum Kewarisan. https://peraturan.bpk.go.id/Details/224221/inpres-no-1-tahun-1991
- Kaidah faraid jumhur (ashabul furudh, ashabah bin nafsi/bil ghair/ma'al ghair, hajb, aul, radd tanpa suami/istri, gharrawain 1/3 sisa) mengikuti buku ajar faraid, mis. Muhammad Ali Ash-Shabuni, *Al-Mawarits fi asy-Syari'ah al-Islamiyyah* (terjemahan: Pembagian Waris Menurut Islam). Belum diverifikasi oleh ahli.
- Harta bersih: biaya jenazah, utang, lalu wasiat maks 1/3 (KHI Pasal 171 dan 195).
- Fidyah Rp65.000 per hari per jiwa: SK Ketua BAZNAS RI No. 14 Tahun 2026, dikutip Jawapos. https://www.jawapos.com/nasional/2602100086/baznas-tetapkan-zakat-fitrah-2026-sebesar-rp-50000-dan-fidyah-rp-65000-per-jiwa
- Dasar fidyah: QS Al-Baqarah 184. https://quran.kemenag.go.id/quran/per-ayat/surah/2?from=184&to=184
- Kafarat sumpah: QS Al-Maidah 89. https://quran.kemenag.go.id/quran/per-ayat/surah/5?from=89&to=89
- Kafarat zihar: QS Al-Mujadilah 3-4. https://quran.kemenag.go.id/quran/per-ayat/surah/58?from=3&to=4
- Kafarat jima' di siang Ramadan: HR Bukhari dan Muslim.
- Data di kode: `app/data/fidyah.ts`, `app/utils/faraid/`.
