# Story 10: Infra & CI/CD

**Depends on:** 03, 06, 07, 08, 09
**Output path:** `refactor/` (Dockerfiles, compose files, `infra/ansible/*`,
`.github/workflows/*`)

## Goal

Siapkan containerization, provisioning server (Ansible + Traefik), dan
pipeline CI/CD (GitHub Actions) untuk 5 app baru (dev & prod), menggantikan
setup Drone + single-container saat ini sepenuhnya, mengikuti pola
`mau-apps` (lihat `mau-apps/infra/`, `mau-apps/.github/workflows/`,
`mau-apps/compose.yml` + `compose.prod.yml`, `mau-apps/docs/INFRA_ARCHITECTURE.md`
sebagai referensi konkret).

## Kenapa

Keputusan terbaru (2026-08-31): Drone akan dihapus dari proyek ini, dan
infra dipindah agar konsisten dengan mau-apps — Ansible untuk provisioning
server, Traefik sebagai reverse proxy, DB managed via **Aiven** (MySQL),
Redis managed via **Upstash**. Setup lama (SSH manual + `docker run` satu
container, `.drone.yml` root repo) sepenuhnya digantikan, bukan
dipertahankan paralel.

## Scope

### Managed services
- **Database**: Aiven MySQL (koreksi 2026-08-31 dari rencana awal yang
  salah duga Postgres — mau-apps sendiri pakai MySQL, `enem-landing-account-api`
  sudah pakai `mysql2` + migration TypeORM `Table` builder API, terverifikasi
  jalan terhadap MySQL 8 lokal di story 03). Provisioning database lewat
  `scripts/provision-db.sh` (story 09) — 2 database terpisah
  (`enem_landing_account`, `enem_landing_api`), sesuai keputusan story 03/06.
- **Redis**: Upstash. Dipakai oleh `enem-landing-account-api` (token blocklist) dan
  `enem-landing-api` (rate-limit store) — lihat `libs/backend/redis` di
  story 02. Perhatikan `REDIS_TLS_ENABLED=true` wajib untuk Upstash, dan
  pertimbangkan `REDIS_KEY_PREFIX` kalau dev/prod berbagi satu instance
  free-tier Upstash (pola sama seperti catatan di
  `mau-apps/libs/backend/redis/src/lib/redis.constants.ts`).

### Dockerfiles
- Satu `Dockerfile` per app-type (`Dockerfile.nest`, `Dockerfile.nuxt`) atau
  1 Dockerfile besar dengan build arg `APP_NAME` (pola
  `mau-apps/Dockerfile`, single file parametrized) — putuskan saat
  implementasi mana yang lebih maintainable untuk 5 app. Base image Node 26.

### `compose.yml` + `compose.prod.yml`
- Service: `enem-landing-account-api`, `enem-landing-account-web`, `enem-landing-api`,
  `enem-landing-cms`, `enem-landing-web`. Tidak perlu service `mysql`/
  `redis` lokal di compose prod (managed via Aiven/Upstash) — tapi
  `compose.yml` (dev) boleh tetap sediakan MySQL+Redis lokal via
  container untuk dev tanpa dependency ke layanan managed (persis pola yang
  sudah dipakai manual di story 03 lewat container docker `mysql`/`redis`),
  mirror opsi dev di `mau-apps/compose.dev.yml`.
- Networking internal antar service + label Traefik per service (routing
  rule, TLS) mengikuti pola `mau-apps/infra/ansible/playbooks/templates/traefik-stack.yml.j2`.

### Reverse proxy / routing — Traefik
Resolusi dari open question sebelumnya (subdomain vs path-based): ikuti
pola mau-apps, **Traefik + subdomain per app**, mis.:
```
enem-landing-web         -> domain utama (mis. muzanella.com atau apex domain situs)
enem-landing-cms         -> cms.<domain>
enem-landing-account-web -> account.<domain>
enem-landing-api         -> api.<domain>
enem-landing-account-api     -> account-api.<domain> (atau internal-only, tidak exposed
                             publik kalau enem-landing-account-web memanggilnya lewat
                             internal Docker network, bukan lewat public internet —
                             putuskan saat implementasi mana yang lebih aman & simple)
```
DNS record tambahan perlu disiapkan untuk subdomain-subdomain ini sebelum
story 11 (cutover) dieksekusi.

### Ansible provisioning
Lihat detail di [09-dev-tooling-scripts.md](09-dev-tooling-scripts.md) —
`scripts/provision-server.sh` + `infra/ansible/` (playbooks `init-server.yml`,
`deploy.yml`, `deploy-secrets.yml`, template Traefik) di-port dari mau-apps,
diskalakan ke 5 service.

