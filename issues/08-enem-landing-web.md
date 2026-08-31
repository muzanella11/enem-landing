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
      data di-migrasi ke DB (story 11).
- [ ] Contact form berhasil submit ke `enem-landing-api`, menampilkan
      success/error state, dan submission-nya muncul di
      `enem-landing-cms/contact-submissions`.
- [ ] SEO meta tag ter-render sesuai `GET /seo-meta` per halaman.
- [ ] `enem-landing-web-e2e` (Playwright): render halaman utama, submit
      contact form, verifikasi meta tag.
- [ ] `nx serve enem-landing-web` jalan lokal, `nx build`/`nx generate`
      (kalau tetap butuh static generation untuk SEO) sukses.
- [ ] Lighthouse/perf check dasar — pastikan tidak regresi signifikan dari
      versi Nuxt 2 sekarang (opsional tapi disarankan sebelum cutover).

## Out of scope

- Redesign visual (lihat catatan "Out of scope" di
  [00-epic-overview.md](00-epic-overview.md)) — target parity konten &
  fungsi, bukan desain baru.
