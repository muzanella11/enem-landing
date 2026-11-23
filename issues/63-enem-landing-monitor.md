# Story 63: App Baru `enem-landing-monitor` dan `enem-landing-monitor-api`

**Status:** Done (2026-11-23)

**Apps touched:** app baru `enem-landing-monitor` (Nuxt),
`enem-landing-monitor-api` (NestJS), dan `enem-landing-monitor-e2e`,
`enem-landing-account-api` (CORS), `compose.yml`, `compose.prod.yml`,
`compose.dev.yml`, `.github/workflows`, `infra/ansible`

**Depends on:** Story 10 (infra/CI-CD), Story 04 (account-web SSO)

**Dikerjakan sebelum:** Story 64 (menu Server, DB, Redis, Apps di monitor)

## Background

Hasil brainstorm 2026-11-23. Awalnya menu log server direncanakan masuk ke
CMS, tapi diputuskan membuat app terpisah, lengkap dengan backend sendiri,
karena:

- **Fungsi berbeda.** CMS untuk mengelola konten, sedangkan log dan
  monitoring adalah urusan operasional server.
- **Keamanan.** Log berisi data paling sensitif di sistem ini (IP,
  username, query, detail server). Lebih aman kalau tidak berada di
  aplikasi yang sehari-hari dipakai untuk mengedit konten dan upload file.
  Kalau CMS kena XSS atau session-nya bocor, log tidak ikut terbuka.
- **Backend terpisah dari `enem-landing-api`.** `enem-landing-api` melayani
  situs publik (blog, tools, tracking, contact form). Endpoint monitoring
  yang sensitif tidak ikut menambah permukaan serangan API itu, dan
  sebaliknya beban atau crash di salah satu API tidak saling mengganggu.
  Saat `enem-landing-api` crash-loop (outage Upstash 2026-11-18), monitor
  tetap bisa dipakai untuk melihat penyebabnya.
- **Scope cenderung tumbuh.** Dari brainstorm sudah muncul ide alert,
  uptime, container crash, slow query, dan statistik MySQL serta Redis.
- **RAM masih cukup.** Sekitar 2 GB available (dicek 2026-11-23). Setelah
  MySQL self-host (Story 61, sekitar 500 MB), monitor, dan monitor-api
  (sekitar 150 MB per environment), masih tersisa lebih dari 1 GB.

## Goal

App `enem-landing-monitor` jalan di `monitor.muzanella.com` (prod) dan
`dev-monitor.muzanella.com` (dev), didukung backend internal
`enem-landing-monitor-api`, hanya bisa dipakai `SuperAdmin` lewat login SSO
yang sama dengan CMS, dan siap diisi fitur monitoring mulai Story 64.

## Arsitektur

```
browser -> monitor.muzanella.com (Traefik, cloudflare-only)
  -> enem-landing-monitor (Nuxt, BFF server/api/**)
  -> enem-landing-monitor-api (NestJS, internal, SsoAuthGuard + SuperAdmin)
       -> enem-landing-account-api (validasi token SSO)
       -> layanan internal lain (log-reader di Story 64, Redis, MySQL)
```

## Keputusan awal

1. **Frontend `enem-landing-monitor` (Nuxt)** dengan pola yang sama seperti
   `enem-landing-cms`:
   - Vuetify dengan layout dashboard (sidebar dan app bar) seperti
     `apps/enem-landing-cms/app/layouts/dashboard.vue`. Kalau layout ini
     cocok dijadikan komponen bersama, pindahkan ke lib
     (`@enem-landing/frontend`) daripada menyalin;
   - BFF di `server/api/**` memanggil **`enem-landing-monitor-api`** (bukan
     `enem-landing-api`) lewat `createApiClient` dan `handleApiError`,
     dengan pola sama seperti `apps/enem-landing-cms/server/utils/api-client.ts`.
     Host-nya runtimeConfig server-only (`NUXT_MONITOR_API_HOST`), tidak
     pernah `public`;
   - port internal **4003**, mengikuti pola port mau-apps: satu indeks
     per produk di semua lapisan (API `300N`, web admin `400N`, landing
     `800N`). Indeks 2 sudah dipakai tools (`8002`), jadi monitor memakai
     indeks 3: monitor `4003` berpasangan dengan monitor-api `3003`.
