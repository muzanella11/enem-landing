# Story 05: libs/backend/sso (SsoAuthGuard + SsoService)

**Depends on:** 03

**Output path:** `refactor/libs/backend/sso`

> **Catatan rekonstruksi (2026-08-31):** file ini sempat corrupt karena
> kesalahan perintah shell (backtick tidak di-escape memicu command
> substitution di dalam `perl -i -pe`, merusak seluruh isi file). `issues/`
> gitignored jadi tidak ada histori git untuk restore. Isi di bawah
> direkonstruksi dari implementasi aktual di
> `refactor/libs/backend/sso/src` + konteks percakapan — akurat terhadap
> kondisi kode saat ini, tapi kemungkinan tidak 100% verbatim catatan asli.

## Goal

Lib backend (`@enem-landing/backend-sso`) yang jadi satu-satunya titik
komunikasi server-to-server ke `enem-landing-account-api` (story 03) untuk
app lain di monorepo (`enem-landing-api`, story 06): validasi token
(`whoAmI`), login proxy, dan proxy upload file. Mirror
`libs/backend/sso/src/lib/sso.service.ts` di mau-apps.

## Kenapa

Setiap app yang butuh endpoint admin-only (mis. `enem-landing-api`'s
`/experiences` POST/PATCH/DELETE) perlu cara memvalidasi token SSO tanpa
duplikasi logic HTTP call ke account-api di setiap app.

## Scope

- `SsoService` — di-trim dari versi mau-apps ke method yang benar-benar
  dipakai di enem-landing (**koreksi audit method**: method
  balance/wallet mau-apps — `checkBalance`, `creditBalance`,
  `debitBalance` — **tidak** di-port, tidak ada use case topup di
  enem-landing):
  - `extractToken(req)` — ambil Bearer token dari header.
  - `login(email, password)` — proxy ke `POST {ACCOUNT_API_HOST}/auth/signin`.
  - `loginAsSystem()` — login pakai `StaticAccount[StaticAccountSystem]`,
    dipakai untuk operasi otomatis/internal (mis. seed/migrasi yang perlu
    konteks user asli).
  - `whoAmI(token)` — panggil `POST {ACCOUNT_API_HOST}/auth/whoami`, return
    user profile `{id, fullname, email, role}`.
  - `uploadFile(token, file, options: {app, purpose, maxSize, allowedMime})`
    — proxy ke `POST {ACCOUNT_API_HOST}/uploads` (multipart), dipakai
    `enem-landing-api` untuk gambar Experience/Project/SiteProfile di
    story 06.
  - `deleteFile(token, fileId)` — proxy ke `DELETE {ACCOUNT_API_HOST}/uploads/:id`.
  - `throwMapped(error, fallbackMessage)` — private helper, map status
    HTTP dari axios error (`400`/`403`/`404`) ke NestJS exception yang
    setara, fallback ke `UnauthorizedException`.
- `SsoAuthGuard` — NestJS guard yang extract token, panggil `whoAmI`,
  attach `req.token`/`req.user`, atau throw `UnauthorizedException`.
- `SsoModule` — module sederhana, providers/exports `SsoService` (bukan
  dynamic module dengan `forRoot(config)` seperti draft awal — konfigurasi
  host cukup lewat env var langsung di `sso.constants.ts`, tidak perlu
  di-inject per-app).
- Constant: `ACCOUNT_API_HOST` env var (nama awal draft: `SSO_HOST`, di-rename
  2026-08-31 untuk konsistensi dengan `enem-landing-account-api`), default
  `http://localhost:3000` (port `enem-landing-account-api`, lihat pola port
  story 09).

## Acceptance Criteria

- [x] `SsoService.whoAmI`/`login`/`loginAsSystem`/`uploadFile`/`deleteFile`
      terverifikasi lewat scratch-app real terhadap `enem-landing-account-api`
      yang benar-benar jalan (bukan cuma unit test mock).
- [x] `SsoAuthGuard` menolak request tanpa/dengan token invalid
      (`UnauthorizedException`), attach `req.user`/`req.token` saat valid.
- [x] Unit test (Vitest) untuk `SsoService` dan `SsoAuthGuard` — mock
      `createAxiosInstance` dengan pola `vi.fn(function Name() {...})`
      (arrow function gagal dipakai sebagai constructor mock).

## Status: SELESAI (2026-08-31)

Method di-trim dari full port mau-apps ke yang benar-benar dipakai
(lihat "koreksi audit method" di atas). `uploadFile`/`deleteFile` sempat
dipertanyakan scope-nya (dipakai di story 06 untuk gambar Experience/
Project/SiteProfile) — dikonfirmasi tetap perlu setelah verifikasi
end-to-end lewat scratch app. Env var `SSO_HOST` di-rename jadi
`ACCOUNT_API_HOST` di akhir sesi ini untuk konsistensi penamaan setelah
app SSO di-rename `enem-landing-account` → `enem-landing-account-api`.
