# Story 11: Data Migration & Cutover

**Depends on:** 10
**Output path:** root repo (replace legacy Nuxt 2 code with `refactor/*`
content)

## Goal

Migrasi data konten yang sekarang hardcode/statis ke database (lewat
`enem-landing-api`/`enem-landing-account-api`), lalu pindahkan seluruh isi
`refactor/` menjadi isi root repo, hapus kode Nuxt 2 lama, dan deploy ke
production menggantikan situs yang live sekarang.

## Kenapa

Ini story terakhir — semua app sudah divalidasi berjalan mandiri di
`refactor/` (story 01-10), sekarang saatnya menggantikan root repo yang
masih Nuxt 2 dengan hasil refactor, tanpa downtime yang tidak perlu.

## Scope

### Data migration
- Seed admin user (`enem-landing-account-api`) dari kredensial yang kamu tentukan
  sendiri (env var, bukan hardcode di kode/migration file).
- Migrasi isi `static/experience.json` (root repo saat ini) → insert ke
  tabel `experiences`/`projects` (`enem-landing-api`), lewat seed script
  satu kali (bukan endpoint publik) — tulis script migrasi khusus yang baca
  file JSON lama dan POST/insert lewat repository TypeORM langsung.
- Populate `site-profile` dari konten yang sekarang ada di
  `components/Masthead.vue`/`Navigation.vue`/`Mastfooter.vue` (bio, social
  links, dll — audit manual, tidak ada file data terpisah untuk ini di
  root repo saat ini).
- Populate `seo-meta` dari config SEO statis yang sekarang ada di
  `nuxt.config.js` root repo.

### Parity QA (sebelum cutover)
- Checklist perbandingan manual side-by-side: situs live sekarang vs
  `enem-landing-web` (story 08) yang jalan lokal/staging dengan data hasil
  migrasi di atas — pastikan semua section, teks, dan link project sama.
- Test contact form end-to-end: submit di `enem-landing-web` → verifikasi
  muncul di `enem-landing-cms/contact-submissions`.
- Test SSO flow end-to-end: login admin → akses semua halaman CMS → logout.

### Cutover
- Pindahkan isi `refactor/*` ke root repo:
  - `refactor/apps/*` → `apps/*` (root)
  - `refactor/libs/*` → `libs/*` (root)
  - `refactor/nx.json`, `tsconfig.base.json`, `package.json`, dll → root
    (replace file lama).
  - `refactor/scripts/*` → `scripts/*` (root)
  - `refactor/compose*.yml`, Dockerfile → root
- Hapus file/folder legacy Nuxt 2 yang sudah tidak dipakai: `pages/`,
  `components/` (root, lama), `store/`, `layouts/`, `mixins/`,
  `startbootstrap/`, `static/` (setelah data-nya sudah dimigrasi), `assets/`
  (root, lama), `nuxt.config.js` (lama), `jsconfig.json`, `app.html`,
  `Dockerfile.demo`/`.develop`/`.staging` (kalau environment itu sudah tidak
  relevan — konfirmasi dulu sebelum hapus), `.eslintrc.js`/`.eslintignore`/
  `stylelint.config.js`/`.stylelintignore` (lama, digantikan config Nx
  workspace).
- Update `.drone.yml` final (hasil story 10) sudah reflect struktur baru.
- Update `README.md` root — arsitektur baru, cara jalanin tiap app.

### Rollback plan
- Sebelum cutover ke `master`, deploy dulu ke branch/environment staging
  (`.drone.yml` sudah punya pipeline exclude untuk branch selain
  master/demo/develop/release — manfaatkan salah satu branch itu untuk
  staging run dulu).
- Simpan tag/commit terakhir versi Nuxt 2 lama (`git tag pre-refactor-nx`)
  sebelum menghapus kode lama, supaya ada titik rollback jelas kalau
  production bermasalah setelah cutover.

## Acceptance Criteria

- [ ] Semua data dari `static/experience.json` termigrasi lengkap ke DB,
      terverifikasi lewat `GET /experiences` == isi file lama (structural
      diff, bukan cuma spot-check).
- [ ] Parity QA checklist di atas selesai tanpa temuan blocking.
- [ ] `git tag pre-refactor-nx` dibuat sebelum penghapusan kode lama.
- [ ] Root repo setelah cutover: `nx graph` menunjukkan 5 app + 3 e2e app +
      lib-lib, `nx build` semua app sukses dari root (bukan dari
      `refactor/` lagi).
- [ ] Deploy production (lewat `.drone.yml` + `scripts/deploy.sh`) sukses,
      situs live menampilkan konten yang sudah termigrasi dengan benar.
- [ ] `refactor/` folder sudah kosong/dihapus (isinya sudah pindah ke root).

## Out of scope

- Fitur baru di luar yang sudah didefinisikan story 01-10 — cutover murni
  memindahkan yang sudah dibangun & divalidasi, bukan tempat menambah scope
  baru.
