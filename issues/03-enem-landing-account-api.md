# Story 03: enem-landing-account-api (Identity/Auth API)

**Depends on:** 02
**Output path:** `refactor/apps/enem-landing-account-api`

## Goal

NestJS app yang menjadi satu-satunya identity provider untuk seluruh
ekosistem enem-landing — mirror endpoint-endpoint auth `mau-account-api`,
termasuk fitur uploads dan system-settings-nya, discope untuk kebutuhan
enem-landing (role `USER`/`ADMIN`/`SUPER_ADMIN`, bukan multi-tenant).

**Catatan penamaan (keputusan 2026-08-31):** app ini awalnya direncanakan
bernama `enem-landing-sso`, di-rename jadi `enem-landing-account-api` supaya
konsisten dengan mau-apps (`mau-account-api`). Lib `libs/backend/sso` (story
05) TETAP bernama "sso" — itu mengikuti pola mau-apps sendiri, di mana lib
validasi token juga tetap disebut "sso" walau app identity-nya bernama
"account".

## Kenapa

Sesuai keputusan brainstorm: identity provider dipisah jadi app sendiri
dengan pola redirect-based SSO persis mau-apps. `enem-landing-cms` tidak
akan punya form login sendiri — dia redirect ke `enem-landing-account-web`
(story 04) yang memanggil app ini.

## Scope

### Data model (TypeORM)
- `UserEntity`: `id` (uuid), `fullname`, `email` (unique), `passwordHash`,
  `role` (`Role` dari `shared/definitions` — `USER`/`ADMIN`/`SUPER_ADMIN`,
  mirror `mau-apps/libs/shared/definitions/src/lib/role.enum.ts` persis),
  `createdAt`, `updatedAt`.
- `FileEntity` (uploads, lihat di bawah): `id`, `app`, `purpose`,
  `uploaderId?`, `mime`, `size`, `key`, `url`, `createdAt`.
- `SystemSettingEntity`: `id`, `key` (unique), `value?` — key-value store
  DB-backed untuk config yang bisa diubah tanpa redeploy (lihat
  `SystemSettingsService` di bawah).
- Tidak ada tabel session/refresh-token terpisah — pakai `libs/backend/redis`
  (story 02) sebagai session-key allowlist: `signin` menyimpan
  `auth:{userId}:token`, `JwtStrategy.validate` menolak token kalau key itu
  sudah tidak ada di Redis (kadaluarsa atau di-signout). JWT tetap stateless
  (payload berisi `{id, fullname, email, role}`), Redis cuma untuk
  invalidasi dini — mirror `mau-account-api`'s `getAuthSessionKey` di
  `auth.service.ts`/`jwt.strategy.ts`.

### Seed: StaticAccount fixtures (bukan env var admin)
**Koreksi dari rencana awal**: awalnya direncanakan seed 1 admin dari env
var `SSO_ADMIN_EMAIL`/`SSO_ADMIN_PASSWORD`. Diganti (keputusan 2026-08-31)
dengan pola `StaticAccount` mau-apps
(`libs/shared/utils/src/lib/static-account.ts`) — fixture dev/staging
dengan password placeholder (`letmeinfortesting`, sama seperti mau-apps),
di-seed lewat `typeorm-extension`'s `Seeder` interface, idempotent
(update-if-exists):
- `users-add-super-admin.seed.ts` — seed `StaticAccount[Role.SuperAdmin]`
  dan `StaticAccount[StaticAccountSystem]` (keduanya dapat role
  `SUPER_ADMIN`, sama seperti mau-apps).
- `users-add-user.seed.ts` — seed `StaticAccount[Role.User]`.
- Tidak ada fixture untuk `Role.Admin` — mirror mau-apps, user role `ADMIN`
  dibuat lewat account management biasa, bukan seed.
- Jalankan via `yarn nx run enem-landing-account-api:seed`.
- **Ini fixture dev/staging, bukan credential production** — rotate
  password super-admin lewat `POST /auth/change-password` segera setelah
  seeding environment nyata.