### CI/CD — GitHub Actions (gantikan Drone sepenuhnya)
Port dari `mau-apps/.github/workflows/` (`lint.yml`, `test.yml`,
`build-push.yml`, `e2e.yml`, `migrate.yml`, `mau-apps-dev.yml`,
`mau-apps-prod.yml`), disesuaikan nama app:
- `lint.yml` / `test.yml` — jalan `nx affected -t lint,test` per PR/push.
- `e2e.yml` — jalan Playwright e2e (`enem-landing-cms-e2e`,
  `enem-landing-web-e2e`, `enem-landing-account-web-e2e`) per PR/push.
- `build-push.yml` — build image Docker per app, push ke registry (GHCR,
  mirror mau-apps).
- `migrate.yml` — jalankan TypeORM migration (`enem-landing-account-api`,
  `enem-landing-api`) terhadap Aiven MySQL sebelum deploy.
- `enem-landing-dev.yml` / `enem-landing-prod.yml` — trigger deploy (panggil
  `scripts/deploy.sh` via SSH ke VPS yang sudah diprovisi Ansible), mirror
  `mau-apps-dev.yml`/`mau-apps-prod.yml`.
- Nx Cloud (`nxCloudId`, seperti `mau-apps/nx.json`) untuk cache remote di
  CI — evaluasi saat implementasi, opsional tapi murah untuk proyek sekecil
  ini kalau free tier cukup.

### Penghapusan Drone
- Hapus `.drone.yml` dari root repo saat cutover (story 11), setelah
  pipeline GitHub Actions terverifikasi jalan penuh (lint, test, e2e,
  build-push, deploy) — jangan hapus Drone sebelum GitHub Actions terbukti
  bisa deploy ke production dengan sukses, supaya tidak ada gap CI/CD di
  tengah transisi.
- Hapus secret-secret Drone (`SSH_HOST`, `SSH_USER`, `SSH_PASSWORD` di Drone
  settings) setelah dipastikan tidak dipakai lagi, ganti dengan GitHub
  Actions secrets (deploy key SSH ala `mau-apps` yang pakai
  `~/.ssh/id_ed25519_mau_deploy` — buat key setara untuk enem-landing).

## Acceptance Criteria

- [x] `docker compose -f compose.yml up` (dev) menjalankan semua 5 service
      (+ MySQL/Redis lokal untuk dev), saling terhubung (cms bisa hit
      api, api/cms bisa hit sso). Diverifikasi sebagai
      `docker compose -f compose.yml -f compose.local.yml up --build`
      (`compose.local.yml` - file baru, bukan `compose.dev.yml`, lihat
      Status di bawah untuk kenapa) - real container, real MySQL/Redis,
      migration dijalankan, konektivitas silang dites lewat BFF route
      sungguhan (bukan cuma raw network reachability): web/cms -> api,
      cms/account-web -> account-api. 2 bug nyata ditemukan & diperbaiki
      dari test ini, lihat Status.
- [ ] `scripts/provision-server.sh` berhasil menyiapkan VPS baru (Docker +
      Traefik) dari kosong, idempotent kalau dijalankan ulang. Tidak
      berubah dari story 09 - masih belum ada VPS sungguhan untuk
      diverifikasi.
- [ ] `scripts/deploy.sh` berhasil deploy compose.prod.yml stack ke server
      yang sudah diprovisi, terhubung ke Aiven MySQL + Upstash Redis.
      `compose.prod.yml` sudah dibuat (memory tuning ala mau-apps) tapi
      rollout sungguhan ke server nyata belum bisa diverifikasi - sama
      seperti di atas.
- [ ] Semua subdomain (`cms.<domain>`, `sso.<domain>`, `api.<domain>`, domain
      utama) resolve dan terlayani via Traefik dengan TLS aktif. Label
      Traefik sudah ditulis di `compose.yml` (domain masih placeholder
      `enem-landing.com`, lihat catatan di file itu) - DNS/TLS sungguhan
      butuh VPS + domain asli, tidak bisa diverifikasi di sini.
- [ ] GitHub Actions workflows (lint/test/e2e/build-push/migrate/deploy)
      jalan sukses end-to-end minimal sekali sebelum `.drone.yml` dihapus.
      Belum dibuat sama sekali - scope tersisa story 10.
- [x] `enem-landing-account-api` (identity provider) diputuskan exposed publik atau
      internal-only, didokumentasikan alasannya di `infra/ansible/README.md`
      versi enem-landing. Diputuskan internal-only, dengan bukti grep
      konkret (lihat README).

## Out of scope

