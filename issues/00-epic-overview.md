# Epic: Refactor enem-landing to Nx Monorepo (SSO + API + CMS + Web)

## Background

`enem-landing` saat ini adalah portfolio statis berbasis Nuxt 2 (single page,
`pages/index.vue`), dengan satu-satunya data dinamis (`experience.json`)
di-fetch dari `static/` dan contact form yang hanya membuka `mailto:` link
(tidak ada backend sama sekali).

Kita akan me-refactor ini menjadi Nx monorepo dengan arsitektur yang meniru
`mau-apps` (`/Users/muzanella/Projects/Code/muzanella/mau-apps`), tapi
menggunakan Nx versi terbaru agar kompatibel dengan Node 26.

## Keputusan arsitektur (hasil brainstorm)

1. **SSO dipisah jadi app sendiri**, pola redirect-based SSO persis mau-apps
   (`mau-account-api` + `mau-account-landing-web` sebagai identity provider,
   consumer app redirect + bounce-back token), bukan login form tertanam di
   CMS.
2. **Scope konten CMS** diperluas dari sekadar Experience/Projects, mencakup:
   - Experience + Project (migrasi dari `static/experience.json`)
   - Contact Submission (ganti `mailto:` dengan endpoint API tersimpan di DB)
   - Site Profile / Hero (bio, foto profil, social links — saat ini hardcode
     di komponen)
   - SEO Meta per halaman (title/description/og-image, ganti config statis
     di `nuxt.config.js`)
   - Skill / Tech Stack (entity terpisah, section sendiri di landing page)
3. **E2E testing** (Playwright) disertakan sejak awal untuk setiap app
   frontend (`*-web`, `*-cms`, `*-sso-web`), sesuai pola `*-e2e` di mau-apps.
   API apps (`*-api`, `sso`) pakai unit/integration test (Jest), tidak ada
   `-e2e` app terpisah — ini konsisten dengan pola mau-apps (API apps di
   sana juga tidak punya `-e2e` app).
4. **Auth scope** (update 2026-08-31): role mirror mau-apps persis —
   `USER`/`ADMIN`/`SUPER_ADMIN` (bukan cuma `ADMIN` seperti rencana awal).
   Admin di-seed lewat pola `StaticAccount` fixture (mirror
   `mau-apps/libs/shared/utils/src/lib/static-account.ts`, seeder
   `typeorm-extension`), bukan lewat env var `SSO_ADMIN_EMAIL`/`PASSWORD`
   seperti rencana awal. Endpoint `/auth/signup` tetap ada untuk parity
   struktur kode tapi non-aktif kecuali `ALLOW_SIGNUP=true`. Detail lengkap
   di [03-enem-landing-account-api.md](03-enem-landing-account-api.md).
   `enem-landing-account-api` juga mendapat fitur **uploads** (Cloudflare R2)
   dan **system-settings** (DB-backed config), mirror `mau-account-api`
   1:1 (arahan user 2026-08-31).
5. **Output pengembangan** ditaruh di `refactor/` (folder ini) sebagai Nx
   workspace baru yang independen (punya `package.json`/`nx.json` sendiri),
   dikembangkan dan divalidasi secara paralel dengan root repo yang ada
   sekarang. Cutover (pindah ke root, hapus kode Nuxt 2 lama) adalah story
   terakhir, setelah semua app tervalidasi.
6. **Infra & CI/CD mengikuti pola mau-apps sepenuhnya** (keputusan
   2026-08-31, update dari rencana awal): Ansible untuk provisioning server
   + Traefik reverse proxy, GitHub Actions menggantikan Drone (Drone akan
   dihapus dari repo), DB via **Aiven** (MySQL), Redis via **Upstash**.
   Lihat [09-dev-tooling-scripts.md](09-dev-tooling-scripts.md) dan
   [10-infra-cicd.md](10-infra-cicd.md) untuk detail.

## Target apps

