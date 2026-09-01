# Story 04: enem-landing-account-web (Login/Bounce-back UI)

**Depends on:** 03
**Output path:** `refactor/apps/enem-landing-account-web`,
`refactor/apps/enem-landing-account-web-e2e`

## Goal

Nuxt 4 + Tailwind app dengan satu tanggung jawab: halaman login untuk admin,
memakai mekanisme SSO yang **sama persis** dengan mau-apps setelah
diverifikasi ke source code aslinya (bukan asumsi awal — lihat "Koreksi dari
rencana awal" di bawah).

## Kenapa

`enem-landing-cms` tidak akan punya form login sendiri (keputusan brainstorm:
full redirect-based SSO). App ini yang menampung UI-nya, terpisah dari CMS
supaya identity provider benar-benar independen dari consumer app-nya —
kalau nanti ada app kedua yang butuh SSO, tinggal redirect ke sini juga.

## Koreksi dari rencana awal (ditemukan saat verifikasi ke source mau-apps)

Rencana awal salah menduga mekanismenya "bounce-back token via query param,
lalu app pemanggil simpan ke cookie". Setelah membaca
`mau-apps/libs/frontend/src/composables/use-mau-auth-cookie.ts`,
`use-mau-auth-guard.ts`, `use-mau-auth-bounce-back.ts`, dan
`apps/mau-account-landing-web/src/pages/signin.vue` +
`src/server/api/auth/*.post.ts` langsung, mekanisme sebenarnya:

1. **Shared parent-domain cookie**, bukan token-via-query-param. Semua app
   mau-apps jalan di subdomain `*.mauuu.id` di prod; cookie auth di-set
   dengan `domain: ".mauuu.id"` supaya otomatis kebaca oleh semua subdomain
   lain (`useMauAuthCookie`). Di local dev (semua app di `localhost`, beda
   port), cookie SUDAH otomatis ke-share tanpa perlu domain eksplisit —
   cookie browser tidak port-scoped.
2. Query param `r` di URL signin (`?r=<url>`) **cuma alamat redirect
   tujuan**, bukan carrier token. Setelah login sukses, browser di-redirect
   penuh (`window.location.href` / `navigateTo(url, {external:true})`) ke
   `r` — cookie yang sudah ke-set otomatis ikut terbawa karena shared
   domain, tidak perlu token ditempel di URL.
3. **Pola BFF (Backend-for-Frontend)**: browser tidak memanggil NestJS API
   langsung — dia memanggil server route Nuxt sendiri
   (`server/api/auth/signin.post.ts`, `whoami.post.ts`), yang baru
   memanggil API asli dari sisi server (via `axiosInstanceAccount`). Ini
   menjaga host API + kredensial apa pun tetap di server, tidak pernah
   masuk ke bundle browser.
4. **`useMauAuthGuard`** (dipakai consumer app spt `mau-topup-web` di
   `middleware/auth.global.ts`): cek cookie ada, kalau tidak redirect ke
   signin dengan `r=<url saat ini>`. Opsional validasi ke `/api/auth/whoami`
   BFF sendiri sebelum dipercaya. **Ini bagian story 07 (cms)**, bukan
   story ini — cuma dicatat di sini karena story ini yang jadi target
   redirect-nya.
5. **`useMauAuthBounceBack`** (jalan di app signin ITU SENDIRI): kalau user
   sudah landing di `/signin?r=...` padahal cookie-nya masih valid (login
   dobel karena race/history-back), langsung bounce ke `r` tanpa minta
   login ulang.
6. **Header `X-Enem-Landing-Secret`** — ditiru persis pola mau-apps
   (`X-Mau-Secret`): BFF route cuma cek `if (!secret)` (ada isinya atau
   tidak), bukan validasi nilai — sama seperti aslinya, bukan proteksi
   kriptografis nyata, murni parity struktur kode/BFF.
7. **Open-redirect: `ensureHttps()` saja, TANPA allowlist origin**
   (keputusan eksplisit 2026-08-31, override dari rencana awal). Sudah
   dikonfirmasi ke user bahwa ini mereplikasi celah open-redirect nyata di
   mau-apps (`r=` bisa diarahkan ke domain manapun asal pakai https —
   attacker bisa kirim link `signin.<domain>/signin?r=https://evil.com`;
   user login sungguhan di halaman asli, credential tidak bocor, tapi
   browser di-redirect ke `evil.com` setelah sukses login, vektor phishing
   follow-up). User tetap memilih parity penuh untuk project personal
   skala ini. **Kalau threat model berubah nanti (multi-user, data
   sensitif), revisit keputusan ini dan tambahkan allowlist origin.**

## Scope

### Cookie
- Nama cookie: `ENEM_LANDING_AUTH_TOKEN`.
- `domain: ".<parent-domain>"` HANYA saat host bukan `localhost`/`127.0.0.1`
  (mirror `useMauAuthCookie`'s `isMauuuIdHost` check) — parent domain dari
  env config (`SHARED_COOKIE_DOMAIN`), ditentukan final di story 10 saat
  domain produksi sudah fix.
- `sameSite: 'lax'`, `path: '/'`.

### Flow
1. `enem-landing-cms` (story 07, di luar scope story ini) redirect ke
   `enem-landing-account-web/signin?r=<cms-url-tujuan>` kalau cookie belum
   ada/invalid.
2. `/signin` render form email+password, `POST` ke BFF sendiri
   (`server/api/auth/signin.post.ts`), yang proxy ke `enem-landing-account-api`
   (`POST /auth/signin`, story 03).
3. Sukses, set cookie `ENEM_LANDING_AUTH_TOKEN`, redirect penuh ke
   `ensureHttps(r)` (prepend `https://` kalau skema belum ada, **tanpa**
   validasi origin/domain, mirror mau-apps persis, lihat poin 7 di atas).
4. Middleware halaman signin: kalau cookie sudah valid (dicek via BFF
   `whoami.post.ts`) saat landing di `/signin?r=...`, langsung bounce ke
   `ensureHttps(r)` tanpa minta login ulang (mirror `useMauAuthBounceBack`).
5. Kalau `r` kosong/tidak ada: fallback ke halaman default (mis. `/`),
   tidak ada redirect eksternal.

### Pages
- `/signin` — form login.

### Server routes (BFF, `server/api/auth/`)
- `signin.post.ts` — proxy ke `ACCOUNT_API_HOST` + `/auth/signin`, cek
  header `X-Enem-Landing-Secret` (presence-only, lihat poin 6 di atas).
- `whoami.post.ts` — proxy ke `/auth/whoami`, dipakai oleh middleware
  bounce-back-if-already-authenticated di app ini sendiri.

### Composables (app-local dulu, BUKAN `libs/frontend`)
Consumer pertama, sesuai prinsip di story 02/05 (hindari premature
abstraction sebelum ada 2+ consumer), taruh di
`apps/enem-landing-account-web/app/composables/` dulu:
- `use-auth-cookie.ts` — get/set/clear cookie shared-domain.
- `ensure-https.ts` (util kecil, boleh app-local atau masuk
  `shared/utils` kalau kepakai lagi) — mirror `ensureHttps()`.
- Logic bounce-back di `middleware/router.global.ts` atau langsung di
  halaman `/signin`.

Ekstrak ke `libs/frontend` di story 07 begitu `enem-landing-cms` jadi
consumer kedua yang butuh logic serupa (`useAuthGuard`).

### Config
- `.env.example` / `.env.local` — `ACCOUNT_API_HOST` (base URL
  `enem-landing-account-api`, dipakai server-side saja oleh BFF route),
  `SHARED_COOKIE_DOMAIN` (kosong di dev), `PORT` (8000, lihat story 09).

## Acceptance Criteria

- [x] Login dengan kredensial admin valid, cookie ter-set, redirect ke
      `ensureHttps(r)`.
- [x] Login dengan kredensial salah, error di form, tidak ada
      cookie/redirect.
- [x] Landing di `/signin?r=<url>` dengan cookie yang MASIH valid, langsung
      bounce ke `ensureHttps(r)` tanpa render form login.
- [x] `enem-landing-account-web-e2e` (Playwright): skenario login sukses,
      login gagal, bounce-back saat sudah login — 9/9 test lolos (3 skenario
      × chromium/firefox/webkit).
- [x] `nx serve enem-landing-account-web` jalan lokal, `nx build` sukses.

## Status: SELESAI (2026-08-31)

Diimplementasikan sesuai koreksi mekanisme di atas (shared cookie + BFF,
bukan bounce-back token). Terverifikasi end-to-end lewat `curl` (BFF
`signin`/`whoami` proxy ke `enem-landing-account-api` yang sungguhan jalan) dan
lewat Playwright e2e (9/9 lolos, real browser, real backend, real
MySQL/Redis — bukan mock).

**Bug ditemukan & diperbaiki selama implementasi (bukan di rencana awal):**
Kunjungan langsung ke `/signin` tanpa query param `r` (bukan bagian alur
redirect-based SSO) menyebabkan redirect loop: fallback lama redirect ke
`/`, tapi `index.vue` redirect balik ke `/signin` tanpa `r` juga → bounce-back
logic di `/signin` mengeksekusi ulang fallback `/` → loop. Diperbaiki: kalau
`r` tidak ada, `redirectTarget` jadi `null` dan halaman menampilkan pesan
statis ("You're signed in." / form login biasa) alih-alih mencoba redirect
kemana pun. Test e2e ketiga awalnya juga punya bug yang sama (lupa
menyertakan `r` di langkah "establish session") — kedua bug ditemukan
bersamaan lewat kegagalan e2e run pertama.

**Playwright `webServer`**: config di-set untuk menjalankan 2 service
sekaligus (`enem-landing-account-api` + `enem-landing-account-web`) karena
BFF butuh backend sungguhan, bukan mock — lihat
`playwright.config.mts`. Timeout startup di-set 90s (cold build 4 lib
dependency + webpack Nest app bisa lebih dari 30s default).

## Out of scope

- Halaman signup publik (tidak relevan, admin di-seed lewat story 03).
- Forgot-password UI (ikuti keputusan story 03 soal in/out of scope
  forgot-password).
- `useAuthGuard`/middleware consumer app, itu bagian story 07 (cms), app
  ini cuma jadi TARGET redirect-nya.
- Allowlist origin untuk `r` — dihilangkan by design (poin 7), bukan
  kelupaan.
