# enem-landing (refactor workspace)

Nx monorepo baru untuk enem-landing, dikembangkan di sini (`refactor/`)
secara paralel dengan root repo (Nuxt 2 lama) sebelum cutover. Lihat
`../issues/00-epic-overview.md` untuk breakdown story lengkap dan latar
belakang keputusan arsitektur.

## Arsitektur ringkas

5 app inti (+3 app e2e), mengikuti pola `mau-apps`
(`/Users/muzanella/Projects/Code/muzanella/mau-apps`):

| App | Stack | Peran |
|---|---|---|
| `enem-landing-account` | NestJS | Identity provider (JWT signin/whoami), single-admin |
| `enem-landing-account-web` | Nuxt 4 + Tailwind | Halaman login + bounce-back token |
| `enem-landing-api` | NestJS | Business domain: experience, projects, contact, site-profile, seo-meta, skills |
| `enem-landing-cms` | Nuxt 4 + Vuetify | Admin dashboard, auth via redirect ke sso-web |
| `enem-landing-web` | Nuxt 4 + Tailwind | Public landing page (pengganti Nuxt 2 root repo saat ini) |

Pola port dev (sama seperti `mau-apps/scripts/kill-ports.sh`): `3xxx` untuk
app NestJS, `4xxx` untuk dashboard Vuetify, `8xxx` untuk app publik
Tailwind — lihat `../issues/09-dev-tooling-scripts.md`.

Infra: Ansible (provisioning server + Traefik reverse proxy), GitHub Actions
(CI/CD, gantikan Drone), DB via Aiven (Postgres), Redis via Upstash — lihat
`../issues/10-infra-cicd.md`.

## Keputusan teknis (hasil risk spike Story 01)

Dikerjakan 2026-08-31 dengan Node `26.3.0`, Nx `23.1.1`, Yarn `1.22.22`.

- **Nx**: versi `23.1.1` (latest saat scaffold), integrated-style monorepo
  (`apps/`, `libs/`), tapi mengikuti default Nx 23 yang package-based —
  tiap app/lib punya `package.json` sendiri (dipakai untuk
  `@nx/js:prune-lockfile` saat build Docker image), sementara root
  `package.json` tetap jadi single source dependency resolution/lockfile
  (yarn workspaces glob: `apps/*`, `libs/*`, `libs/*/*`). Ini beda dari
  gaya `mau-apps` (Nx 19, single `package.json`, tanpa yarn workspaces) —
  bukan regresi, ini memang perilaku standar Nx versi terbaru.
- **NestJS**: `@nx/nest@23.1.1` men-generate app dengan `@nestjs/common@^11`
  (bukan `^12` yang merupakan versi npm terbaru saat brainstorm) — dipakai
  versi yang di-generate Nx karena itu yang resmi didukung
  tooling/executor-nya saat ini.
- **TypeORM**: `@nestjs/typeorm@^12.0.1` + `typeorm@0.3.31` (dist-tag
  `legacy`) + `pg` driver — **terverifikasi build sukses** dengan
  `TypeOrmModule.forRoot()` + Postgres di Node 26. `typeorm@latest` (1.x)
  sengaja TIDAK dipakai: `@nestjs/typeorm@12`'s peer dependency hanya
  menerima `typeorm ^0.3.0 || ^1.0.0-dev` (prerelease), belum ada dukungan
  stabil untuk 1.x.
- **Vuetify**: `vuetify@^4.1.12` + `vuetify-nuxt-module@1.0.0-rc.5` (masih
  rc) — **terverifikasi bekerja** di atas Nuxt `4.5.2`: build produksi
  sukses, dev server sukses, komponen (`v-app`, `v-btn`, dst) ter-render
  dengan class CSS yang benar di SSR HTML. Satu warning non-fatal:
  `useLayout` composable Vuetify bentrok nama dengan built-in auto-import
  Nuxt 4 — Nuxt otomatis memenangkan versi Vuetify (bukan built-in-nya),
  tidak ada tindakan lanjut yang diperlukan kecuali suatu saat modul rc ini
  stabil jadi versi non-rc (pantau saat implementasi story 07).
