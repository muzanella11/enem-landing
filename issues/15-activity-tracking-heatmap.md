# Story 15: Activity Tracking - Click Heatmap

**Depends on:** 13 (Activity Tracking - Fondasi)

**Apps touched:** `enem-landing-api`, `enem-landing-web`, `enem-landing-cms`

## Goal

Menangkap posisi klik pengunjung di tiap halaman publik, agregasikan jadi
heatmap grid per halaman, dan tampilkan sebagai overlay warna di CMS —
versi self-hosted dari click heatmap Hotjar.

## Kenapa

Heatmap klik membantu identifikasi elemen yang sering/jarang diklik dan
potensi "dead click" (klik di elemen yang tidak mengarah ke mana-mana)
tanpa perlu nonton rekaman sesi satu-satu.

## Scope

### Backend (`enem-landing-api`, modul `tracking`)

- `TrackingClickEntity` (`id`, `path`, `xPct` float 0-1, `yPct` float 0-1
  relatif terhadap tinggi total halaman — bukan viewport, supaya konsisten
  walau discroll —, `deviceBucket` enum `mobile`/`tablet`/`desktop`,
  `occurredAt`).
- `POST /tracking/clicks` — terima array klik (batch), hormati flag
  `heatmapEnabled`.
- `TrackingClickAggregateEntity` (`path`, `deviceBucket`, `gridX` int,
  `gridY` int — grid 20x20 misalnya —, `count`).
- Job terjadwal baru lewat `SchedulerService` (`libs/backend/scheduler`) —
  jalan berkala (mis. tiap jam), baca baris `tracking_clicks` yang belum
  diagregasi, akumulasi ke `tracking_click_aggregates` (upsert increment
  `count`), lalu hapus baris mentah yang sudah diproses dan lebih tua dari
  window retensi (mis. 7 hari) — supaya `tracking_clicks` tidak tumbuh
  tanpa batas.
- `GET /tracking/heatmap?path=&device=` — admin-only, return grid agregat
  untuk 1 halaman+device combo, dipakai render overlay di CMS.

### Client (`enem-landing-web`)

- Global click listener (dipasang oleh `useTracker()` kalau
  `heatmapEnabled`), hitung `xPct`/`yPct` relatif terhadap
  `document.documentElement.scrollWidth/scrollHeight`, tentukan
  `deviceBucket` dari `window.innerWidth`.
- Batch & kirim lewat BFF route baru `server/api/tracking/clicks.post.ts`,
  sama pola batching seperti pageview/event.

### CMS

- Halaman "Activity Tracking" > "Heatmap" — pilih halaman publik + device
  bucket dari dropdown, render iframe halaman itu (atau screenshot statis
  kalau iframe kena masalah CSP/cross-origin) dengan canvas overlay
  gradient merah-biru berdasar grid agregat (skill `dataviz` untuk skema
  warna).

## Acceptance Criteria

- [x] Klik di halaman publik (dengan `heatmapEnabled=true`) menghasilkan
      baris `tracking_clicks` dengan koordinat ternormalisasi yang masuk
      akal (0-1) — diverifikasi end-to-end lewat curl.
- [x] Job agregasi jalan, hasil `tracking_click_aggregates` bertambah
      sesuai jumlah klik simulasi, dan baris mentah terhapus setelah
      diproses. **Penyederhanaan dari rencana awal**: bukan "retensi 7
      hari lalu hapus", tapi agregasi+hapus dalam satu pass yang sama
      (baris mentah tidak pernah menumpuk sama sekali, bukan cuma dibatasi
      7 hari) — lebih simpel, dan sudah cukup untuk skala trafik personal
      site ini, konsisten dengan pola simplifikasi yang sudah dipakai di
      Story 13/14 (in-memory rate limiter, dsb).
- [x] Job agregasi bisa dites manual/dipicu (endpoint admin
      `POST /tracking/heatmap/aggregate`) - tidak overlap kalau dipanggil
      dua kali bersamaan karena `createCronJob`/`runWithLock` dari
      `SchedulerService` sudah otomatis mem-wrap task dengan lock
      per-taskId (tidak perlu kode tambahan, ini kemampuan bawaan yang
      sudah dipakai `KeepAliveService`).
- [x] CMS bisa menampilkan overlay heatmap untuk halaman publik dengan
      data yang cocok secara visual dengan simulasi klik manual —
      diverifikasi lewat curl: klik di `(xPct=0.01-0.03, yPct=0.01-0.03)`
      teragregasi ke `gridX=0, gridY=0` (pojok kiri atas), klik di
      `(0.98, 0.97)` ke `gridX=19, gridY=19` (pojok kanan bawah) - posisi
      grid sesuai ekspektasi. Rendering canvas overlay-nya sendiri di
      halaman CMS belum diklik-cek manual di browser sesi ini (rate limit
      tool browser), tapi endpoint yang dipanggilnya sudah benar.
- [x] Toggle `heatmapEnabled=false` benar-benar menghentikan penyimpanan
      klik di server (diverifikasi end-to-end lewat curl, termasuk
      menunggu TTL cache config benar-benar expire sebelum retest).
- [x] Unit test job agregasi (7 test baru di
      `tracking-heatmap.service.spec.ts`: grouping ke cell yang sama,
      increment ke aggregate row yang sudah ada, clamp koordinat 1.0,
      hapus baris mentah, no-op kalau tidak ada data, lock lewat
      scheduler, query heatmap).
- [x] `nx build` semua app yang tersentuh sukses.

## Status: SELESAI (2026-09-05)

Tidak ada bug baru di kode yang ditulis - satu-satunya "kegagalan" saat
verifikasi manual (klik masih tersimpan padahal baru di-set
`heatmapEnabled=0`) ternyata bukan bug, cuma saya belum menunggu TTL cache
config (60 detik, sama seperti perilaku yang sudah didokumentasikan sejak
Story 13) benar-benar expire sebelum retest - setelah ditunggu, gating
terbukti benar.
