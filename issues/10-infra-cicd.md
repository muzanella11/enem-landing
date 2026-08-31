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

- [ ] `docker compose -f compose.yml up` (dev) menjalankan semua 5 service
      (+ MySQL/Redis lokal untuk dev), saling terhubung (cms bisa hit
      api, api/cms bisa hit sso).
- [ ] `scripts/provision-server.sh` berhasil menyiapkan VPS baru (Docker +
      Traefik) dari kosong, idempotent kalau dijalankan ulang.
- [ ] `scripts/deploy.sh` berhasil deploy compose.prod.yml stack ke server
      yang sudah diprovisi, terhubung ke Aiven MySQL + Upstash Redis.
- [ ] Semua subdomain (`cms.<domain>`, `sso.<domain>`, `api.<domain>`, domain
      utama) resolve dan terlayani via Traefik dengan TLS aktif.
- [ ] GitHub Actions workflows (lint/test/e2e/build-push/migrate/deploy)
      jalan sukses end-to-end minimal sekali sebelum `.drone.yml` dihapus.
- [ ] `enem-landing-account-api` (identity provider) diputuskan exposed publik atau
      internal-only, didokumentasikan alasannya di `infra/ansible/README.md`
      versi enem-landing.

## Out of scope

- Observability/monitoring (log aggregation, uptime alerting) — bukan
  bagian dari refactor ini kecuali sudah ada sebelumnya dan perlu
  dipertahankan.
- RabbitMQ/message queue — tidak relevan untuk enem-landing (mau-apps
  pakai untuk domain topup/notification yang tidak ada di sini).