- **Nuxt `typescript.typeCheck`**: **harus** di-set `false` di tiap
  `nuxt.config.ts` — default generator (`true`) menyebabkan `nuxt build`
  gagal (`TS6305`, konflik antara composite project references
  `tsconfig.base.json` dan `.nuxt/tsconfig.json` yang di-generate Nuxt).
  Type-checking tetap tersedia lewat target `nx typecheck <app>` terpisah
  (inferred dari plugin `@nx/js/typescript`) — walau saat ini target itu
  jadi no-op untuk project Nuxt (`noEmit: true` di salah satu project
  reference-nya) karena keterbatasan integrasi `@nx/nuxt@23.1.1` dengan
  TS project references Nx 23. IDE (Vue Language Tools) tetap memberi
  feedback type-error saat development; CI bisa menambah langkah `vue-tsc
  --noEmit` manual di story 10 kalau strict typecheck di CI dianggap
  penting.
- **customConditions**: tsconfig.base.json pakai `@enem-landing/source`
  (disesuaikan dari default `@org/source`).
- **DB engine: MySQL, bukan Postgres** (koreksi dari brainstorm awal —
  mau-apps sendiri pakai MySQL). Driver `mysql2`. Migration TypeORM ditulis
  pakai `Table`/`TableIndex` builder API (portable antar dialect), bukan
  raw SQL Postgres-specific.
- **CLI script (migration/seed) TIDAK boleh dijalankan lewat `tsx`
  langsung** — esbuild (dipakai `tsx`) tidak mendukung andal
  `emitDecoratorMetadata` walau `experimentalDecorators` didukung,
  menyebabkan `ColumnTypeUndefinedError` runtime pada entity TypeORM.
  Solusinya: compile dulu pakai `tsc` asli ke `dist-cli/` (lihat
  `tsconfig.cli.json` + target `build-cli` di app manapun yang punya
  migration/seed), baru jalankan hasilnya dengan `node` biasa. Detail
  lengkap di `issues/03-enem-landing-account-api.md` bagian "Status".
  Juga: export TS-only dari `typeorm` (`MigrationInterface`,
  `QueryRunner`, `DataSourceOptions`) dan `typeorm-extension`
  (`Seeder`/`SeederOptions`) **wajib** `import type` eksplisit —
  `isolatedModules` tidak selalu bisa elide otomatis saat dipakai lewat
  `implements`/type annotation.
- **`experimentalDecorators` + `emitDecoratorMetadata`** (ditemukan saat
  Story 02): default generator Nx 23 **tidak** menyalakan keduanya di
  `tsconfig.base.json` — TypeScript 6 default ke standard TC39 decorators.
  `tsc --build` tetap sukses dengan `@Injectable()` dkk (standard decorators
  valid secara sintaks untuk class decorator sederhana), **tapi** NestJS DI
  bergantung pada `emitDecoratorMetadata` (reflect-metadata) untuk introspeksi
  tipe parameter constructor — yang tidak didukung standard decorators.
  Tanpa fix ini, semua `@Injectable()`/`@Controller()` dkk akan lolos build
  tapi gagal secara diam-diam di runtime (constructor injection tidak
  mendapat tipe yang benar). Sudah ditambahkan ke `tsconfig.base.json` root
  (`"experimentalDecorators": true, "emitDecoratorMetadata": true`) —
  berlaku otomatis untuk semua app/lib turunannya, tidak perlu diulang per
  project.

## Menjalankan workspace

```sh
cd refactor
yarn install
yarn nx graph              # lihat project graph (kosong sampai story 03+ generate app pertama)
yarn nx run <project>:serve
yarn nx run <project>:build
yarn nx run-many -t lint,test,build   # semua project
```

Generate app/lib baru pakai generator Nx langsung dulu (sampai
`scripts/create-app.sh` dari Story 09 selesai dibuat):

```sh
yarn nx g @nx/nest:app apps/enem-landing-account --e2eTestRunner=none
yarn nx g @nx/nuxt:app apps/enem-landing-web --e2eTestRunner=playwright
```

Set `typescript.typeCheck: false` di `nuxt.config.ts` tiap app Nuxt segera
setelah generate (lihat catatan risk spike di atas).
