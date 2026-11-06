# Story 27: Setup AdSense dari CMS (Slot ID, ads.txt, Verifikasi Situs)

**Apps touched:** `enem-landing-api`, `enem-landing-cms`, `enem-landing-tools`

**Depends on:** Story 20 (komponen `AdSlot`), Story 25 (pengaturan tools di CMS)

## Background

Saat mengecek alur deploy (sesi 2026-11-06), ditemukan tiga kekurangan pada
setup AdSense hasil Story 20/25:

1. **ID slot iklan dibaca dari env** `NUXT_PUBLIC_ADSENSE_SLOT_*`, tapi
   `ADSENSE_SLOT_*` tidak ada di `app_env` workflow prod/dev, jadi nilainya
   selalu kosong di server walaupun diisi di GitHub.
2. **Belum ada `/ads.txt`.** AdSense mewajibkan file ini berisi publisher ID;
   tanpa itu pendapatan bisa dibatasi.
3. **Belum ada kode verifikasi situs.** Script AdSense baru dimuat setelah
   iklan dinyalakan dan slot terisi, padahal Google butuh kode terpasang
   saat proses review.

## Goal

Seluruh setup AdSense cukup dilakukan dari CMS, tanpa env var dan tanpa
deploy ulang.

## Keputusan awal

1. **ID slot pindah ke CMS:** kolom baru `adsenseSlotResult` dan
   `adsenseSlotSidebar` di `tools_settings`, ikut disajikan lewat
   `GET /tools/config`. Env `NUXT_PUBLIC_ADSENSE_SLOT_*` dihapus dari app,
   compose, dan `.env.example`.
2. **`/ads.txt` dibuat server route** di `enem-landing-tools` dari publisher
   ID di CMS: `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`.
   Bila publisher ID kosong, route mengembalikan 404. Di-cache singkat
   (mis. 10 menit).
3. **Tag verifikasi** `<meta name="google-adsense-account" content="ca-pub-...">`
   dipasang di semua halaman begitu publisher ID terisi, walaupun saklar
   iklan masih mati. Ini metode verifikasi meta tag yang didukung AdSense,
   sehingga situs bisa direview tanpa memuat script iklan.
4. Validasi format slot ID di API (angka 10 digit, sesuai format AdSense
   saat implementasi; dicek ulang).

## Scope

- Migrasi: dua kolom slot di `tools_settings`.
- API: DTO dan `getPublicConfig` menyertakan slot; CMS Pengaturan Tools
  menampilkan kolom slot dan panduan singkat urutan setup.
- Tools app: `AdSlot` membaca slot dari config; route `/ads.txt`; meta tag
  verifikasi di layout; `robots.txt` tetap mengizinkan crawler AdSense.
- Hapus `ADSENSE_SLOT_*` dari compose dan dokumentasi Story 20.
- Panduan di CMS (teks bantuan): daftar situs di AdSense, isi publisher ID,
  tunggu review, buat ad unit, isi slot, nyalakan saklar, blokir kategori.

## Out of scope

- Auto ads AdSense (penempatan otomatis bertentangan dengan aturan
  penempatan iklan Story 20).
- Laporan pendapatan AdSense di CMS.

## Acceptance Criteria

- [ ] Mengisi slot ID di CMS membuat slot iklan tampil tanpa deploy, dalam
      TTL cache + SWR.
- [ ] `/ads.txt` berisi baris yang benar saat publisher ID terisi, 404 saat
      kosong.
- [ ] Meta tag verifikasi ada di HTML server-rendered semua halaman saat
      publisher ID terisi, dan script `adsbygoogle.js` tetap tidak dimuat
      selama saklar iklan mati.
- [ ] Tidak ada lagi referensi `ADSENSE_SLOT_*` di compose, workflow, dan
      `.env.example`.
- [ ] Unit test API untuk validasi slot dan config publik; e2e tools untuk
      `/ads.txt` dan meta tag.