```
refactor/
  apps/
    enem-landing-account-api          # NestJS — identity/auth API (issue & validate JWT)
    enem-landing-account-web      # Nuxt 4 + Tailwind — halaman login/signin (bounce-back)
    enem-landing-account-web-e2e  # Playwright
    enem-landing-api          # NestJS — business domain (experience, projects,
                               #   contact, site-profile, seo-meta, skills)
    enem-landing-cms          # Nuxt 4 + Vuetify — admin dashboard, protected by SSO
    enem-landing-cms-e2e      # Playwright
    enem-landing-web          # Nuxt 4 + Tailwind — public landing (replaces current app)
    enem-landing-web-e2e      # Playwright
  libs/
    backend/
      sso/                   # SsoAuthGuard + SsoService (validate token via enem-landing-account-api)
      redis/                 # RedisService (ioredis wrapper), Upstash-ready (TLS, key prefix)
    frontend/
      src/composables/       # useAuthGuard, useAuthBounceBack, useAuthCookie, useWhoami
    shared/
      types/                 # Experience, Project, ContactSubmission, SiteProfile,
                              #   SeoMeta, Skill, User
      definitions/            # Role enum, app constants
      utils/                  # pure utils shared frontend/backend (incl. axios
                              #   instance factory, benchmark helper)
  scripts/
    create-app.sh            # scaffold a new Nx app (nest/nuxt) + wire conventions
    delete-app.sh             # remove an app + its wiring
    kill-ports.sh             # kill local dev ports for all apps
    provision-db.sh           # provision MySQL databases (account, api)
    generate-nest-libs-component.sh  # scaffold controller/service/module in a lib
    deploy.sh                 # build + ship the docker compose stack to the VPS
```

## Target stack versions (checked against npm registry, latest as of this
brainstorm)

| Package | Version |
|---|---|
| `nx` + `@nx/*` plugins (nest, nuxt, node, js, eslint, playwright, vite) | `23.1.2` |
| `nuxt` | `^4.5.2` (engines: `node ^22.19 \|\| ^24.11 \|\| >=26`) |
| `vuetify` | `^4.1.12` via `vuetify-nuxt-module` (currently `1.0.0-rc.5` — **risk**, see below) |
| `tailwindcss` / `@nuxtjs/tailwindcss` | `^4.3.3` / `^6.14.0` |
| `@nestjs/core` / `common` / `platform-express` | `^12.0.1` |
| `@nestjs/jwt` / `@nestjs/passport` | `^12.0.1` / `^12.0.0` |
| `@nestjs/typeorm` | `^12.0.1` |
| `typeorm` | dist-tag `latest` is now `1.1.0` (major API bump); `legacy` tag pinned at `0.3.31` is what mau-apps effectively uses |

**Risks — resolved during Story 01/03 execution:**
- `typeorm@legacy` (0.3.31) confirmed working with `@nestjs/typeorm@12` —
  `typeorm@1.x` peer support is prerelease-only, not used.
- `vuetify-nuxt-module@1.0.0-rc.5` confirmed working on Nuxt 4 + Vuetify 4
  (Story 01 spike): SSR renders correct component classes, build succeeds.
- **DB engine changed from Postgres to MySQL** (decision 2026-08-31, user
  correction — mau-apps itself uses MySQL, the original brainstorm's
  Postgres assumption was wrong). `enem-landing-account-api` uses `mysql2` +
  `typeorm` migrations written with the portable `Table`/`TableIndex`
  builder API (not raw SQL), verified against a real local MySQL 8
  container. See [03-enem-landing-account-api.md](03-enem-landing-account-api.md).
- `@nuxtjs/tailwindcss@6.14.0` bundles `tailwindcss@^3.4` internally, not
  `^4.x` as the original brainstorm table assumed — noted, not treated as
  a blocker (the module's public API is what apps consume either way).

## Story index

| # | Story | Depends on |
|---|---|---|
| 01 | [Workspace scaffold](01-workspace-scaffold.md) | - |
| 02 | [Shared libs](02-shared-libs.md) | 01 |
| 03 | [enem-landing-account-api](03-enem-landing-account-api.md) | 02 |
| 04 | [enem-landing-account-web](04-enem-landing-account-web.md) | 03 |
| 05 | [Backend SSO lib](05-backend-sso-lib.md) | 03 |
| 06 | [enem-landing-api](06-enem-landing-api.md) | 02, 05 |
| 07 | [enem-landing-cms](07-enem-landing-cms.md) | 04, 06 |
| 08 | [enem-landing-web](08-enem-landing-web.md) | 06 |
| 09 | [Dev tooling scripts](09-dev-tooling-scripts.md) | 01 |
| 10 | [Infra & CI/CD](10-infra-cicd.md) | 03, 06, 07, 08, 09 |
| 11 | [Data migration & cutover](11-cutover-migration.md) | 10 |

## Out of scope (for this refactor)

- Public signup/registration flow — `/auth/signup` exists for structural
  parity with mau-apps but stays disabled (`ALLOW_SIGNUP=false`); the
  `USER`/`ADMIN`/`SUPER_ADMIN` roles exist for parity with mau-apps' `Role`
  enum, not because enem-landing needs multi-tenant user management yet.
- Public user registration (blog comments, guestbook, etc.) — not part of
  current site.
- Redesigning the visual design of the public landing page — this refactor
  targets stack/architecture parity first; content becomes CMS-managed but
  visual output should stay equivalent to the current site unless a separate
  design story is opened later.
