# Story 02: Shared Libs (types, definitions, utils)

**Depends on:** 01
**Output path:** `refactor/libs/shared/*`, `refactor/libs/backend/redis`

## Goal

Bangun lib-lib dasar yang dipakai lintas app (`shared/types`,
`shared/definitions`, `shared/utils`, `backend/redis`) sebelum app-app
bisnis (sso, api, cms, web) mulai dikerjakan, supaya tidak ada duplikasi
tipe/kontrak data antar app.

## Kenapa

Di mau-apps, `libs/shared/*` adalah kontrak bersama antara backend dan
frontend (tipe data, enum, util murni) — pola ini mencegah drift schema
antara NestJS API dan Nuxt frontend. `libs/shared/utils` menyediakan helper
kecil (axios instance factory, benchmark wrapper) yang dipakai oleh
`backend/sso` (story 05) dan app API lain.

**Koreksi dari rencana awal (ditemukan saat eksekusi):** `createAxiosInstance`
dan `benchmark` semula direncanakan masuk `libs/backend/utils`, tapi
verifikasi ke source asli mau-apps (`libs/shared/utils/src/lib/axios.ts`,
`benchmark.ts`) menunjukkan keduanya sebenarnya ada di `libs/shared/utils`,
bukan `libs/backend/utils` — masuk akal karena keduanya pure TS (tidak
bergantung NestJS), konsisten dengan prinsip "shared/* tidak boleh
bergantung ke package spesifik NestJS/Nuxt" di AC bawah. `libs/backend/utils`
dihapus dari scope — tidak ada lib NestJS-only yang konkret dibutuhkan saat
ini; kalau story 03/06 nanti butuh utility backend-only (mis. exception
filter, response interceptor ala mau-apps), buat lib itu saat kebutuhannya
nyata, bukan sekarang.

## Scope

### `libs/shared/types`
Interface/type untuk entity yang disepakati di brainstorm:
- `Experience` (company, position, location, description, roleSummary,
  workingPeriode, projects: `Project[]`)
- `Project` (title, image, url, year, description, technologies: string[])
- `ContactSubmission` (fullname, email, phoneNumber, message, createdAt)
- `SiteProfile` (heroTitle, heroSubtitle, bio, avatarUrl, socialLinks:
  `{platform: string; url: string}[]`)
- `SeoMeta` (page slug/key, title, description, ogImageUrl)
- `Skill` (name, category, level?, icon?)
- `User` (id, email, role) — untuk kontrak SSO whoami response

### `libs/shared/definitions`
- `Role` enum (`ADMIN` saja untuk sekarang — desain enum agar mudah ditambah
  role baru nanti tanpa breaking change).
- App name constants (kalau dipakai untuk header `X-App-Name` antar service,
  ikuti pola `use-app-signature.ts` di mau-apps kalau signature verification
  antar app dianggap perlu — putuskan saat implementasi apakah scope ini
  perlu untuk enem-landing atau bisa disederhanakan/dilewati).

### `libs/shared/utils`
- `createAxiosInstance()` — factory axios dengan `baseURL` + `token` header,
  dipakai oleh `SsoService` (story 05). Port dari
  `mau-apps/libs/shared/utils/src/lib/axios.ts`.
- `benchmark()` — wrapper log durasi eksekusi async function (dipakai luas
  di mau-apps untuk observability sederhana). Port dari
  `mau-apps/libs/shared/utils/src/lib/benchmark.ts`.
- `slugify()` — slug generator untuk `SeoMeta` key.
- Date formatting **tidak** dibuat di sini — `Experience.workingPeriode`
  disimpan sebagai free-text (mis. `"November 2021 - Now"`, lihat
  `static/experience.json` di root repo saat ini), bukan tipe `Date`
  terstruktur, jadi tidak ada konsumer nyata untuk util format tanggal saat
  ini. Tambahkan kalau kebutuhannya muncul konkret nanti.

### `libs/backend/redis`
DB dan Redis kemungkinan besar akan pakai layanan managed yang sama dengan
mau-apps: **Aiven** (MySQL) dan **Upstash** (Redis) — lihat
[10-infra-cicd.md](10-infra-cicd.md). Port `RedisService` dari
`mau-apps/libs/backend/redis/src/lib/redis.service.ts` (wrapper `ioredis`),
termasuk dukungan `REDIS_TLS_ENABLED` (wajib untuk Upstash) dan
`REDIS_KEY_PREFIX` (isolasi key kalau dev/prod berbagi satu instance Upstash
gratis — pola yang sama dipakai mau-apps, lihat komentar di
`redis.constants.ts` referensi).

Dipakai oleh:
- `enem-landing-account-api` (story 03) — auth session/logout token blocklist, mirror
  `mau-account-api/src/app/auth/auth.service.ts` + `jwt.strategy.ts`.

**Koreksi (ditemukan saat implementasi story 06):** `enem-landing-api`
awalnya direncanakan pakai `backend-redis` untuk rate-limit
`POST /contact-submissions`. Verifikasi ke source mau-apps menunjukkan
pola nyatanya adalah in-memory `Map` per-instance (lihat
`issues/06-enem-landing-api.md`), bukan Redis — jadi `enem-landing-api`
**tidak** import `backend-redis` sama sekali. Lib ini saat ini cuma
dipakai `enem-landing-account-api`.

## Acceptance Criteria

- [ ] Semua lib di atas ter-generate via `nx g @nx/js:lib` dengan
      `importPath` `@enem-landing/<nama-lib>`, resolvable lewat yarn
      workspaces symlink (lihat catatan di story 01 — bukan `paths` manual
      di `tsconfig.base.json`).
- [ ] Tidak ada dependency dari `shared/*` ke NestJS/Nuxt-specific packages
      (harus pure TS, bisa diimport dari backend maupun frontend).
- [ ] Unit test dasar untuk `shared/utils` dan `backend/redis` (Vitest,
      sesuai default `@nx/js:lib` generator).
- [ ] `nx build` untuk tiap lib sukses.

## Out of scope

- `backend/sso` (SsoAuthGuard/SsoService) — itu story 05, karena baru bisa
  disusun setelah kontrak API `enem-landing-account-api` (story 03) fixed.
- Komponen Vue/composable frontend — itu bagian dari `libs/frontend`,
  dibuat bertahap di story 04/07/08 sesuai kebutuhan nyata (hindari
  premature abstraction sebelum ada 2+ consumer).

## Status: SELESAI (2026-08-31)

5 lib ter-generate (`shared-types`, `shared-definitions`, `shared-utils`,
`backend-redis` — `backend-utils` dibatalkan, lihat catatan koreksi di
atas), semua lolos `build`+`test`+`lint`. Temuan penting level-workspace
(bukan cuma story ini): `tsconfig.base.json` butuh
`experimentalDecorators`+`emitDecoratorMetadata` supaya `@Injectable()` dkk
benar-benar berfungsi dengan NestJS DI di runtime (TS 6 default ke standard
decorators yang tidak didukung NestJS) — sudah diperbaiki di root
`tsconfig.base.json`, detail lengkap di `refactor/README.md`.
