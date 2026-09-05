# Story 13: Activity Tracking - Fondasi (Visitor/Session ID, Toggle Config, Pageview & Device Analytics)

**Depends on:** 06 (enem-landing-api), 07 (enem-landing-cms), 08 (enem-landing-web)

**Apps touched:** `enem-landing-api`, `enem-landing-web`, `enem-landing-cms`

## Goal

Bangun fondasi activity tracking: identifikasi pengunjung anonim, mekanisme
toggle per-fitur yang dikontrol dari CMS tanpa perlu redeploy, pencatatan
pageview + info device/referrer, dan dashboard dasar di CMS. Fase-fase
berikutnya (event/funnel, heatmap, session recording) dibangun di atas
fondasi ini.

## Kenapa

Fitur lanjutan (funnel, heatmap, session recording) semuanya butuh
visitor/session id yang konsisten dan mekanisme toggle yang sama. Membangun
ini duluan sebagai fase terpisah supaya tiap fase berikutnya bisa dites
independen di atas pondasi yang sudah stabil, sesuai keputusan bertahap di
[12-epic-activity-tracking-overview.md](12-epic-activity-tracking-overview.md).

## Scope

### Modul baru `tracking` di `enem-landing-api`

- `TrackingSettingsEntity` — single-row settings (`pageviewEnabled`,
  `eventsEnabled`, `heatmapEnabled`, `sessionRecordingEnabled`, semua
  default `false` sampai diaktifkan lewat CMS), pola get-or-create sama
  seperti `SiteProfileEntity` (lihat
  [06-enem-landing-api.md](06-enem-landing-api.md)).