### Endpoints (mirror `mau-account-api/src/app/auth`)
- `POST /auth/signup` — ada untuk parity struktur kode, non-aktif kecuali
  `ALLOW_SIGNUP=true` (default `false`).
- `POST /auth/signin` (local strategy, login by email) — return JWT.
- `POST /auth/whoami` (JWT strategy) — dipakai oleh `SsoService.whoAmI` di
  story 05 untuk validasi token dari app lain.
- `POST /auth/signout`
- `POST /auth/change-password`
- `GET /health`
- **Uploads** (`POST /uploads`, `DELETE /uploads/:id`, `JwtAuthGuard`) —
  mirror `mau-account-api/src/app/uploads` 1:1: Cloudflare R2 (S3-compatible,
  `@aws-sdk/client-s3`), `multer` memory storage, `UploadFileDto`
  (`app`/`purpose`/`maxSize`/`allowedMime`), pemilik atau `SYSTEM` yang
  boleh hapus file.
- **System Settings** (`GET`/`PUT /system-settings`, `JwtAuthGuard` + role
  check Admin/SuperAdmin) — mirror `mau-account-api/src/app/system-settings`
  1:1: DB-backed key-value config (dipakai untuk kredensial R2, editable
  dari `enem-landing-cms`'s settings page tanpa redeploy), fallback ke env
  var per key kalau belum pernah disimpan lewat CMS.
- `POST /auth/forgot-password` + `POST /auth/reset-password` — **tetap di
  luar scope** (butuh email provider, belum diputuskan). Tidak
  diimplementasikan di story ini.

### Auth strategy
- `LocalStrategy` (`usernameField: 'email'`) + `LocalAuthGuard`.
- `JwtStrategy` + `JwtAuthGuard`, validasi session Redis di atas.
- Password hashing: `bcrypt`.

### Config
- `.env.example` / `.env.local` — `DATABASE_URL` (Aiven MySQL di prod,
  MySQL lokal di dev, docker container "mysql"), `REDIS_*` (Upstash di prod, lihat
  `libs/backend/redis`), `JWT_SECRET`, `JWT_EXPIRES_IN_SECONDS`,
  `ALLOW_SIGNUP`, `PORT`, `CORS_ORIGIN`, `R2_ACCESS_KEY_ID`/
  `R2_SECRET_ACCESS_KEY`/`R2_ENDPOINT`/`R2_BUCKET_NAME`/
  `R2_PUBLIC_URL_BASE` (fallback untuk `SystemSettingsService`).
- `.env.local` gitignored (`*.env.local` di `.gitignore` workspace), dimuat
  lewat helper `src/load-env.ts` (`.env.local` lebih prioritas dari `.env`)
  — **harus** jadi import pertama di `main.ts`/`typeorm.config.ts`, karena
  `TypeOrmModule.forRoot()` membaca `process.env` secara statis saat
  `app.module.ts` di-import, sebelum Nest sempat bootstrap
  `ConfigModule`/apapun.

## Acceptance Criteria

- [x] `POST /auth/signin` dengan kredensial admin yang di-seed mengembalikan
      JWT valid.
- [x] `POST /auth/whoami` dengan token valid mengembalikan
      `{id, fullname, email, role}`.
- [x] `POST /auth/signup` mengembalikan 403 saat `ALLOW_SIGNUP=false`
      (default).
- [x] Migration + seed script idempotent (jalan ulang tidak duplikat admin
      user).
- [x] Unit test untuk `AuthService` (signin, whoami, signout, change-password,
      validateUser, signup gating), `AuthController` (delegasi + guard
      wiring via `GUARDS_METADATA`), `JwtStrategy`/`LocalStrategy`,
      `UsersService`, `UploadsService`, `SystemSettingsService`.
- [x] `nx build enem-landing-account-api` sukses, `nx lint`/`nx test` sukses
      (39 test, 7 file).

## Out of scope

- Halaman UI login — itu story 04 (`enem-landing-account-web`).
- Validasi token dari app lain (`SsoAuthGuard`) — itu story 05, dibangun di
  atas `POST /auth/whoami` yang distory ini.
- Forgot/reset password (butuh keputusan email provider terpisah).
- Refresh-token flow terpisah — JWT expiry + Redis session-key allowlist
  dianggap cukup untuk skala ini.

## Status: SELESAI (2026-08-31)

Semua endpoint, seeder, uploads, dan system-settings terimplementasi dan
lolos `build`+`lint`+`test` (39 test). Migration (`CreateUsersTable`,
`CreateUploadsAndSystemSettingsTables`) dan seed sudah **benar-benar
dijalankan terhadap MySQL lokal nyata** (docker container `mysql`,
database `enem_landing_account`) — bukan cuma unit test dengan mock.
Verifikasi end-to-end via `curl` langsung ke server yang jalan
(`nx serve enem-landing-account-api`):
- `POST /auth/signin` dengan `superadmin@enem-landing.local` → JWT valid.
- `POST /auth/whoami` dengan token itu → payload user lengkap.
- Redis session key (`auth:{id}:token`) benar-benar ter-set setelah signin.
- `POST /auth/signout` → Redis key terhapus → `whoami` sesudahnya 401
  "Session has expired or is invalid" (membuktikan mekanisme session-key
  allowlist bekerja, bukan cuma JWT expiry).
- `GET /system-settings` → 200 dengan fallback env var kosong.
- `POST /auth/signup` tanpa `ALLOW_SIGNUP=true` → 403.
- Seed dijalankan 2x → idempotent (`updated`, bukan duplikat/error).

**Deviasi dari rencana awal (semua by design, bukan penyimpangan tak
disengaja):**
- Rename `enem-landing-sso` → `enem-landing-account-api` (arahan user).
- Role enum: `ADMIN` saja → `USER`/`ADMIN`/`SUPER_ADMIN` (arahan user, mirror
  `mau-apps` persis).
- Seed admin dari env var → `StaticAccount` fixture pattern (arahan user,
  mirror `mau-apps`).
- Fitur uploads (R2) + system-settings (DB-backed config) ditambahkan
  (arahan user, mirror `mau-account-api` 1:1, disederhanakan di beberapa
  tempat — lihat komentar di `uploads.service.ts` soal apa yang di-skip).
- **DB engine: Postgres → MySQL** (arahan user 2026-08-31 — koreksi
  terhadap brainstorm awal yang salah duga; mau-apps sendiri pakai MySQL).
  Driver `mysql2`, migration ditulis pakai TypeORM `Table`/`TableIndex`
  builder API (portable), bukan raw SQL Postgres-specific.

**Temuan penting lain (relevan untuk story berikutnya yang punya
migration/seed CLI serupa, mis. story 06):** `tsx`/esbuild TIDAK
mendukung `emitDecoratorMetadata` secara andal (walau
`experimentalDecorators` didukung) — migration/seed script yang memuat
TypeORM entity gagal runtime dengan `ColumnTypeUndefinedError` meski
tsconfig sudah benar. Solusi: compile dulu pakai `tsc` asli (bukan
`tsx`) ke `dist-cli/` lewat target `build-cli` (lihat
`tsconfig.cli.json` + target `migration:run`/`migration:revert`/`seed`
di `package.json`), baru jalankan dengan `node` biasa. Juga: TypeORM
punya beberapa export yang TS-only (`MigrationInterface`, `QueryRunner`,
`DataSourceOptions`, dan `typeorm-extension`'s `Seeder`/`SeederOptions`)
— **wajib** `import type` eksplisit untuk ini, karena `isolatedModules`
(sudah di tsconfig.base.json) tidak selalu bisa elide otomatis saat
dipakai lewat `implements`/type annotation, dan akan gagal runtime
dengan "does not provide an export named ..." kalau tidak.
