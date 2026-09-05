# Epic: User Activity Tracking (Self-hosted, No Paid SaaS)

## Background

`enem-landing-web` saat ini tidak punya activity tracking sendiri — satu-satunya
jejak analytics adalah env var `GOOGLE_ANALYTICS_ID` di `.env-example`. User
ingin kapabilitas mirip Hotjar/Userpilot (pageview & device analytics, custom
event & funnel tracking, click heatmap, session recording) tapi dibangun
sendiri dan self-hosted — tanpa pakai tools berbayar pihak ketiga.

Hasil brainstorming sesi 2026-09-05.

## Keputusan arsitektur (hasil brainstorm)

1. **4 fitur**, masing-masing bisa di-toggle independen dari CMS (bukan cuma
   env var, DB-backed supaya berubah tanpa redeploy): pageview/device
   analytics, custom event & funnel tracking, click heatmap, session
   recording.
2. **Anonymous visitor/session id** — `visitorId` di localStorage (persisten
   lintas kunjungan), `sessionId` di sessionStorage (timeout ~30 menit
   inaktivitas). Tidak perlu login. **Privacy/consent sengaja ditunda**
   (keputusan user 2026-09-05) — perlu direvisit sebelum dianggap
   compliant untuk trafik publik luas (lihat Out of scope).
3. **Dikerjakan bertahap** — fondasi → custom event/funnel → click heatmap →
   session recording. Tiap fase = 1 story terpisah, bisa dites & dianggap
   selesai independen dari fase berikutnya.
4. **Ingest event dibatch di client**, bukan pakai Redis sebagai buffer
   perantara di server. Pageview, custom event, dan klik dikumpulkan di
   memory browser lalu dikirim periodik (mis. tiap beberapa detik atau saat
   `visibilitychange`/`beforeunload` lewat `sendBeacon`) sebagai satu
   request array, langsung bulk-insert ke DB. Ini mengikuti precedent yang
   sudah ada di [06-enem-landing-api.md](06-enem-landing-api.md) — rate
   limiting `contact-submissions` sengaja pakai in-memory `Map`, bukan
   Redis, karena skala project ini tidak butuh; batching di client sudah
   cukup mengurangi write amplification tanpa nambah dependency infra baru.
5. **Redis tetap dipakai**, tapi cuma untuk cache-aside `GET
   /tracking/config` (toggle) lewat `libs/backend/cache` yang sudah ada —
   pola yang sama seperti endpoint publik lain, supaya tiap page load tidak
   query DB tapi toggle CMS tetap kepakai cepat (TTL pendek).
6. **Agregasi click heatmap & pembersihan data lama** pakai
   `SchedulerService` (`libs/backend/scheduler`) yang sudah ada — job baca
   baris klik mentah, rollup jadi grid per halaman, lalu hapus baris mentah
   yang sudah lewat window retensi.
7. **Session recording pakai `rrweb`** (open-source, MIT) untuk capture +
   `rrweb-player` untuk replay — bukan reimplement DOM diffing dari nol.
8. **Upload rekaman ke Cloudflare R2 lewat rantai 3 layer**:
   `enem-landing-web` (BFF, Nuxt server route) → `enem-landing-api` (modul
   `tracking`, simpan metadata) → `enem-landing-account-api` (`/uploads`,
   reuse integrasi R2 yang sudah ada) → R2. `enem-landing-api` tidak perlu
   kredensial R2 sendiri. Object disimpan dengan prefix key khusus
   **`user-activity-tracking/`** (`dto.purpose = 'user-activity-tracking'`),
   terpisah dari prefix upload konten CMS yang sudah ada — supaya gampang
   dikasih lifecycle/retention rule sendiri di R2 tanpa bentrok dengan
   upload lain.
9. **Auth service-to-service** antara `enem-landing-api` dan
   `enem-landing-account-api` untuk panggilan upload ini pakai
   **shared-secret header** (guard baru, mis. `InternalApiGuard` +
   `INTERNAL_API_KEY` env var di kedua app) — endpoint `/uploads` yang ada
   sekarang cuma nerima `JwtAuthGuard` (user login asli), jadi butuh jalur
   baru untuk caller server-to-server.
10. **DB engine mengikuti `enem-landing-api` yang sudah ada: MySQL**
    (`mysql2` + TypeORM), bukan Postgres — kolom payload event pakai tipe
    `JSON` (MySQL native JSON type), bukan `jsonb`.

## Story index

| # | Story | Depends on |
|---|---|---|
| 13 | [Fondasi: visitor/session id, toggle config, pageview & device analytics](13-activity-tracking-foundation.md) | 06, 07, 08 |
| 14 | [Custom event & funnel tracking](14-activity-tracking-events-funnel.md) | 13 |
| 15 | [Click heatmap](15-activity-tracking-heatmap.md) | 13 |
| 16 | [Session recording (rrweb + upload ke R2)](16-activity-tracking-session-recording.md) | 13, 03 |

## Out of scope (untuk epic ini)

- Privacy/consent banner, kebijakan anonymisasi lanjutan — sengaja ditunda
  (keputusan user 2026-09-05), perlu story terpisah sebelum dianggap
  compliant untuk trafik publik yang lebih luas (mis. pengunjung dari
  region dengan aturan cookie consent).
- Migrasi dari atau penghapusan `GOOGLE_ANALYTICS_ID` — epic ini menambah
  tracking sendiri, tidak otomatis mencabut GA kalau masih dipakai
  terpisah.
- A/B testing atau feature flagging generik di luar toggle on/off 4 fitur
  tracking ini sendiri.