- `TrackingSessionEntity` (`id` uuid, `visitorId`, `startedAt`, `endedAt`
  nullable, `referrer`, `utmSource`/`utmMedium`/`utmCampaign` nullable,
  `country` nullable, plus device/browser info diambil selengkap mungkin
  dari `ua-parser-js` (permintaan user 2026-09-05: "track semua... jangan
  sampai ada yang kelewat") — `deviceType`/`deviceVendor`/`deviceModel`,
  `browserName`/`browserVersion`, `engineName`/`engineVersion`,
  `osName`/`osVersion`, `cpuArchitecture`, plus `language`/`timezone`/
  `screenWidth`/`screenHeight` yang dikirim dari client (browser) karena
  ini info yang cuma browser sendiri yang tahu akurat, tidak bisa
  diturunkan dari `User-Agent` — `language` fallback ke parsing header
  `Accept-Language` kalau client tidak mengirimkannya).
- `TrackingPageviewEntity` (`id`, `sessionId` FK, `path`, `enteredAt`,
  `durationMs` nullable — diisi belakangan lewat
  `beforeunload`/`visibilitychange` beacon).
- `GET /tracking/config` — endpoint publik, return 4 flag toggle, di-cache
  lewat `CacheService` (`libs/backend/cache`) dengan TTL pendek (mis. 60
  detik) supaya perubahan toggle di CMS tidak butuh nunggu lama untuk
  kepakai, tapi tetap tidak query DB tiap page load.
- `POST /tracking/session` — buat/update session (dipanggil sekali per
  kunjungan baru).
- `POST /tracking/pageview` — catat pageview per perpindahan route. Body
  berisi array (batched) untuk kasus navigasi SPA yang cepat.
- `GET /tracking/settings` + `PUT /tracking/settings` — admin-only
  (`SsoAuthGuard` + `assertAdminRole`, pola sama seperti modul lain),
  dipakai halaman toggle CMS. `PUT` invalidasi cache `/tracking/config`.
- `GET /tracking/overview` — admin-only, data teragregasi untuk dashboard
  (jumlah pageview per hari, top pages, top referrer, breakdown
  device/browser).
- Device/browser/OS di-parse dari header `User-Agent` di backend (bukan
  library client-side, supaya bundle publik tetap kecil) — pertimbangkan
  `ua-parser-js` sebagai dependency baru.
- Migration TypeORM baru untuk 3 tabel di atas (`tracking_settings`,
  `tracking_sessions`, `tracking_pageviews`), tipe kolom MySQL standar
  (bukan `jsonb`).

### BFF `enem-landing-web`

- Route baru `server/api/tracking/config.get.ts`,
  `server/api/tracking/session.post.ts`,
  `server/api/tracking/pageview.post.ts` — proxy tipis ke
  `enem-landing-api` lewat `createApiClient` (pola sama seperti
  `server/api/site-profile/index.get.ts`), tetap menyembunyikan host API
  asli dari browser.
- Plugin/composable client `useTracker()` (atau Nuxt plugin) yang:
  - generate & simpan `visitorId` (localStorage) dan `sessionId`
    (sessionStorage, TTL ~30 menit inaktivitas).
  - fetch `/api/tracking/config` sekali di awal, simpan flag di state.
  - kalau `pageviewEnabled`, kirim pageview tiap `page:finish`/route
    change Nuxt, plus durasi halaman sebelumnya lewat `sendBeacon` saat
    unload/hide.
  - expose flag toggle ke composable lain (dipakai fase 14-16 nanti)
    supaya semua tracker lain cek flag yang sama, bukan fetch config
    ulang.

### `enem-landing-cms`

- Halaman baru "Activity Tracking" > "Settings"
  (`app/pages/activity-tracking/settings.vue`) — 4 toggle switch, pola
  `CFormPage` yang sudah ada.
- Halaman "Activity Tracking" > "Overview"
  (`app/pages/activity-tracking/index.vue`) — chart pageview per waktu, top
  pages, referrer, device breakdown (pakai skill `dataviz` saat
  implementasi chart), plus peta sebaran visitor (lihat poin Leaflet di
  bawah).
- Entry sidebar baru di `dashboard.vue` layout.
- **Halaman Dashboard utama** (`app/pages/index.vue`, saat ini cuma berisi
  daftar menu) ditambah widget ringkas statistik activity tracking (mis.
  pageview hari ini, sesi aktif, top country) di atas daftar menu yang
  sudah ada — supaya angka activity tracking langsung kelihatan tanpa perlu
  masuk ke halaman "Activity Tracking" terpisah. Reuse endpoint
  `GET /tracking/overview` yang sama dengan halaman Overview (bukan bikin
  endpoint duplikat), cukup render subset datanya di sini.
- **Peta (map) pakai Leaflet** (`leaflet` + `@types/leaflet`, tile layer
  OpenStreetMap — gratis, tanpa API key/akun) untuk visualisasi sebaran
  lokasi visitor (dari `latitude`/`longitude` hasil `geoip-lite` di
  `TrackingSessionEntity`) — dipakai di halaman Dashboard utama (versi
  ringkas) dan halaman "Activity Tracking" > "Overview" (versi lebih
  detail). Karena Leaflet butuh `window`/`document`, komponen peta harus
  di-render client-only (Nuxt `<ClientOnly>` atau inisialisasi di
  `onMounted`).

## Acceptance Criteria

- [x] Migration `tracking_settings`/`tracking_sessions`/`tracking_pageviews`
      sukses jalan di MySQL lokal.
- [x] Toggle di CMS mengubah `GET /tracking/config` dalam <=60 detik
      (sesuai TTL cache) tanpa redeploy `enem-landing-web`.
- [x] Saat `pageviewEnabled=false`, tidak ada request tracking sama sekali
      dari browser (diverifikasi lewat network tab) — toggle mati harus
      benar-benar mati, bukan cuma skip simpan di server.
- [x] Pageview tercatat dengan `referrer`, UTM (kalau ada di query string),
      device/browser/OS terparsir benar dari User-Agent riil (diverifikasi
      end-to-end lewat BFF `enem-landing-web` dengan UA Chrome/macOS asli
      setelah fix bug forwarding header - lihat catatan bug di bawah).
- [x] Visitor yang sama (browser sama, tidak clear storage) mempertahankan
      `visitorId` yang sama lintas kunjungan (diverifikasi: reload browser
      tidak memicu `POST /tracking/session` baru). Timeout 30 menit
      inaktivitas tervalidasi lewat code review logic, tidak ditunggu
      secara empiris (butuh 30 menit nyata untuk diamati).
- [x] Dashboard Overview di CMS menampilkan data yang cocok dengan isi
      tabel `tracking_pageviews`/`tracking_sessions` (diverifikasi visual
      di browser dengan data asli - pageview count, top pages, referrer,
      device breakdown semua cocok).
- [x] Halaman Dashboard utama (`/`) menampilkan widget statistik activity
      tracking (pageview hari ini, sesi aktif, top country) tanpa merusak
      tampilan menu yang sudah ada.
- [x] Peta Leaflet merender tanpa error di halaman Dashboard & Activity
      Tracking Overview (dikonfirmasi lewat console + page text, atribusi
      "Leaflet | © OpenStreetMap contributors" muncul). **Catatan**: semua
      sesi uji berasal dari `localhost`, jadi `latitude`/`longitude` selalu
      null (geoip-lite tidak bisa resolve loopback) — perilaku "skip marker
      tanpa koordinat" belum divalidasi visual dengan marker sungguhan di
      peta, cuma divalidasi lewat query backend yang memang memfilter
      `WHERE latitude IS NOT NULL` sebelum data sampai ke frontend.
- [x] Unit test (Vitest) untuk `TrackingService`/`TrackingSettingsService`
      di `enem-landing-api` (8 test, semua lulus).
- [x] `nx build` semua app yang tersentuh (`enem-landing-api`,
      `enem-landing-web`, `enem-landing-cms`) sukses.

## Status: SELESAI (2026-09-05)

Bug nyata yang ditemukan & diperbaiki selama implementasi:
- `TypeORM DataTypeNotSupportedError: Data type "Object"` pada semua kolom
  nullable bertipe `string | null` di `TrackingSessionEntity` — persis bug
  yang sama seperti yang didokumentasikan di
  [06-enem-landing-api.md](06-enem-landing-api.md) (union type ke-infer
  jadi `Object` lewat `emitDecoratorMetadata`). Fix: tambah `type:
  'varchar'` eksplisit di tiap decorator `@Column`.
- **BFF `enem-landing-web` tidak meneruskan header `User-Agent`/
  `Accept-Language` asli pengunjung** ke `enem-landing-api` — karena route
  `server/api/tracking/session.post.ts` jalan di server Nuxt, request
  lanjutan ke `enem-landing-api` secara default membawa User-Agent proses
  Node/axios, bukan milik browser pengunjung. Akibatnya `browserName`/
  `osName`/`deviceVendor` selalu `NULL` walau dites dari browser
  sungguhan. Ditemukan lewat pengecekan manual isi tabel `tracking_sessions`
  setelah testing di browser (bukan cuma percaya hasil curl dengan UA
  buatan). Fix: teruskan header asli secara eksplisit di route BFF
  tersebut.
- Duplikasi pageview: plugin sempat memanggil `trackPageview()` dua kali
  untuk page load pertama (sekali manual, sekali lagi lewat hook Nuxt
  `page:finish` yang ternyata juga fire untuk initial load). Fix: hapus
  panggilan manual, andalkan hook `page:finish` saja.
- Format tanggal `pageviewsByDay` di `GET /tracking/overview` awalnya
  balikin ISO timestamp penuh (`2026-09-04T17:00:00.000Z`) alih-alih
  `YYYY-MM-DD` karena mysql2 mengembalikan hasil `DATE()` sebagai objek
  `Date` JS yang di-serialize penuh lewat JSON. Fix: format eksplisit ke
  `YYYY-MM-DD` sebelum dikirim ke response.
- 3 spec file lama yang tidak berhubungan dengan story ini
  (`site-profile.service.spec.ts`, `skills.service.spec.ts`,
  `experiences.service.spec.ts`) ternyata sudah rusak sebelum story ini
  dimulai — meng-instantiate service tanpa mock `cacheService` kedua,
  menyebabkan `TypeError: Cannot read properties of undefined`. Dikonfirmasi
  lewat `git stash` bahwa ini pre-existing, bukan regresi dari story ini.
  Diperbaiki atas persetujuan user karena memblokir `nx test
  enem-landing-api` secara keseluruhan.
