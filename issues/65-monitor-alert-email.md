# Story 65: Alert Monitor dan Notifikasi Email

**Status:** Draft (2026-11-23)

**Apps touched:** `enem-landing-monitor`, `enem-landing-monitor-api`,
`enem-landing-cms` (Settings: email alert monitor),
`enem-landing-account-api` (endpoint email internal), `enem-landing-log-reader`,
`compose.yml`, `infra/ansible` (`mysql-backup.sh`, `mysql-vars.yml`)

**Depends on:** Story 63 dan 64 (app monitor, monitor-api, log-reader),
email contact form ke admin (`POST /email/internal/contact-submission`)

**Dikerjakan sebelum:** Story 66, 67, 68, 69 (semuanya memakai mesin alert
ini untuk mengirim notifikasi)

## Background

Hasil brainstorm 2026-11-23 setelah Story 63 dan 64 selesai. Monitor sudah
bisa menampilkan crash, OOM, dan login gagal, tapi hanya kalau ada yang
membukanya. Insiden sebelumnya (CMS OOM 2026-11-07, outage Upstash
2026-11-18) baru ketahuan setelah situs error. Backup harian MySQL juga
belum punya notifikasi: `mysql_backup_notify_webhook_url` masih kosong, jadi
kegagalan backup hanya terlihat di `journalctl -u mysql-backup.service`.

Notifikasi dikirim ke **email admin dengan jalur yang sama seperti contact
form**: `enem-landing-api` memanggil `POST /email/internal/contact-submission`
di `enem-landing-account-api` (dijaga `InternalApiGuard` dengan
`INTERNAL_API_KEY`). Account-api lalu mengirim lewat SMTP yang diatur di
CMS Settings (`system_settings`) ke `ADMIN_NOTIFICATION_EMAIL`.

Diputuskan 2026-11-23: **pengiriman email diatur lewat CMS saja**. SMTP,
penerima, saklar email alert, dan tes kirim semuanya ada di halaman
Settings CMS, sama seperti email contact form. Monitor tidak menyimpan
alamat email, kredensial SMTP, atau pengaturan email apa pun; monitor hanya
mendeteksi kejadian dan meminta email dikirim.

## Goal

Kejadian penting di server memicu email ke `ADMIN_NOTIFICATION_EMAIL`
tanpa harus membuka monitor, tanpa spam email untuk kejadian yang sama, dan
riwayat alert bisa dilihat di monitor.

## Keputusan awal

1. **Email lewat jalur CMS, pengirimnya `enem-landing-account-api`**
   (sama seperti contact form):
   - endpoint baru `POST /email/internal/monitor-alert` dengan
     `InternalApiGuard`, pola sama seperti
     `POST /email/internal/contact-submission`;
   - penerima selalu `adminNotificationEmailsFromSettings(settings)`, jadi
     tidak ada parameter `to` dari pemanggil. Kalau belum diset, endpoint
     menjawab 409 dan alert tercatat sebagai "email gagal";
   - template baru `MonitorAlertTemplate` berbasis `base-email.template.ts`:
     judul, severity, environment (prod/dev), waktu, ringkasan, detail
     (maksimal sekitar 30 baris log, di-escape dengan `html-escape.ts`),
     dan tombol ke halaman terkait di `monitor.muzanella.com`;
   - `enem-landing-monitor-api` mendapat env `INTERNAL_API_KEY` (secret
     yang sudah ada) dan memanggil account-api lewat overlay network;
   - **CMS Settings** mendapat bagian "Email alert monitor": saklar
     `MONITOR_ALERT_EMAIL_ENABLED` (disimpan di `system_settings`, dicek
     oleh account-api sebelum mengirim, jadi email alert bisa dimatikan
     dari CMS tanpa redeploy), dan tombol **Kirim email alert tes** di
     sebelah "Send Test Email" yang sudah ada.
2. **Mesin alert di `enem-landing-monitor-api`**:
   - scheduler (`@enem-landing/backend-scheduler`) menjalankan pengecekan
     tiap 1 menit;
   - **hanya prod yang mengirim email** (`ALERTS_EMAIL_ENABLED=true` di
     prod, `false` di dev). Dev tetap mengevaluasi dan mencatat riwayat,
     supaya bisa dites tanpa membanjiri inbox. Karena log-reader dipakai
     bersama, kejadian host (OOM, disk, login gagal) cukup dilaporkan
     sekali oleh prod;
   - setiap aturan punya **cooldown** (default 30 menit) per kunci kejadian
     (misalnya `container-crash:enem-landing_enem-landing-api`), disimpan
     di Redis dengan prefix `monitor`, supaya crash-loop tidak mengirim
     puluhan email;
   - email **pemulihan** ("resolved") dikirim sekali saat kondisi kembali
     normal, untuk aturan yang punya status (misalnya MySQL tidak jalan,
     disk penuh).
3. **Aturan awal** (bisa diaktifkan, dinonaktifkan, dan diubah ambangnya):

   | Aturan                   | Sumber                                      | Default                       |
   | ------------------------ | ------------------------------------------- | ----------------------------- |
   | Container crash          | log-reader `/containers` (stopped, crashed) | aktif, semua stack            |
   | Container OOMKilled      | log-reader `/containers`                    | aktif                         |
   | Event OOM kernel baru    | `kern.log` (jumlah naik sejak cek terakhir) | aktif                         |
   | MySQL atau Redis mati    | container `mysql_mysql` / `redis_redis`     | aktif, setelah 2 cek berturut |
   | Redis tidak bisa di-ping | `RedisService.ping()`                       | aktif, setelah 2 cek berturut |
   | Lonjakan login gagal     | `btmp` per jam                              | aktif, ambang 2.000 per jam   |
   | Backup MySQL gagal       | webhook (keputusan 4)                       | aktif                         |

   Aturan dari story berikutnya (disk, memory container, uptime, TLS)
   ditambahkan ke tabel yang sama di story masing-masing.

