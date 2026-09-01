# Story 08: enem-landing-web (Public Landing Page)

**Depends on:** 06
**Output path:** `refactor/apps/enem-landing-web`,
`refactor/apps/enem-landing-web-e2e`

## Goal

Migrasi landing page publik yang sekarang ada di root repo (Nuxt 2,
`pages/index.vue` + `components/*` + Bootstrap) ke Nuxt 4 + Tailwind,
mengonsumsi `enem-landing-api` (story 06) untuk seluruh konten, dan mengganti
contact form `mailto:` dengan `POST /contact-submissions`.

## Kenapa

Ini adalah tujuan akhir refactor dari sisi pengunjung situs: halaman yang
sama secara fungsi/konten, tapi datanya sekarang dikelola lewat CMS
(story 07), bukan hardcode/`static/experience.json`.

## Scope

### Konten yang perlu di-migrasi (audit dari `pages/index.vue` +
`components/*` saat ini)
- Section Experience/Timeline → `GET /experiences`.
- Section Portfolio/Projects (nested di experience) → sudah include di
  response `/experiences`.
- Navigation (`components/Navigation.vue`), Masthead
  (`components/Masthead.vue`), Footer (`components/Mastfooter.vue`,
  `Copyright.vue`) → migrasi ke komponen Vue baru dengan Tailwind, konten
  hero/bio dari `GET /site-profile`.
- Contact form → `POST /contact-submissions`, tampilkan
  success/error state (gantikan `isSubmitted`/`isError` yang sekarang ada di
  `pages/index.vue`).
- Business card component (`toggleBusinessCard`) → cek apakah masih relevan
  dipertahankan atau digantikan sesuatu yang lebih sesuai desain baru;
  default: pertahankan fungsinya, styling ulang dengan Tailwind.
- `Tutorial.vue`, `NuxtLogo.vue` → cek relevansi (kemungkinan besar
  leftover dari Nuxt starter template, bukan konten produk) — exclude dari
  migrasi kecuali ternyata dipakai nyata di halaman live.

### SEO
- `GET /seo-meta/:pageKey` untuk populate `<Head>`/`useSeoMeta` per halaman,
  gantikan config statis di `nuxt.config.js` (`@nuxtjs/robots`,
  `@nuxtjs/sitemap` tetap dipertahankan sebagai module, tapi title/description
  sekarang dinamis dari API).

### Config
- `.env.example` — `API_HOST` (`enem-landing-api`).

## Acceptance Criteria

- [ ] Halaman publik menampilkan Experience/Project yang sama persis
      (parity check manual side-by-side) dengan situs live saat ini, setelah
      data di-migrasi ke DB (story 11). Menunggu story 11 (data belum
      di-cutover) — struktur render (section, field, fallback state) sudah
      terverifikasi, tapi belum ada parity check konten sungguhan.
- [x] Contact form berhasil submit ke `enem-landing-api`, menampilkan
      success/error state, dan submission-nya muncul di
      `enem-landing-cms/contact-submissions`. Diverifikasi lewat e2e
      (submit sungguhan ke `POST /contact-submissions`) + query langsung ke
      tabel `contact_submissions` (row-nya sama yang dibaca list
      `enem-landing-cms`, story 07) — belum diklik manual lewat CMS UI.
- [x] SEO meta tag ter-render sesuai `GET /seo-meta` per halaman.
- [x] `enem-landing-web-e2e` (Playwright): render halaman utama, submit
      contact form, verifikasi meta tag.
- [x] `nx serve enem-landing-web` jalan lokal, `nx build` sukses.
      `nx generate` tidak relevan — halaman render dinamis lewat SSR
      (Nitro `node-server` preset) yang fetch dari `enem-landing-api` saat
      request, bukan static generation.
- [ ] Lighthouse/perf check dasar — pastikan tidak regresi signifikan dari
      versi Nuxt 2 sekarang (opsional tapi disarankan sebelum cutover).

## Out of scope

- Redesign visual (lihat catatan "Out of scope" di
  [00-epic-overview.md](00-epic-overview.md)) — target parity konten &
  fungsi, bukan desain baru.

## Status: SELESAI, minus 2 item yang menunggu story lain (2026-09-01)

Semua AC inti terpenuhi. Dua yang belum: parity check konten sungguhan
(menunggu cutover data story 11) dan Lighthouse/perf check (eksplisit
opsional).

Dibangun: 5 BFF proxy route (`server/api/**`) ke `enem-landing-api` lewat
helper `server/utils/api-client.ts` (`experiences`, `site-profile`,
`skills`, `seo-meta/:pageKey`, `contact-submissions` POST); halaman
publik satu-page (`index.vue`) migrasi dari Nuxt 2 + Bootstrap ke
Nuxt 4 SSR + Tailwind — Navigation (scroll-shrink header), Masthead (hero
+ skills dari API), Experience/Portfolio/About/Contact section, Footer +
Copyright, `PortfolioModal`, `toggleBusinessCard` dipertahankan sesuai
scope. SEO meta dari `GET /seo-meta/:pageKey` dengan fallback ke default
hardcoded kalau belum ada row untuk page tersebut.

`enem-landing-web-e2e`: `.env.example` ditambahkan (`API_HOST`,
konsisten dengan pola app lain); `playwright.config.mts` yang di-generate
otomatis (`serve-static` di port 4200) diganti ke `serve` (app ini punya
Nitro server routes/BFF seperti `enem-landing-cms`, bukan static site)
plus port yang benar (8001) dan `webServer` array yang juga menjalankan
`enem-landing-api`. 3 spec (12 test lewat chromium/firefox/webkit,
3x run stabil): `home.spec.ts` (nav + 4 section render, agnostik
terhadap isi seed data), `contact-form.spec.ts` (submit sukses +
business-card toggle), `seo-meta.spec.ts` (baca `GET /api/seo-meta/home`
sungguhan dan bandingkan dengan tag yang di-render, bukan asumsi state DB
kosong — DB dev yang dipakai verifikasi ternyata sudah ada row seo-meta
dari sesi CMS sebelumnya).

Bug yang ditemukan & diperbaiki selama menulis e2e (bukan bug app,
kesalahan test itu sendiri — dicatat karena polanya bisa muncul lagi):
- `getByText('muzanella11@gmail.com')` tanpa `{ exact: true }` cocok ke 2
  elemen: paragraf business-card DAN kalimat footer `Copyright.vue` yang
  juga menyebut email yang sama secara inline — strict-mode violation
  Playwright.
- Asumsi awal "DB fresh, seo-meta 'home' belum ada row" salah untuk DB
  dev yang dipakai (sudah ada row dari sesi CMS sebelumnya) — test
  di-refactor untuk baca response BFF yang sama (`GET /api/seo-meta/home`)
  dan bandingkan terhadap itu, bukan hardcode salah satu state.

