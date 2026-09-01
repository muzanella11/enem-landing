# Story 09: Dev Tooling Scripts (`scripts/*.sh`)

**Depends on:** 01
**Output path:** `refactor/scripts/`

## Goal

Port shell script tooling dari `mau-apps/scripts` ke `enem-landing`,
mengikuti pola mau-apps 1:1 termasuk provisioning server via Ansible
(`infra/ansible`), karena keputusan terbaru: enem-landing pindah dari
Drone (SSH + `docker build`/`docker run` manual, single container) ke
pipeline & infra ala mau-apps (GitHub Actions + Ansible + Traefik + managed
DB/Redis) — lihat [10-infra-cicd.md](10-infra-cicd.md).

## Kenapa

Referensi (`mau-apps/scripts/`) berisi:

| Script | Fungsi di mau-apps |
|---|---|
| `create-app.sh` | Scaffold Nx app baru + wiring convention (port registry, env, dsb) |
| `delete-app.sh` | Hapus app + wiring-nya |
| `kill-ports.sh` | Kill semua port dev lokal (daftar port per app) |
| `provision-db.sh` | Provision database di managed instance (Aiven) |
| `provision-server.sh` | Provisioning server baru lewat Ansible (`infra/ansible`) |
| `deploy.sh` | Build + deploy compose stack ke server yang sudah diprovisi |
| `generate-nest-libs-component.sh` | Scaffold controller/service/module di lib Nest |
| `create-library.sh` | Scaffold lib Nx baru interaktif |

Dengan pindah ke Ansible + Traefik, skala infra enem-landing jadi lebih dekat
ke mau-apps daripada perkiraan awal — jadi script-script ini di-port lebih
dekat 1:1, cukup disederhanakan di angka (5 app inti, bukan 20+ seperti
mau-apps). DB juga sama-sama MySQL via Aiven (koreksi 2026-08-31 dari
rencana awal yang salah duga Postgres).

## Scope

### `scripts/kill-ports.sh`
Pola port sama persis dengan `mau-apps/scripts/kill-ports.sh`: `3xxx` untuk
app NestJS (`*-api`), `4xxx` untuk dashboard Vuetify (`*-web`/`*-cms`),
`8xxx` untuk app publik Tailwind (`*-landing-web`/`*-sso-web`/`*-web`
public-facing):
```
PORTS=(
  "3000:enem-landing-account-api"
  "3001:enem-landing-api"
  "4000:enem-landing-cms"
  "8000:enem-landing-account-web"
  "8001:enem-landing-web"
)
```
Adaptasi langsung dari `mau-apps/scripts/kill-ports.sh` (array `"port:name"`,
bukan associative array — tetap kompatibel bash 3.2 bawaan macOS). Nomor
port ini juga dipakai sebagai `devServer.port` masing-masing `nuxt.config.ts`
dan `PORT` env var masing-masing app NestJS (story 03/06), supaya
`kill-ports.sh` selalu akurat.

### `scripts/create-app.sh`
Port dari `mau-apps/scripts/create-app.sh`, disederhanakan ke 2 tipe app
(bukan banyak varian mau-apps):
- `nest` (untuk `sso`/`api`).
- `nuxt` (untuk `web`/`cms`/`sso-web`, dengan pilihan preset Tailwind atau
  Vuetify).

Tetap otomatis: minta nama app (kebab-case, validasi), generate
`.env.example` skeleton, tambahkan entry ke `scripts/kill-ports.sh`, wire ke
`nx.json`/`tsconfig.base.json` kalau perlu.

### `scripts/delete-app.sh`
Counterpart `create-app.sh`: hapus app dari `apps/`, hapus entry dari
`kill-ports.sh`, hapus path alias terkait di `tsconfig.base.json` kalau ada.

### `scripts/provision-db.sh`
Port dari `mau-apps/scripts/provision-db.sh` — sama-sama **MySQL via
Aiven** (koreksi 2026-08-31, lihat catatan DB engine di atas), jadi bisa
lebih dekat 1:1: provision database untuk `enem-landing-account-api` dan
`enem-landing-api` (2 database — sudah dikonfirmasi story 03 pakai
database terpisah `enem_landing_account`, bukan shared-schema), idempotent
(`CREATE DATABASE IF NOT EXISTS`). `DATABASE_URL` diambil dari env var/
prompt interaktif (bukan argumen CLI, konsisten dengan mau-apps supaya
credential tidak ter-render di `ps`/shell history).