4. **Webhook penerima alert** (sudah diputuskan di "Di luar scope" Story
   63):
   - endpoint publik di monitor: `POST https://monitor.muzanella.com/api/hooks/<id>`
     yang diteruskan BFF ke monitor-api `POST /hooks/:id`, satu-satunya
     route monitor-api selain `/health` yang tidak memakai SSO (ditandai
     `@Public()`, dan tes "hanya /health yang publik" diperbarui dengan
     daftar yang eksplisit);
   - setiap webhook punya `id` dan `key` sendiri (header
     `X-Webhook-Key`, dibandingkan constant-time), disimpan di env
     monitor-api (`ALERT_WEBHOOKS`, format `id:key`), bukan di URL;
   - body JSON `{"content": ..., "text": ...}` (format yang sudah dikirim
     `mysql-backup.sh`), maksimal 16 KB, rate limit tier `write`;
   - setiap request dicatat di audit log, lalu diubah menjadi alert
     "Backup MySQL gagal" dengan isi `text`;
   - middleware Traefik `cloudflare-only` tetap berlaku, jadi
     `mysql-backup.sh` di VPS memanggil lewat domain publik (melewati
     Cloudflare), bukan IP.
5. **Riwayat alert tanpa database**: Redis list per environment
   (`monitor:alerts`), maksimal 500 entri dan TTL 30 hari. Isi: waktu,
   aturan, kunci, severity, ringkasan, status email (terkirim, gagal,
   dilewati karena cooldown, dinonaktifkan di dev, email dimatikan di CMS).
6. **Pengaturan aturan** di Redis (`monitor:alert-rules`), dengan default
   di kode. Kalau Redis kosong, default yang dipakai.
7. **Monitor**:
   - menu baru **Alerts**: riwayat (filter aturan, severity, status
     email) dan halaman aturan (aktif/nonaktif, ambang, cooldown). Tidak
     ada pengaturan email di monitor; halaman ini menautkan ke CMS
     Settings untuk itu;
   - dashboard: card **Alerts** berisi jumlah alert 24 jam terakhir dan
     alert terakhir, dengan badge merah kalau ada alert yang belum pulih.

## Di luar scope

- Kanal lain selain email (Telegram, Slack, WhatsApp).
- Penerima berbeda per aturan. Semua ke `ADMIN_NOTIFICATION_EMAIL`.
- Eskalasi dan jadwal piket.
- Database untuk riwayat alert jangka panjang.

## Acceptance criteria

- [ ] `POST /email/internal/monitor-alert` di account-api hanya menerima
      `INTERNAL_API_KEY` yang benar, mengirim ke `ADMIN_NOTIFICATION_EMAIL`
      dari CMS Settings, dan punya tes unit (template ter-escape, tanpa
      parameter penerima).
- [ ] Container yang sengaja di-crash (`exit 1`) dan yang kena OOM di dev
      tercatat di riwayat alert dev; di prod mengirim satu email per
      kejadian.
- [ ] Crash-loop selama 30 menit hanya menghasilkan satu email per service
      (cooldown), dan riwayat mencatat sisanya sebagai "cooldown".
- [ ] MySQL atau Redis yang dimatikan memicu email setelah 2 cek, lalu
      email "resolved" saat kembali jalan.
- [ ] `mysql-backup.sh` yang gagal (misalnya password salah) mengirim
      webhook dan menghasilkan email; webhook dengan key salah ditolak 401
      dan tercatat di audit log.
- [ ] Menu Alerts menampilkan riwayat dan pengaturan aturan, tanpa
      pengaturan email.
- [ ] CMS Settings punya saklar email alert monitor dan tombol email alert
      tes; saat saklar mati, alert tetap tercatat di riwayat dengan status
      "email dimatikan di CMS".
- [ ] Dev tidak pernah mengirim email.
- [ ] Lint, format, test, build, dan e2e lulus lokal sebelum PR.

## Langkah manual setelah deploy

1. Pastikan SMTP dan `ADMIN_NOTIFICATION_EMAIL` di CMS Settings sudah
   terisi dan tombol "Send Test Email" di CMS berhasil.
2. Buat key webhook backup (`openssl rand -hex 32`), simpan sebagai secret
   `ALERT_WEBHOOKS` (`mysql-backup:<key>`) di environment `production`.
3. Isi `mysql_backup_notify_webhook_url` dan key-nya di
   `infra/ansible/mysql-vars.yml`, lalu jalankan ulang `deploy-mysql.yml`.
4. Nyalakan "Email alert monitor" dan kirim email alert tes dari CMS
   Settings, lalu crash satu container dev untuk melihat riwayatnya di
   menu Alerts.

## Referensi

- NestJS task scheduling: https://docs.nestjs.com/techniques/task-scheduling
- Redis `LPUSH`/`LTRIM` untuk list terbatas:
  https://redis.io/docs/latest/commands/ltrim/
- Nodemailer: https://nodemailer.com/message/
