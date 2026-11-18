# GitHub Actions Secrets - Checklist

Daftar secret yang perlu disiapkan sebelum GitHub Actions workflow
(`.github/workflows/*.yml`, story 10) bisa jalan sungguhan. Diambil
langsung dari referensi `secrets.*` di ke-7 workflow file, bukan ditebak.

## Otomatis - tidak perlu disiapkan

- `GITHUB_TOKEN` - disuplai otomatis oleh GitHub di setiap run (dipakai
  `build-push.yml` untuk push image ke GHCR).

## Secret level repository

Repo Settings -> Secrets and variables -> Actions -> tab **Secrets**
(bukan di dalam environment manapun).

| Secret | Untuk | Sumber nilai |
|---|---|---|
| `JWT_SECRET` | `e2e.yml` - reusable workflow yang jalan dengan MySQL/Redis ephemeral di dalam CI runner sendiri, dipanggil tanpa environment scoping | String random apa saja, sifatnya throwaway - tidak perlu sama dengan `JWT_SECRET` prod asli |

## Secret level environment

Harus disiapkan **dua kali** - buat 2 GitHub Environment di repo Settings
-> Environments: `development` dan `production` (nama harus persis ini,
dipakai langsung oleh `deploy:` job di `enem-landing-dev.yml`/
`enem-landing-prod.yml`), lalu isi secret berikut di masing-masing dengan
nilai yang berbeda per environment.

| Secret | Untuk | Sumber nilai |
|---|---|---|
| `DATABASE_URL_ACCOUNT_API` | DB `enem-landing-account-api` (`enem_landing_account_dev`/`_prod`) | Connection string Aiven MySQL - lihat `scripts/provision-db.sh` |
| `DATABASE_URL_API` | DB `enem-landing-api` (`enem_landing_api_dev`/`_prod`) | Connection string Aiven MySQL (database ke-2) - lihat `scripts/provision-db.sh` |
| `REDIS_HOST` | Redis self-host di VPS | `redis_redis` (nama service stack `redis`) |
| `REDIS_PORT` | Redis self-host di VPS | `6379` |
| `REDIS_USERNAME` | Redis self-host di VPS | Kosong |
| `REDIS_PASSWORD` | Redis self-host di VPS | Password yang dipakai saat menjalankan `deploy-redis.yml`, sama untuk kedua environment |
| `REDIS_DB` | Redis self-host di VPS | `0` |
| `REDIS_TLS_ENABLED` | Redis self-host di VPS (lewat overlay network internal, tanpa TLS) | `false` |
| `REDIS_KEY_PREFIX` | Pemisah key karena dev/prod berbagi satu instance Redis | `development`: `dev`, `production`: tetap seperti sekarang |
| `JWT_SECRET` | Token signing sungguhan | String random kuat - bisa di-generate (`openssl rand -hex 32`) |
| `R2_ACCESS_KEY_ID` | Fitur uploads `enem-landing-account-api` | Cloudflare R2 |
| `R2_SECRET_ACCESS_KEY` | Fitur uploads | Cloudflare R2 |
| `R2_ENDPOINT` | Fitur uploads | Cloudflare R2 |
| `R2_BUCKET_NAME` | Fitur uploads | Cloudflare R2 |
| `R2_PUBLIC_URL_BASE` | Fitur uploads | Cloudflare R2 |
| `GHCR_PAT` | VPS `docker pull` image private dari GHCR (`GITHUB_TOKEN` otomatis cuma hidup di dalam Actions runner, tidak bisa dipakai VPS) | GitHub Personal Access Token (Settings -> Developer settings -> PATs), scope minimal `read:packages` |
| `DEPLOY_SSH_KEY` | Akses SSH Ansible untuk deploy | Sudah di-generate sesi ini di `~/.ssh/id_ed25519_enem_landing_deploy` - ambil isinya sendiri lewat `cat ~/.ssh/id_ed25519_enem_landing_deploy`, jangan minta AI print private key ke chat |

Catatan `R2_*`: cuma fallback (source of truth sungguhan ada di tabel
`system_settings`, dikelola lewat halaman settings CMS) - boleh diisi
placeholder dulu kalau fitur upload belum dipakai.

## Sudah diputuskan

- Aiven MySQL: **satu instance**, 4 database (2 app x 2 environment) -
  `enem_landing_account_dev`, `enem_landing_account_prod`,
  `enem_landing_api_dev`, `enem_landing_api_prod`. Di-provision oleh
  `scripts/provision-db.sh`.

- Redis: **satu instance self-host di VPS** dipakai bareng dev/prod,
  dipisah lewat `REDIS_KEY_PREFIX`. Sebelumnya Upstash free-tier, tapi
  kuota 500 ribu perintah per bulan habis pada 2026-11-18. Lihat bagian
  "Shared Redis" di `infra/ansible/README.md`.

## Langkah terpisah yang bukan GitHub secret

Public key dari `~/.ssh/id_ed25519_enem_landing_deploy.pub` perlu
ditambahkan ke `authorized_keys` di VPS begitu server-nya sudah
diprovisioning (`scripts/provision-server.sh`) - ini di luar GitHub
secrets, jangan lupa dilakukan juga.