### `scripts/provision-server.sh` + `infra/ansible/*`
Port dari `mau-apps/scripts/provision-server.sh` +
`mau-apps/infra/ansible/` (playbooks `init-server.yml`, `deploy.yml`,
`deploy-secrets.yml`, `group_vars/all.yml`, template `traefik-stack.yml.j2`,
inventories `dev`/`prod`). Sesuaikan:
- Jumlah service di `traefik-stack.yml.j2` → 5 app enem-landing, bukan
  15+ service mau-apps.
- `group_vars/all.yml` → env var khusus enem-landing (lihat `.env.example`
  tiap app dari story 03/04/06/07/08).
- Inventory host → host VPS enem-landing yang sudah ada saat ini (cek
  `SSH_HOST` secret yang dipakai `.drone.yml` lama sebagai starting point,
  sebelum didaftarkan ke `infra/ansible/inventories/prod/hosts.ini`).

### `scripts/deploy.sh`
Port dari `mau-apps/scripts/deploy.sh` — wrapper `<dev|prod> <host-ip>
<path-ke-deploy-vars.yml>` yang menjalankan Ansible playbook `deploy.yml`
terhadap host yang sudah diprovisi `provision-server.sh`. `deploy-vars.yml`
(berisi credential asli: `DATABASE_URL` Aiven, `REDIS_*` Upstash,
`JWT_SECRET`, dst) **tidak pernah** di-commit — simpan di luar repo (mis.
scratchpad lokal atau secret manager), sama seperti catatan di komentar
header `mau-apps/scripts/deploy.sh`.

### `scripts/generate-nest-libs-component.sh`
Port langsung dari mau-apps (`nx g @nestjs/schematics:controller|service|module
--project=<lib>`), tidak banyak berubah — tetap berguna untuk scaffold isi
`libs/backend/sso`, `libs/backend/redis`, dan lib Nest lain kalau bertambah.

### `scripts/create-library.sh`
Opsional, prioritas rendah — port langsung kalau ada waktu, skip kalau
tidak, karena jumlah lib di enem-landing kemungkinan tetap kecil dan bisa
di-generate manual lewat `nx g @nx/js:lib`.

## Acceptance Criteria

- [x] `./scripts/kill-ports.sh` membunuh semua proses dev app di atas tanpa
      error kalau port tidak sedang dipakai (`|| true` semantics, sama
      seperti mau-apps). Diverifikasi 2 kali langsung: sekali dengan 3 dev
      server sungguhan jalan (account-api/api/web sisa dari sesi
      sebelumnya, port 3000/3001/8001), sekali lagi tanpa ada port yang
      dipakai (no-op bersih).
- [x] `./scripts/create-app.sh` berhasil scaffold app baru + auto-update
      `kill-ports.sh` (test dengan 1 app dummy, lalu hapus lagi pakai
      `delete-app.sh`). Diverifikasi end-to-end 3x (nest, nuxt+tailwind,
      nuxt+vuetify) — lihat catatan bug di bawah, 2 bug nyata ditemukan
      dan diperbaiki dari test ini.
