# Story 06: enem-landing-api (Business Domain API)

**Depends on:** 02, 03, 05

**Output path:** `refactor/apps/enem-landing-api`

> **Catatan rekonstruksi (2026-08-31):** file ini sempat corrupt karena
> kesalahan perintah shell (backtick tidak di-escape memicu command
> substitution di dalam `perl -i -pe`, merusak seluruh isi file). `issues/`
> gitignored jadi tidak ada histori git untuk restore. Isi di bawah
> direkonstruksi dari implementasi aktual di
> `refactor/apps/enem-landing-api/src` + konteks percakapan — akurat
> terhadap kondisi kode saat ini, tapi kemungkinan tidak 100% verbatim
> catatan asli.

## Goal

NestJS API yang menggantikan `static/experience.json` dan form kontak
statis di root Nuxt 2 saat ini dengan domain model DB-backed penuh:
`experiences`/`projects`, `contact-submissions`, `site-profile`,
`seo-meta`, `skills`. Dikonsumsi oleh `enem-landing-cms` (story 07, admin
CRUD) dan `enem-landing-web` (story 08, public read + submit contact
form).

## Kenapa

Konten portfolio (pengalaman kerja, project, skill, SEO meta per halaman)
saat ini di-hardcode di file JSON dalam repo — setiap update butuh deploy
ulang kode. API ini memindahkan konten itu ke database supaya bisa
diedit lewat CMS tanpa redeploy.

## Scope

### Domain modules
- `experiences` — `ExperienceEntity` 1:N `ProjectEntity` (cascade),
  full CRUD, endpoint publik (list/get) + admin-only (create/update/
  delete lewat `SsoAuthGuard` + `assertAdminRole`).
- `contact-submissions` — `ContactSubmissionEntity` (field `readAt`
  nullable, untuk mark-as-read di CMS), endpoint publik `POST` (submit
  form dari landing page) dengan **in-memory rate limiting** (`Map`-based
  fixed window, `RATE_LIMIT_WINDOW_MS=60_000`,
  `RATE_LIMIT_MAX_SUBMISSIONS=5` per IP — **koreksi dari rencana awal**:
  draft awal mempertimbangkan Redis + `@nestjs/throttler`, tapi
  dikonfirmasi mau-apps sendiri pakai in-memory `Map` sederhana untuk
  kasus serupa, jadi enem-landing ikut pola itu, bukan nambah dependency
  Redis yang sebenarnya tidak diperlukan untuk skala ini), endpoint
  admin-only list/mark-as-read.
- `site-profile` — `SiteProfileEntity`, single-row get-or-create pattern
  (hero, bio, avatar, social links), admin-only update.
- `seo-meta` — `SeoMetaEntity`, upsert pattern per `pageKey` unik,
  admin-only.
- `skills` — `SkillEntity`, CRUD standar, admin-only untuk mutasi.
- `health` — `HealthController` sederhana untuk healthcheck.

### Auth
- Semua endpoint admin-only pakai `SsoAuthGuard` (dari
  `libs/backend/sso`, story 05) + helper bersama
  `src/app/common/assert-admin-role.ts` (cek `req.user.role` termasuk
  `ADMIN`/`SUPER_ADMIN`) — dipakai konsisten di semua controller admin,
  bukan role-check ad-hoc per controller.

### Database
- MySQL (`mysql2` driver), migration lewat TypeORM `Table`/
  `TableForeignKey` builder API (bukan raw SQL) —
  `1788217200000-CreateBusinessDomainTables.ts` bikin 6 tabel
  (`experiences`, `projects`, `contact_submissions`, `site_profile`,
  `seo_meta`, `skills`).
- Tidak ada dependency Redis di app ini (beda dari rencana awal story 02
  yang mengasumsikan Redis dipakai luas — dikonfirmasi hanya
  `enem-landing-account-api` yang butuh Redis, untuk session/cache SSO).

### Config
- `.env.example` — `PORT=3001`, `CORS_ORIGIN` (izinkan
  `enem-landing-cms`:4000 dan `enem-landing-web`:8001), `DATABASE_URL`
  (Aiven MySQL di prod, MySQL lokal di dev), `ACCOUNT_API_HOST` (dipakai
  `SsoAuthGuard` lewat `libs/backend/sso` untuk validasi token — nama
  awal draft `SSO_HOST`, di-rename 2026-08-31 untuk konsistensi).

## Acceptance Criteria

- [x] CRUD penuh `experiences`+`projects`, `skills`, `seo-meta`, dan
      update `site-profile` — endpoint publik read-only + admin-only
      mutasi, terverifikasi lewat curl terhadap MySQL lokal yang benar-benar
      jalan.
- [x] `contact-submissions` POST publik dengan rate limiting per IP
      (5 submission/menit), admin-only list + mark-as-read.
- [x] Migration TypeORM sukses jalan (`migration:run`) terhadap MySQL
      lokal (docker container `mysql`, db `enem_landing_api`).
- [x] Unit test (Vitest) untuk tiap service — termasuk kasus rate limit
      terlampaui, validasi DTO.
- [x] `nx build`/`nx serve enem-landing-api` sukses.

## Status: SELESAI (2026-08-31)

Bug nyata yang ditemukan & diperbaiki selama implementasi:
- `ContactSubmissionsService.create()` awalnya tidak dideklarasikan
  `async`, menyebabkan throw dari rate limiter jadi synchronous alih-alih
  Promise rejection — merusak assertion `.rejects.toThrow()` di test.
  Fix: tambah `async`.
- `@IsUrl()` dari class-validator menolak string kosong `''` walau sudah
  dikombinasikan dengan `@IsOptional()` (yang cuma skip `undefined`/
  `null`, bukan `''`) — data real `experience.json` banyak field `url: ""`
  untuk project internal. Fix: ganti ke
  `@ValidateIf((_, value) => value !== '')`.
- `req.user as User` kena TS2339 di semua controller admin — Express
  `Request` tidak punya properti `.user` tanpa ambient augmentation dari
  `@types/passport` (app ini set `req.user` manual lewat `SsoAuthGuard`,
  bukan local passport strategy). Fix: cast eksplisit
  `(req as Request & { user: User }).user` di 6 controller admin.
- `@Column({nullable: true})` pada field union type `string | null`
  (`SkillEntity.level`/`icon`) gagal di-infer TypeORM
  (`DataTypeNotSupportedError: Data type "Object"` — union type
  ter-reflect sebagai `Object` lewat `emitDecoratorMetadata`). Fix:
  tambah `type: 'varchar'` eksplisit di decorator `@Column`.

Env var `SSO_HOST` di-rename jadi `ACCOUNT_API_HOST` di akhir sesi ini
untuk konsistensi penamaan setelah app SSO di-rename
`enem-landing-account` → `enem-landing-account-api`.