2. **Backend `enem-landing-monitor-api` (NestJS)** dengan pola yang sama
   seperti `enem-landing-api`:
   - **internal-only**: `traefik.enable=false`, tidak mem-publish port,
     hanya dipanggil oleh BFF monitor lewat overlay network;
   - port internal **3003** (indeks 3, lihat frontend di atas), sepasang dengan
     monitor `4003`;
   - semua controller memakai `SsoAuthGuard` dari `@enem-landing/backend-sso`
     (`ACCOUNT_API_HOST=http://enem-landing-account-api:3000`) ditambah
     **`assertSuperAdminRole`**. Helper ini sebaiknya diletakkan di lib
     bersama (misalnya `@enem-landing/backend-sso`), bersama
     `assertAdminRole` yang sekarang ada di
     `apps/enem-landing-api/src/app/common/`, supaya tidak diduplikasi;
   - guard SuperAdmin dipasang **global** (APP_GUARD), kecuali endpoint
     `GET /health`, supaya endpoint baru tidak bisa lupa dilindungi;
   - **tanpa database** di story ini. Kalau nanti butuh menyimpan data
     (misalnya riwayat alert), dibahas di story sendiri;
   - rate limit memakai `@enem-landing/backend-rate-limit` dengan Redis
     yang sudah ada, key prefix sendiri (misalnya `monitor`, dan
     `dev:monitor` di dev);
   - log setiap request (user, endpoint, waktu) sebagai audit trail dasar;
   - endpoint awal: `GET /health` (tanpa auth, dipakai healthcheck
     container) dan `GET /overview` (nama user, environment, versi
     monitor-api) untuk halaman awal.
3. **Login SSO dengan cookie bersama `.muzanella.com`**:
   - middleware global frontend memakai `useAuthGuard` dari
     `@enem-landing/frontend`, sama seperti
     `apps/enem-landing-cms/app/middleware/auth.global.ts`;
   - **hanya `Role.SuperAdmin`** yang diizinkan. `Admin` biasa diarahkan
     ke halaman `/unauthorized`. Pengecekan di frontend hanya untuk UX;
     pengaman sebenarnya ada di monitor-api;
   - origin monitor ditambahkan ke `CORS_ORIGIN` `enem-landing-account-api`
     (`https://monitor.muzanella.com` di `compose.yml`,
     `https://dev-monitor.muzanella.com` di `compose.dev.yml`).
4. **Bukan situs publik**:
   - header `X-Robots-Tag: noindex, nofollow` dan `robots.txt` yang
     menolak semua crawler;
   - tidak memasang tracker activity tracking, Google Analytics, maupun
     AdSense;
   - security header ketat: `X-Frame-Options: DENY` (atau CSP
     `frame-ancestors 'none'`), `Referrer-Policy: no-referrer`.
5. **Halaman awal**: `/` berisi Ringkasan dari `GET /overview` dan sidebar
   dengan menu yang diisi story berikutnya. Menu **Server**, **DB**,
   **Redis**, dan **Apps** ditambahkan di Story 64.
6. **Deploy dan infra**:
   - service `enem-landing-monitor` dan `enem-landing-monitor-api` di
     `compose.yml`. Frontend dengan label Traefik
     `Host(\`monitor.muzanella.com\`)`dan certresolver`cloudflare`, serta
override di `compose.dev.yml`untuk`dev-monitor.muzanella.com`;
   - limit memory awal (disesuaikan setelah melihat pemakaian nyata):

     | Service        | Prod           | Dev            |
     | -------------- | -------------- | -------------- |
     | monitor (Nuxt) | 192M, heap 120 | 160M, heap 100 |
     | monitor-api    | 192M, heap 120 | 160M, heap 100 |

   - ditambahkan ke `APPS_LIST` di `build-push.yml` (monitor dengan
     `nuxi prepare`, monitor-api dengan target `prune` seperti dua app
     NestJS lain), ke `e2e.yml`, dan ke daftar service di
     `infra/ansible/playbooks/deploy.yml`;
   - middleware Traefik `cloudflare-only` (Story 58) ikut berlaku untuk
     frontend.
7. **E2E** `enem-landing-monitor-e2e` (Playwright), minimal:
   - pengunjung yang belum login diarahkan ke account-web;
   - `Admin` biasa diarahkan ke `/unauthorized`;
   - `SuperAdmin` bisa membuka halaman awal dan melihat data dari
     `GET /overview`.
