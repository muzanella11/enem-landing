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
| `DATABASE_URL_ACCOUNT_API` | DB `enem-landing-account-api` | MySQL self-host di VPS. `production`: `mysql://enem_prod:<pw>@mysql_mysql:3306/enem_landing_account`, `development`: `mysql://enem_dev:<pw>@mysql_mysql:3306/enem_landing_account_dev`. Password sama dengan `mysql_prod_password`/`mysql_dev_password` saat menjalankan `deploy-mysql.yml`. Host wajib `@mysql_mysql:3306/`, karena `migrate.yml` mengganti host itu ke SSH tunnel dan gagal kalau polanya tidak ada |
| `DATABASE_URL_API` | DB `enem-landing-api` | Sama seperti di atas, database `enem_landing_api` (prod) atau `enem_landing_api_dev` (dev) |
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
| `LOG_READER_TOKEN` | `enem-landing-monitor-api` membaca log lewat `enem-landing-log-reader` | String random minimal 32 karakter (`openssl rand -hex 32`), **beda** untuk `production` dan `development`. Nilai yang sama dipakai sebagai `log_reader_token_prod`/`log_reader_token_dev` saat menjalankan `deploy-log-reader.yml`. Kosong = menu Server/DB/Redis/Apps di monitor nonaktif |
| `ALERT_WEBHOOKS` | Webhook alert monitor (`POST https://monitor.muzanella.com/api/hooks/<id>`), dipakai `mysql-backup.sh` saat backup gagal | Format `id:key`, dipisah koma. Untuk backup: `mysql-backup:<openssl rand -hex 32>` di `production`. Key yang sama diisi sebagai `mysql_backup_notify_webhook_key` di `mysql-vars.yml`. Kosong = webhook nonaktif |
| `DATABASE_URL_MONITOR` | Statistik MySQL di menu DB monitor (koneksi, `SHOW PROCESSLIST`) | `mysql://enem_monitor:<mysql_monitor_password>@mysql_mysql:3306`, sama di kedua environment. User dibuat `deploy-mysql.yml`, hanya punya hak `PROCESS` (tidak bisa `SELECT` tabel app). Kosong = statistik MySQL nonaktif |
| `GHCR_PAT` | VPS `docker pull` image private dari GHCR (`GITHUB_TOKEN` otomatis cuma hidup di dalam Actions runner, tidak bisa dipakai VPS) | GitHub Personal Access Token (Settings -> Developer settings -> PATs), scope minimal `read:packages` |
| `DEPLOY_SSH_KEY` | Akses SSH Ansible untuk deploy, dan SSH tunnel ke MySQL di `migrate.yml` | Sudah di-generate sesi ini di `~/.ssh/id_ed25519_enem_landing_deploy` - ambil isinya sendiri lewat `cat ~/.ssh/id_ed25519_enem_landing_deploy`, jangan minta AI print private key ke chat |

Catatan `R2_*`: cuma fallback (source of truth sungguhan ada di tabel
`system_settings`, dikelola lewat halaman settings CMS) - boleh diisi
placeholder dulu kalau fitur upload belum dipakai.

## Sudah diputuskan

- MySQL: **satu instance self-host di VPS** (stack `mysql`), dipakai
  bareng dev/prod, dipisah per database dan user: `enem_prod` hanya punya
  akses ke `enem_landing_api` dan `enem_landing_account`, `enem_dev` hanya
  ke `enem_landing_api_dev` dan `enem_landing_account_dev`. Tidak ada port
  publik; akses dari luar hanya lewat SSH tunnel. Sebelumnya Aiven. Lihat
  bagian "Shared MySQL" di `infra/ansible/README.md`.

- Redis: **satu instance self-host di VPS** dipakai bareng dev/prod,
  dipisah lewat `REDIS_KEY_PREFIX`. Sebelumnya Upstash free-tier, tapi
  kuota 500 ribu perintah per bulan habis pada 2026-11-18. Lihat bagian
  "Shared Redis" di `infra/ansible/README.md`.

- Monitor (`monitor.muzanella.com`, `dev-monitor.muzanella.com`): app
  terpisah dari CMS, hanya `SUPER_ADMIN`. Backend `enem-landing-monitor-api`
  internal-only dan tidak punya database. Log host dibaca oleh satu stack
  `log-reader` bersama prod dan dev; tiap environment punya
  `LOG_READER_TOKEN` sendiri. Lihat bagian "Monitor" di
  `infra/ansible/README.md`.

- Alert monitor dikirim lewat email admin dengan jalur yang sama seperti
  contact form: monitor-api memanggil `POST /email/internal/monitor-alert`
  di account-api dengan `INTERNAL_API_KEY` yang sudah ada. SMTP, penerima,
  dan saklar "Email alert monitor" diatur di CMS Settings. Hanya prod yang
  mengirim email. Tidak ada secret email baru.

## Langkah terpisah yang bukan GitHub secret

Public key dari `~/.ssh/id_ed25519_enem_landing_deploy.pub` perlu
ditambahkan ke `authorized_keys` di VPS begitu server-nya sudah
diprovisioning (`scripts/provision-server.sh`) - ini di luar GitHub
secrets, jangan lupa dilakukan juga.
