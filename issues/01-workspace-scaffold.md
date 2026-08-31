# Story 01: Nx Workspace Scaffold

**Depends on:** -
**Output path:** `refactor/`

## Goal

Buat Nx workspace baru dari nol di dalam `refactor/`, menggunakan Nx versi
terbaru (`23.1.2` saat brainstorm ini ditulis — cek ulang versi terbaru saat
eksekusi), dikonfigurasi agar berjalan di Node 26+, sebagai fondasi untuk
semua app dan lib di story-story berikutnya.

## Kenapa

`enem-landing` saat ini bukan monorepo (single Nuxt 2 app di root). Semua app
baru (`sso`, `sso-web`, `api`, `cms`, `web`) butuh workspace Nx yang solid
sebelum kode aplikasi mulai ditulis. Dikerjakan di `refactor/` supaya root
repo yang sedang live tidak terganggu sampai cutover (story 11).

## Scope

- Inisialisasi Nx workspace kosong di `refactor/` (`npx create-nx-workspace@latest`
  atau `npx nx@latest init`, pilih integrated monorepo, bukan standalone).
- Install & pin plugin: `@nx/nest`, `@nx/nuxt`, `@nx/node`, `@nx/js`,
  `@nx/eslint`, `@nx/playwright`, `@nx/vite`.
- `package.json` root: set `"engines": { "node": ">=26" }`, `.nvmrc` isi
  `26` (atau versi persis yang dipin, cek `node -v` di environment target).
- `nx.json`: named inputs, target defaults, plugin registration — mirror
  struktur `mau-apps/nx.json` (lihat referensi di bawah) tapi trim yang tidak
  relevan (mis. tidak perlu `@nx/webpack` plugin kalau semua app pakai
  esbuild/vite bawaan @nx/nest & @nx/nuxt).
- `tsconfig.base.json`: `customConditions` di-set ke `@enem-landing/source`.
  **Catatan dari eksekusi**: Nx 23 (berbeda dari gaya lama `mau-apps`/Nx 19)
  tidak lagi pakai `paths` manual di `tsconfig.base.json` untuk cross-lib
  import — tiap app/lib punya `package.json` sendiri dengan field `name`
  (mis. `@enem-landing/shared-types`), di-resolve otomatis lewat symlink
  yarn workspaces di `node_modules/@enem-landing/*`. Jadi tidak ada `paths`
  yang perlu ditulis manual; cukup pastikan `workspaces` glob di root
  `package.json` (`apps/*`, `libs/*`, `libs/*/*`) mencakup semua lokasi lib.
- `.eslintrc` / flat config root, `.prettierrc`, `.editorconfig` — boleh
  copy-adapt dari `mau-apps` root config.
- **Risk spike (wajib sebelum lanjut ke story 03/06):**
  - Generate 1 app NestJS percobaan (`nx g @nx/nest:app tmp-probe`), tambahkan
    `@nestjs/typeorm` + `typeorm`. Coba pin `typeorm@legacy` (0.3.31, API yang
    dipakai mau-apps) dulu — kalau `@nestjs/typeorm@12` tidak cocok, baru
    evaluasi migrasi ke `typeorm@latest` (1.x, breaking API change).
    Dokumentasikan keputusan final di README workspace.
  - Generate 1 app Nuxt percobaan dengan `vuetify-nuxt-module` (masih `rc`
    saat brainstorm ini) di atas Nuxt 4 + Vite — pastikan dev server &
    production build jalan tanpa error. Kalau modul rc bermasalah, fallback:
    wire Vuetify manual (plugin + Vite plugin `vite-plugin-vuetify`).
  - Hapus app-app probe setelah spike selesai (`nx g @nx/workspace:remove
    tmp-probe`).

## Acceptance Criteria

- [ ] `refactor/` berisi Nx workspace valid (`nx graph` jalan, `nx report`
      menunjukkan Node 26+, Nx `23.x`).
- [ ] `yarn install` (atau package manager yang dipilih) sukses tanpa
      peer-dependency error fatal.
- [ ] Keputusan `typeorm` (legacy 0.3.x vs latest 1.x) didokumentasikan.
- [ ] Keputusan `vuetify-nuxt-module` (pakai rc, atau fallback manual)
      didokumentasikan.
- [ ] `workspaces` glob di root `package.json` mencakup semua lokasi app/lib
      yang direncanakan (`apps/*`, `libs/*`, `libs/*/*`) — resolusi cross-lib
      import lewat `package.json` name + yarn workspaces symlink, bukan
      `paths` manual (lihat catatan di atas).
- [ ] `refactor/README.md` berisi ringkasan keputusan arsitektur (boleh
      salin dari `issues/00-epic-overview.md`) + cara menjalankan workspace.

## Status: SELESAI (2026-08-31)

Dieksekusi dengan Node `26.3.0`, Nx `23.1.1`, Yarn `1.22.22`. Semua AC di
atas terpenuhi. Detail lengkap keputusan teknis (versi NestJS yang
di-generate, verifikasi TypeORM, verifikasi Vuetify, catatan
`typescript.typeCheck`) ada di `refactor/README.md`, bukan diduplikasi di
sini — baca file itu sebagai sumber kebenaran current state workspace.

## Out of scope

- Implementasi app/lib apa pun (story 02 dst).
- CI/CD (story 10).
