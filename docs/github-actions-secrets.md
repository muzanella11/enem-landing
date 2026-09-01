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
| `DATABASE_URL_ACCOUNT_API` | DB `enem-landing-account-api` | Connection string Aiven MySQL |
| `DATABASE_URL_API` | DB `enem-landing-api` | Connection string Aiven MySQL (database ke-2) |
| `REDIS_HOST` | Upstash Redis | Dashboard Upstash |
| `REDIS_PORT` | Upstash Redis | Dashboard Upstash |
| `REDIS_USERNAME` | Upstash Redis | Dashboard Upstash |
| `REDIS_PASSWORD` | Upstash Redis | Dashboard Upstash |
| `REDIS_DB` | Upstash Redis | Dashboard Upstash |
| `REDIS_TLS_ENABLED` | Upstash Redis (wajib `true` untuk Upstash) | Dashboard Upstash |
| `REDIS_KEY_PREFIX` | Pemisah key kalau dev/prod berbagi satu instance Upstash free-tier | Ditentukan sendiri, mis. `dev:`/`prod:` |
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

## Yang belum diputuskan

- Aiven MySQL: satu instance dengan 2 database per environment (4 database
  total: `enem_landing_account`/`enem_landing_api` x dev/prod), atau 2
  instance terpisah - `scripts/provision-db.sh` (story 09) bisa handle
  kedua pola.
- Upstash Redis: satu instance free-tier dipakai bareng dev/prod (via
  `REDIS_KEY_PREFIX` yang beda), atau 2 instance terpisah.

## Langkah terpisah yang bukan GitHub secret

Public key dari `~/.ssh/id_ed25519_enem_landing_deploy.pub` perlu
ditambahkan ke `authorized_keys` di VPS begitu server-nya sudah
diprovisioning (`scripts/provision-server.sh`) - ini di luar GitHub
secrets, jangan lupa dilakukan juga.
