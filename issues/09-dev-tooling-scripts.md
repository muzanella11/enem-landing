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

- [ ] `./scripts/kill-ports.sh` membunuh semua proses dev app di atas tanpa
      error kalau port tidak sedang dipakai (`|| true` semantics, sama
      seperti mau-apps).
- [ ] `./scripts/create-app.sh` berhasil scaffold app baru + auto-update
      `kill-ports.sh` (test dengan 1 app dummy, lalu hapus lagi pakai
      `delete-app.sh`).
- [ ] `./scripts/provision-db.sh` idempotent — jalan 2x tidak error, tidak
      duplikat database, berhasil terhadap instance Aiven MySQL.
- [ ] `./scripts/provision-server.sh <dev|prod> <host-ip>` berhasil
      menjalankan Ansible playbook `init-server.yml` terhadap VPS target
      (Docker + Traefik terpasang, idempotent).
- [ ] `./scripts/deploy.sh <dev|prod> <host-ip> <deploy-vars.yml>` berhasil
      deploy stack ke server yang sudah diprovisi.
- [ ] Semua script punya `set -euo pipefail` (atau `set -e` minimal) dan
      pesan error yang jelas saat gagal (pola `print_step`/`print_done`/
      `print_error` dari mau-apps, konsisten dipakai di semua script baru).

## Out of scope

- Playbook/role Ansible di luar yang sudah ada polanya di mau-apps
  (`init-server.yml`, `deploy.yml`, `deploy-secrets.yml`) — kalau enem-landing
  butuh role baru, itu perluasan terpisah setelah MVP infra ini jalan.
