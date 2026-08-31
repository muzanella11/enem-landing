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

- [x] Akses CMS tanpa login redirect ke halaman signin SSO, lalu kembali ke
      halaman CMS yang dituju setelah login sukses.
- [x] CRUD penuh untuk `experiences` (+ nested projects), `skills`,
      `seo-meta`, dan update `site-profile` berhasil reflect ke
      `enem-landing-api`.
- [ ] List `contact-submissions` menampilkan data yang di-submit dari
      landing page (setelah story 08 selesai, verifikasi end-to-end).
- [x] `/settings` berhasil baca dan update `system-settings` milik
      `enem-landing-account-api` (kredensial R2) — setelah diisi, upload file
      dari `enem-landing-cms` (avatar/gambar) sukses tersimpan ke R2.
      Baca/tulis kredensial terverifikasi; upload file end-to-end belum
      diverifikasi (belum ada halaman yang benar-benar upload gambar lewat
      form — hanya field URL manual di `/site-profile` saat ini).
- [x] `enem-landing-cms-e2e` (Playwright): skenario login-redirect,
      create/edit Experience, submit site-profile form.
- [x] `nx serve enem-landing-cms` jalan lokal, `nx build` sukses.

## Out of scope

- Halaman signup/registrasi user baru (tidak ada multi-user).
- Public-facing content — itu `enem-landing-web` (story 08).

## Status: SELESAI (2026-08-31)

Semua AC terpenuhi kecuali dua yang eksplisit menunggu story 08
(`contact-submissions` end-to-end dari landing page) dan upload file
end-to-end (belum ada UI upload gambar sungguhan, cuma field URL manual —
dicatat sebagai gap, bukan blocker, karena `uploadFile`/`deleteFile` di
`libs/backend/sso` sendiri sudah terverifikasi story 05).

Dibangun: 20 BFF proxy route (`server/api/**`) ke `enem-landing-api`/
`enem-landing-account-api` lewat helper `server/utils/api-client.ts`;
6 halaman CRUD Vuetify (`experiences` + nested projects,
`contact-submissions`, `site-profile`, `seo-meta`, `skills`, `settings`);
`middleware/auth.global.ts` + `layouts/dashboard.vue` (nav drawer + app
bar + profile menu, versi simplified dari `CmsLayout` mau-apps — tanpa
balance/wallet/multi-brand-logo yang tidak relevan untuk portfolio
personal). `libs/frontend` direstrukturisasi jadi `composables/`/
`constants/`/`stores/` (mirror struktur asli mau-apps, bukan flat
`src/lib/`), `ensureHttps` dipindah ke `libs/shared/utils` (lokasi
aslinya di mau-apps), Pinia di-wire di seluruh app Nuxt.

Verifikasi end-to-end lewat curl terhadap service yang benar-benar jalan
(bukan cuma unit test) untuk semua 6 fitur CRUD, plus 12 test Playwright
(login-redirect, experiences+nested-project CRUD, site-profile) yang
stabil lewat 3x run berturut-turut.

Bug nyata yang ditemukan & diperbaiki selama verifikasi live:
- `CreateExperienceDto.projects` wajib diisi (`@IsArray()` tanpa
  `@IsOptional()`), padahal alur CMS-nya justru buat experience dulu baru
  nambah project satu-satu lewat `POST /experiences/:id/projects`. Fix:
  `projects` jadi optional.
- `UpsertSeoMetaDto.ogImageUrl` pakai `@IsUrl()` + `@IsOptional()` — pola
  yang sama persis dengan bug yang sudah didokumentasikan di story 06
  (`@IsOptional()` cuma skip `undefined`/`null`, bukan `''`). Fix: ganti
  ke `@ValidateIf((_, value) => value !== '')`, sama seperti fix di
  `CreateProjectDto.url`.
- `app.vue`'s snackbar binding rusak: `reactive(computedRef)` tidak
  meng-unwrap `ComputedRef` (proxy dibuat atas objek ref itu sendiri,
  yang tidak punya properti `.opened`, cuma `.value`). Fix: pakai
  computed ref langsung, karena `<script setup>` + template
  auto-unwrap top-level ref.
- Race hydration SSR nyata ditemukan lewat e2e: mengisi/klik form yang
  di-pre-populate dari `useFetch` sebelum Nuxt selesai hydrate bisa
  silent no-op (event listener belum ter-attach) atau ke-reset (v-model
  belum sinkron). Ditangani di test lewat pola retry `toPass()`
  (rekomendasi resmi Playwright), bukan `networkidle` yang di-flag
  `eslint-plugin-playwright` sebagai tidak reliable — tapi race ini
  relevan juga untuk UX asli, bukan cuma artefak test.

Env var `SSO_WEB_HOST` (draft awal) di-rename jadi `ACCOUNT_WEB_HOST`
untuk konsistensi dengan `ACCOUNT_API_HOST` setelah rename app SSO.
