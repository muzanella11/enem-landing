# Story 07: enem-landing-cms (Admin Dashboard)

**Depends on:** 04, 06
**Output path:** `refactor/apps/enem-landing-cms`,
`refactor/apps/enem-landing-cms-e2e`

## Goal

Nuxt 4 + Vuetify dashboard untuk mengelola seluruh konten yang dibuat di
story 06 (`experiences`/`projects`, `contact-submissions`, `site-profile`,
`seo-meta`, `skills`), dengan auth lewat redirect ke `enem-landing-account-web`
(story 04), mirror pola `mau-account-web`/`mau-topup-web`.

**Catatan arsitektur (ditemukan 2026-08-31, konfirmasi user):** karena kita
memutuskan TIDAK ada dashboard Vuetify terpisah khusus "account" (beda dari
mau-apps yang punya `mau-account-web` sendiri untuk kelola akun/settings,
terpisah dari dashboard produk), `enem-landing-cms` **juga** jadi
satu-satunya tempat mengelola sisi admin `enem-landing-account-api` (story 03):
`system-settings` (kredensial R2 untuk fitur uploads). Tanpa ini, tidak ada
cara mengisi kredensial R2 selain curl manual ke
`PUT /system-settings` — lihat scope `/settings` di bawah.

## Kenapa

Ini pengganti proses manual edit `static/experience.json` langsung di repo —
sekarang admin (kamu) bisa update konten lewat UI tanpa deploy ulang kode.

## Scope

### Auth
- `middleware/auth.global.ts` — pola `useMauAuthGuard` (adaptasi jadi
  `useAuthGuard` di `libs/frontend`, dibangun di sini karena ini consumer
  pertamanya): validasi token dari cookie, kalau tidak ada/invalid redirect
  ke `enem-landing-account-web/signin?redirect=<current-cms-url>`.
- Terima bounce-back token dari `enem-landing-account-web`, simpan ke cookie
  (httpOnly kalau lewat server route Nuxt, atau strategi lain yang konsisten
  dengan keputusan story 04).
- `/unauthorized` page untuk role yang tidak sesuai (walau saat ini cuma
  `ADMIN`, tetap sediakan halaman ini — pola mau-apps selalu punya ini untuk
  konsistensi & extensibility).

### Pages (Vuetify)
- `/` — dashboard overview (ringkasan jumlah experience, contact submission
  belum dibaca, dll — opsional, boleh simple).
- `/experiences` — list + form create/edit Experience (termasuk nested
  Project management — tentukan UI: inline sub-form atau halaman detail
  terpisah `/experiences/:id/projects`).
- `/contact-submissions` — list read-only (+ mark-as-read kalau field
  `readAt` diimplementasi di story 06).
- `/site-profile` — form single-row (hero, bio, avatar upload, social
  links).
- `/seo-meta` — list + form per halaman.
- `/skills` — list + form CRUD.
- `/settings` — **wajib, bukan opsional** (lihat catatan arsitektur di
  atas): form kredensial R2 (`R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`/
  `R2_ENDPOINT`/`R2_BUCKET_NAME`/`R2_PUBLIC_URL_BASE`), baca/tulis lewat
  `GET`/`PUT {ACCOUNT_API_HOST}/system-settings` (`enem-landing-account-api`,
  story 03 — bukan `enem-landing-api`). Mask nilai secret di UI (mis.
  tampilkan `••••••••` untuk `R2_SECRET_ACCESS_KEY` yang sudah tersimpan,
  jangan render nilai asli ke DOM).
- `/about` — opsional, info versi app dsb (pola mau-apps selalu punya
  `/about` page).

### Layout
- `layouts/dashboard.vue` — shell Vuetify (nav drawer, app bar), mirror
  `mau-account-web/src/layouts/dashboard.vue`.

### Config
- `.env.example` — `API_HOST` (`enem-landing-api`), `ACCOUNT_API_HOST`
  (`enem-landing-account-api`, untuk halaman `/settings` di atas), `ACCOUNT_WEB_HOST`
  (`enem-landing-account-web`, untuk redirect target).

## Acceptance Criteria

- [ ] Akses CMS tanpa login redirect ke halaman signin SSO, lalu kembali ke
      halaman CMS yang dituju setelah login sukses.
- [ ] CRUD penuh untuk `experiences` (+ nested projects), `skills`,
      `seo-meta`, dan update `site-profile` berhasil reflect ke
      `enem-landing-api`.
- [ ] List `contact-submissions` menampilkan data yang di-submit dari
      landing page (setelah story 08 selesai, verifikasi end-to-end).
- [ ] `/settings` berhasil baca dan update `system-settings` milik
      `enem-landing-account-api` (kredensial R2) — setelah diisi, upload file
      dari `enem-landing-cms` (avatar/gambar) sukses tersimpan ke R2.
- [ ] `enem-landing-cms-e2e` (Playwright): skenario login-redirect,
      create/edit Experience, submit site-profile form.
- [ ] `nx serve enem-landing-cms` jalan lokal, `nx build` sukses.

## Out of scope

- Halaman signup/registrasi user baru (tidak ada multi-user).
- Public-facing content — itu `enem-landing-web` (story 08).
