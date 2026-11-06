# Story 45: Kalkulator Waris Islam (Faraid), Fidyah, dan Kafarat

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
- [ ] Disclaimer tampil di atas hasil.
- [ ] Muncul di registry (Story 25), punya meta/JSON-LD, masuk sitemap.
- [ ] Tidak ada request jaringan yang membawa nilai input pengguna.
- [ ] `nx lint`, `nx test`, dan e2e dasar (buka halaman, isi input, hasil muncul) lulus.