- [x] `./scripts/provision-db.sh` idempotent — jalan 2x tidak error, tidak
      duplikat database, berhasil terhadap instance Aiven MySQL. Tidak ada
      akses ke Aiven sungguhan dari sesi ini — diverifikasi terhadap
      MySQL 8 lokal (docker container `mysql`) dengan 2 user berbeda
      (root, dan user `user` yang sama dipakai tiap app's `.env.example`),
      jalan 2x berturut-turut tanpa error/duplikat.
- [ ] `./scripts/provision-server.sh <dev|prod> <host-ip>` berhasil
      menjalankan Ansible playbook `init-server.yml` terhadap VPS target
      (Docker + Traefik terpasang, idempotent). **Tidak bisa diverifikasi
      end-to-end** — tidak ada VPS target sungguhan, dan IP prod asli
      cuma ada di secret `SSH_HOST` Drone lama (tidak bisa dibaca dari
      sini) — lihat placeholder TODO di
      `infra/ansible/inventories/prod/hosts.ini`. Yang sudah diverifikasi:
      seluruh playbook YAML valid (`yaml.safe_load`), `init-server.yml`/
      `deploy.yml`/`deploy-secrets.yml` lolos `ansible-playbook
      --syntax-check`, template `traefik-stack.yml.j2` valid Jinja2, dan
      script wrapper (`provision-server.sh`) menolak dengan benar kalau
      deploy key/host belum siap.
- [x] `./scripts/deploy.sh <dev|prod> <host-ip> <deploy-vars.yml>` berhasil
      deploy stack ke server yang sudah diprovisi. Sebagian: end-to-end
      real deploy juga tidak bisa diverifikasi (alasan sama seperti di
      atas — tidak ada compose.yml juga, itu baru ditambahkan story 10).
      Yang diverifikasi penuh: seluruh guard clause script (deploy-vars.yml
      tidak ada, deploy-vars.yml sengaja diletakkan di dalam repo — baik
      path relative maupun absolute, host belum terdaftar di inventory)
      dan pipeline argumen sampai ke `ansible-playbook` sungguhan (host IP
      dummy TEST-NET-3, gagal dengan "unreachable" seperti yang
      diharapkan — bukan gagal karena argumen salah).
- [x] Semua script punya `set -euo pipefail` (atau `set -e` minimal) dan
      pesan error yang jelas saat gagal (pola `print_step`/`print_done`/
      `print_error` dari mau-apps, konsisten dipakai di semua script baru).

## Out of scope

- Playbook/role Ansible di luar yang sudah ada polanya di mau-apps
  (`init-server.yml`, `deploy.yml`, `deploy-secrets.yml`) — kalau enem-landing
  butuh role baru, itu perluasan terpisah setelah MVP infra ini jalan.

## Status: SELESAI, minus verifikasi terhadap infra sungguhan (2026-09-01)

Semua script dibangun dan lolos verifikasi yang bisa dilakukan tanpa akses
ke VPS/Aiven sungguhan. 2 item eksplisit tidak terverifikasi end-to-end
(`provision-server.sh` dan `deploy.sh`'s real rollout) — bukan karena
scriptnya belum jadi, tapi karena tidak ada server/compose.yml target di
sesi ini (compose.yml sendiri baru ditambahkan story 10).

Dibangun:
- `scripts/kill-ports.sh` — port list 3000/3001/4000/8000/8001, pola
  `mau-apps` persis (plain array, bash 3.2-compatible).
- `scripts/create-app.sh` + `scripts/delete-app.sh` — disederhanakan ke 2
  kind (`nest`, `nuxt` dengan preset `tailwind`/`vuetify`), BUKAN
  transliterasi 1911-baris `mau-apps/scripts/create-app.sh` — root
  `package.json` enem-landing tidak punya aggregate `nx:*`/`dev:*` scripts
  sama sekali (semua target Nx-plugin-inferred, lihat `nx.json`), jadi
  ~90% dari versi mau-apps (rewrite `package.json`, port-registry di
  `package.json`) tidak relevan di sini. `delete-app.sh` mengandalkan
  `nx g @nx/workspace:remove` untuk cleanup `tsconfig.json` references
  (dikonfirmasi otomatis, tidak perlu logic manual).
- `scripts/provision-db.sh` — 2 database (`enem_landing_account`,
  `enem_landing_api`), bukan 4 domain x dev/prod (8 database) seperti
  mau-apps — story 03/06 sudah pakai 1 database per app, bukan
  per-environment suffix.
- `scripts/provision-server.sh` + `infra/ansible/init-server.sh` +
  `infra/ansible/playbooks/init-server.yml` — port dari mau-apps minus
  seluruh task RabbitMQ (build image lokal, storage dir) — enem-landing
  tidak punya service self-host apapun (MySQL Aiven, Redis Upstash).
  Network di-rename `mau-network` → `enem-landing-network`, path
  `/opt/mau-apps` → `/opt/enem-landing`.
- `scripts/deploy.sh` + `infra/ansible/playbooks/deploy.yml` — rollout
  per-service dipertahankan dari mau-apps (aman baik untuk 5 service
  atau 16+), header dokumentasi `app_env` diganti total ke variable
  enem-landing sungguhan (dibaca dari kelima `.env.example` app) — MySQL
  Aiven x2 (`DATABASE_URL_ACCOUNT_API`/`DATABASE_URL_API`), Redis
  Upstash, 1 `JWT_SECRET` (bukan 4 seperti mau-apps — cuma 1 identity
  provider di sini), R2 uploads. Var non-secret (CORS_ORIGIN,
  `*_HOST`, `ALLOW_SIGNUP`) sengaja tidak masuk `app_env` — itu wiring
  `compose.yml` (story 10), bukan credential.
- `infra/ansible/playbooks/deploy-secrets.yml`,
  `infra/ansible/playbooks/group_vars/all.yml`,
  `infra/ansible/playbooks/templates/traefik-stack.yml.j2`,
  `infra/ansible/playbooks/files/check-memory.sh` — di-port nyaris
  verbatim, generic/tidak app-specific di mau-apps aslinya.
- `infra/ansible/inventories/{dev,prod}/hosts.ini` — kosong, siap diisi
  manual. Inventory prod SENGAJA dikasih placeholder TODO, bukan IP
  sungguhan — IP prod asli ada di secret `SSH_HOST` punya `.drone.yml`
  lama, tidak bisa dibaca dari sesi ini.
- `scripts/generate-nest-libs-component.sh`, `scripts/create-library.sh`
  — di-port nyaris verbatim (generic di mau-apps aslinya juga).

Bug nyata yang ditemukan & diperbaiki dari testing end-to-end (bukan
dari membaca kode saja):
- `create-app.sh`'s port-scan awal cuma scan `PORT=` di `.env.example`
  tiap app — `enem-landing-web` TIDAK PUNYA baris `PORT=` sama sekali
  (port 8001-nya hardcode langsung di `nuxt.config.ts`), jadi app dummy
  pertama yang di-generate collide ke port 8001 yang sebetulnya sudah
  dipakai. Fix: scan juga `nuxt.config.ts`'s `port: <n>` sebagai fallback.
- `create-app.sh`'s Nuxt config patch awalnya BLOCK-INSERT satu salinan
  config baru sebelum body asli hasil generator `@nx/nuxt:app` (yang
  SUDAH punya `workspaceDir`/`devServer`/`typescript`/`imports`/`css`/
  `vite` sendiri) — bukan cuma bikin file jadi jelek/dobel, tapi key yang
  sama (`port`, `typeCheck`) muncul 2x di object literal JS, dan yang
  BELAKANGAN (body asli generator, `port: 4200`) yang menang di runtime.
  Ketemu langsung dari generate app dummy lalu baca hasilnya - app itu
  TIDAK akan pernah jalan di port yang baru saja diklaim script-nya.
  Fix: ganti ke targeted string-replace (`port: \d+,` → `port: ${port},`,
  `typeCheck: true,` → `typeCheck: false,`, plus insert SATU key baru
  `modules: [...]`) - generator's own boilerplate sudah benar untuk
  semua key lain, cuma 2 value + 1 key baru yang perlu diubah.
- `deploy.sh`'s guard "deploy-vars.yml jangan taruh di dalam repo"
  (`"$DEPLOY_VARS" == "$SCRIPT_DIR"/*`) cuma menangkap path ABSOLUTE -
  path relative dari dalam repo (`infra/ansible/deploy-vars.yml`, cara
  paling wajar orang menjalankan ini) lolos begitu saja karena tidak
  pernah match prefix absolute `$SCRIPT_DIR`. Bug yang sama persis ada
  di `mau-apps/scripts/deploy.sh` aslinya juga (di-warisi lewat porting,
  ketemu dari test end-to-end, bukan dari membaca kode). Fix: resolve
  `$DEPLOY_VARS` ke absolute path dulu sebelum dibandingkan.

Tidak sempat/tidak relevan diverifikasi:
- `shellcheck` tidak terinstall di environment ini - tidak ada linting
  otomatis terhadap script-script ini, cuma `bash -n` (syntax-only) +
  review manual.
- `ansible-lint` juga tidak terinstall - verifikasi Ansible terbatas ke
  `--syntax-check` + validasi YAML/Jinja2 manual (`yaml.safe_load`,
  `jinja2.Environment().parse()`).