8. **Opsional, disarankan: Cloudflare Access** di depan
   `monitor.muzanella.com` dan `dev-monitor.muzanella.com` (free tier
   sampai 50 user). Pengunjung harus verifikasi email lewat Cloudflare
   sebelum request sampai ke VPS, jadi halaman login monitor pun tidak
   terlihat oleh orang lain. Belum diputuskan; kalau dipakai, cukup
   konfigurasi di dashboard Cloudflare dan dicatat di
   `infra/ansible/README.md`.

## Di luar scope

- Fitur monitoring apa pun (menu Server, DB, Redis, Apps ada di Story 64).
- Database untuk monitor-api.
- Memindahkan halaman Cache dari CMS ke monitor. Bisa jadi story
  berikutnya.
- Alerting, uptime check, dan dashboard metrik.
- Endpoint webhook penerima alert (pola seperti webhook mau-apps: URL dan
  key per webhook, log setiap request, lalu kirim notifikasi ke admin).
  Diputuskan 2026-11-23 untuk dibuat di app monitoring di story
  berikutnya. Pengguna pertamanya adalah backup harian MySQL
  (`mysql-backup.sh` mengirim POST JSON `{"content": ..., "text": ...}` ke
  `mysql_backup_notify_webhook_url` saat gagal). Sampai endpoint itu ada,
  URL tersebut dibiarkan kosong dan kegagalan backup hanya terlihat di
  `journalctl -u mysql-backup.service`.

## Acceptance criteria

- [ ] App `enem-landing-monitor`, `enem-landing-monitor-api`, dan
      `enem-landing-monitor-e2e` terdaftar di Nx, dengan target lint, test,
      build, dan e2e yang berjalan.
- [ ] `monitor.muzanella.com` dan `dev-monitor.muzanella.com` bisa diakses
      lewat HTTPS dan proxied Cloudflare.
- [ ] `enem-landing-monitor-api` tidak bisa dijangkau dari luar VPS (tidak
      ada router Traefik, tidak ada port publish).
- [ ] Pengunjung yang belum login diarahkan ke halaman login account-web,
      lalu kembali ke monitor setelah login.
- [ ] Hanya `SuperAdmin` yang bisa masuk; `Admin` biasa diarahkan ke
      `/unauthorized`, dan semua endpoint monitor-api selain `/health`
      mengembalikan 403 untuknya (401 tanpa token).
- [ ] Guard SuperAdmin terpasang global di monitor-api, dengan tes yang
      memastikan endpoint baru otomatis terlindungi.
- [ ] `assertSuperAdminRole` ada di lib bersama dan punya tes unit;
      `enem-landing-api` memakai `assertAdminRole` dari lib yang sama.
- [ ] Respons monitor membawa `X-Robots-Tag: noindex, nofollow`, dan
      `robots.txt` menolak semua crawler.
- [ ] Tidak ada script tracking, analytics, atau iklan di monitor.
- [ ] Image prod dan dev kedua app dibuild dan di-push oleh CI, lalu
      dideploy oleh `deploy.yml` bersama app lain.
- [ ] Limit memory diset di `compose.prod.yml` dan `compose.dev.yml`.
- [ ] `infra/ansible/README.md` dan `docs/github-actions-secrets.md`
      diperbarui (DNS, subdomain, CORS, service baru).
- [ ] Lint, format, test, build, dan e2e lulus lokal sebelum PR.

## Langkah manual setelah deploy

1. Tambah DNS record `monitor` dan `dev-monitor` di Cloudflare (proxied),
   mengarah ke IP VPS.
2. Deploy dev, lalu cek login di `dev-monitor.muzanella.com` dengan akun
   `SuperAdmin` dan akun `Admin` biasa.
3. Ulangi di prod.
4. Cek `curl -I https://monitor.muzanella.com` menampilkan
   `X-Robots-Tag`.
5. Cek `docker stats` untuk kedua service baru beberapa hari setelahnya.
6. Kalau Cloudflare Access dipakai, buat aplikasi Access untuk kedua
   subdomain dan tes dari browser yang belum verifikasi.

## Referensi

- Nuxt, route middleware:
  https://nuxt.com/docs/guide/directory-structure/middleware
- NestJS, global guards (`APP_GUARD`):
  https://docs.nestjs.com/guards#binding-guards
- Traefik, Docker Swarm provider labels:
  https://doc.traefik.io/traefik/routing/providers/swarm/
- Cloudflare Access (Zero Trust), self-hosted application:
  https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/self-hosted-public-app/
- `X-Robots-Tag`:
  https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