- Observability/monitoring (log aggregation, uptime alerting) — bukan
  bagian dari refactor ini kecuali sudah ada sebelumnya dan perlu
  dipertahankan.
- RabbitMQ/message queue — tidak relevan untuk enem-landing (mau-apps
  pakai untuk domain topup/notification yang tidak ada di sini).

## Status: SEBAGIAN (Dockerfile + compose.yml/dev/prod/local selesai dan
## terverifikasi lokal; GitHub Actions + provisioning VPS sungguhan masih
## terbuka) (2026-09-01)

Dibangun: `Dockerfile` (multi-stage, 1 target per app, base `node:26-alpine`
- workspace ini target Node >=26, bukan `node:20-alpine` mau-apps),
`compose.yml` (base Swarm stack, label Traefik per service, port internal
diverifikasi dari `Dockerfile`/`scripts/kill-ports.sh`, bukan diasumsikan),
`compose.dev.yml` + `compose.prod.yml` (overlay environment ala mau-apps -
image tag `:dev`/`:prod` + `compose.prod.yml`'s `NODE_OPTIONS=
--max-old-space-size=60` + `mem_limit: 100M` per container, budget 500 MB
total untuk 5 app, jauh di bawah mau-apps' era self-hosted MySQL/Redis
~1.7-2 GB karena enem-landing managed Aiven/Upstash sejak awal), dan
`compose.local.yml` (file BARU, bukan port dari mau-apps - lihat di bawah).

**Koreksi terhadap asumsi awal story ini**: dokumen ini awalnya bilang
`compose.yml` (dev) "mirror opsi dev di mau-apps/compose.dev.yml" untuk
MySQL/Redis lokal - salah setelah `mau-apps/compose.dev.yml` benar-benar
dibaca. File itu cuma overlay image tag `:dev` + `DATABASE_NAME` untuk
deploy Swarm ke VPS dev sungguhan (bukan laptop lokal) - developer
mau-apps jalankan `infra/mysql`/`infra/redis` standalone secara manual
untuk kerja lokal, bukan lewat satu file compose. `compose.dev.yml` di
sini dibuat SAMA PERSIS dengan makna mau-apps yang sebenarnya (overlay VPS
dev), dan `compose.local.yml` baru ditambahkan sebagai file terpisah yang
jujur namanya untuk kebutuhan asli story ini (dev laptop tanpa VPS/
registry/Aiven/Upstash) - MySQL+Redis lokal via container, database dibuat
lewat `infra/mysql/init/01-init-databases.sh` (ported dari
`mau-apps/infra/mysql/init/`), TIDAK di-publish ke port host 3306/6379
(container `mysql`/`redis`/`rabbitmq` lain yang sudah lama jalan di mesin
ini untuk proyek lain memakai port itu - dipakai port alternatif 3320/6390
kalau perlu akses manual dari host).

Diverifikasi sungguhan: `docker compose -f compose.yml -f compose.local.yml
up --build` - build ke-5 image, MySQL+Redis lokal healthy, migration
dijalankan (`nx run enem-landing-api:migration:run` /
`enem-landing-account-api:migration:run` terhadap MySQL compose), lalu
konektivitas silang dites lewat endpoint BFF SUNGGUHAN (bukan cuma raw
`wget`/network reachability): `enem-landing-web`/`enem-landing-cms` ->
`enem-landing-api` (`GET /api/experiences`, respon `[]` valid), dan
`enem-landing-cms`/`enem-landing-account-web` -> `enem-landing-account-api`
(`POST /api/auth/whoami` via cms, respon 403 "Access denied" - respon
aplikasi asli, bukan connection error, membuktikan BFF client cms
benar-benar sampai ke account-api). Docker image size: `docker images`
melaporkan ~367-420MB per image, tapi `docker run ... du -sh /` membuktikan
konten filesystem sungguhan cuma ~234MB (sisanya overhead pelaporan
manifest-list BuildKit, bukan bloat nyata) - sudah sesuai disiplin ukuran
image yang diminta (tanpa toolchain build yang tidak perlu, `yarn cache
clean` digabung di RUN layer yang sama).

Stack di-teardown bersih (`docker compose down`, volume/network/image
project ini saja dihapus) setelah verifikasi - container `mysql`/`redis`/
`rabbitmq` standalone milik proyek lain di mesin ini TIDAK disentuh sama
sekali (dicek eksplisit sebelum dan sesudah).

Bug nyata yang ditemukan & diperbaiki dari testing end-to-end (bukan dari
membaca kode saja):
- `node:26-alpine` TIDAK bundle yarn (beda dari `node:20-alpine3.19`
  mau-apps yang bundle) - `RUN yarn install --production` gagal
  `yarn: not found`. Fix: `npm install --global yarn` eksplisit di stage
  `base` (~5MB, diabaikan terhadap budget OOM).
- `--frozen-lockfile` (dipakai mau-apps) gagal terhadap yarn.lock hasil
  Nx `prune-lockfile` executor bahkan langsung setelah prune fresh
  tanpa cache - quirk Nx/yarn-classic, bukan drift dependency nyata
  (`yarn install --production` tanpa flag itu sukses dan cuma nulis ulang
  lockfile-nya tanpa perubahan). mau-apps sendiri tidak kena ini karena
  pakai `generatePackageJson: true` (opsi webpack lama), bukan executor
  Nx yang lebih baru ini.
- **Paling signifikan**: env var internal-routing (`API_HOST`,
  `ACCOUNT_API_HOST`, `ACCOUNT_WEB_HOST`, `SHARED_COOKIE_DOMAIN`) yang
  di-pass polos (nama sama seperti di `.env.example`) ke service Nuxt
  TIDAK ngefek di runtime - Nuxt `runtimeConfig` cuma menerima override
  env var sungguhan lewat penamaan `NUXT_<KEY>`/`NUXT_PUBLIC_<KEY>`
  (konvensi Nuxt sendiri); nama polos yang direferensikan langsung di
  `nuxt.config.ts` (`process.env['API_HOST']`) cuma ke-resolve saat BUILD
  TIME, ke-bake ke image, diam-diam diabaikan saat container runtime.
  Ketemu dari test end-to-end asli: `enem-landing-web`/`enem-landing-cms`
  keduanya sehat & terhubung network (`wget` manual sukses), tapi BFF
  route mereka sendiri balas 500 karena diam-diam masih connect ke
  `localhost:3001` (default fallback nuxt.config.ts) alih-alih
  `enem-landing-api:3001` yang sungguhan. Fix: semua 3 app Nuxt di
  `compose.yml`/`compose.local.yml` pakai `NUXT_API_HOST`/
  `NUXT_ACCOUNT_API_HOST`/`NUXT_PUBLIC_ACCOUNT_WEB_HOST`/
  `NUXT_PUBLIC_SHARED_COOKIE_DOMAIN` - 2 API NestJS TETAP pakai nama polos
  (`process.env` biasa, bukan Nuxt), jadi tidak ada satu shared anchor
  yang benar untuk semua 5 service seperti pola `x-internal-hosts`
  mau-apps - env block ditulis eksplisit per service.
- `enem-landing-web`'s `GOOGLE_ANALYTICS_ID` awalnya juga di-pass sebagai
  env var compose - no-op murni, sama akar masalah dengan poin di atas
  (dibaca `process.env` langsung di `nuxt.config.ts`, bukan
  `runtimeConfig`, jadi cuma berlaku saat `nx build`). Dihapus dari
  `environment:`, dicatat di komentar bahwa CI (`build-push.yml`, belum
  dibuat) yang perlu set env var ini sebelum `nx build`.

**Koreksi pasca-review**: agent yang membangun `compose.yml` di atas juga
men-set `enem-landing-api` jadi `traefik.enable=false` (internal-only,
label komentarnya sendiri bilang "matches account-api") - ini keliru,
bukan keputusan yang diminta. Story ini eksplisit list
`enem-landing-api -> api.<domain>` tanpa catatan "atau internal-only"
(beda dari `enem-landing-account-api`, yang memang punya catatan itu) -
tidak ada dasar untuk menyamakan keduanya. Diperbaiki: `enem-landing-api`
sekarang punya router Traefik publik (`api.<domain>`) sama seperti
`enem-landing-cms`/`enem-landing-web`/`enem-landing-account-web`, divalidasi
lewat `docker compose config` (merge `compose.yml`+`compose.local.yml`
sukses, label baru muncul benar di output). Tidak di-re-run full stack
end-to-end lagi setelah fix ini (perubahannya cuma label routing, tidak
menyentuh apa yang sudah diverifikasi konektivitasnya).

Belum/tidak bisa diverifikasi sesi ini: `scripts/provision-server.sh`/
`scripts/deploy.sh` terhadap VPS sungguhan, DNS/TLS subdomain sungguhan,
seluruh GitHub Actions workflow (lint/test/e2e/build-push/migrate/deploy -
belum dibuat sama sekali). `ansible-playbook --syntax-check` tidak
dijalankan - tidak ada Ansible playbook baru yang disentuh sesi ini (cuma
`infra/ansible/README.md`, dokumen; dan `infra/mysql/init/*.sh`, dicek
`bash -n` saja). `ansible-playbook`/`yamllint` juga tidak terinstall di
environment ini (sama seperti gap story 09).
