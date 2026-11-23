# Story 61: Self-host MySQL Private di VPS (Pindah dari Aiven)

**Status:** Kode selesai, menunggu deploy dan migrasi data (2026-11-23)

**Apps touched:** `infra/ansible`, `infra/mysql`, `.github/workflows`,
`compose.yml`, `compose.prod.yml`, `compose.dev.yml`, `scripts`, `docs`

**Depends on:** Story 10 (infra/CI-CD), Story 58 (temuan port Docker
melewati UFW)

**Terkait:** hardening SSH VPS (story terpisah, masih akan di-brainstorm).
Story ini menjadikan SSH satu-satunya jalur akses ke DB dari luar, jadi
hardening SSH sangat disarankan, tapi tidak memblokir story ini.

## Background

Hasil brainstorm 2026-11-23.

Saat ini MySQL memakai Aiven (managed), sedangkan Redis sudah self-host di
VPS sejak 2026-11-18 setelah kuota Upstash habis dan API prod serta dev ikut
mati. Ketergantungan ke layanan managed dengan batas free tier punya risiko
serupa. Selain itu, menaruh DB di VPS yang sama membuat latency query lebih
rendah.

Kondisi VPS `enem-prod` saat dicek (2026-11-23):

| Resource  | Nilai                                                           |
| --------- | --------------------------------------------------------------- |
| RAM       | 3.6 GB total, sekitar 1.2 GB terpakai, sekitar 2.0 GB available |
| Swap      | 2 GB, hampir tidak terpakai                                     |
| CPU       | 2 vCPU, semua container idle                                    |
| Disk      | 59 GB, 46 GB free                                               |
| Container | 12 app (prod + dev) sekitar 750 MB, Redis 4 MB, Traefik 28 MB   |

MySQL 8 yang di-tune untuk VPS kecil butuh sekitar 400 sampai 500 MB RAM,
jadi masih muat dengan sisa sekitar 1.5 GB.

Database yang dipakai:

- `enem_landing_api` (`DATABASE_URL_API`)
- `enem_landing_account` (`DATABASE_URL_ACCOUNT_API`)

Masing-masing ada untuk prod dan dev (GitHub environment `production` dan
`development`).

### Kenapa private, bukan publik

Opsi membuka MySQL ke publik di port non-default sempat dipertimbangkan,
tapi ditolak:

- port non-default hanya mengurangi noise scanner, bukan pengaman;
- port yang di-publish Docker melewati UFW (Story 58), jadi firewall host
  tidak bisa diandalkan;
- VPS ini sudah menerima sekitar 11.000 percobaan login SSH gagal per hari
  (cek `btmp` dan `auth.log` 2026-11-23), dan port MySQL publik akan
  menjadi target brute force yang sama.

Pola yang dipakai sama dengan bastion di project lain (DB di jaringan
private, akses lewat `ssh -L`), tapi tanpa server bastion terpisah. App dan
DB ada di satu mesin, jadi VPS itu sendiri berperan sebagai bastion.

## Goal

Semua database prod dan dev berjalan di MySQL self-host di VPS tanpa port
publik, bisa diakses dari luar hanya lewat SSH tunnel, punya backup harian
di luar VPS yang sudah dites restore, dan Aiven bisa dimatikan tanpa
kehilangan data.

## Arsitektur

```
apps (prod/dev) --overlay--> mysql_mysql:3306

TablePlus / runner GitHub
  --SSH:22--> VPS 127.0.0.1:33300 (sidecar socat)
  --overlay mysql_admin--> mysql_mysql:3306
```

## Keputusan awal

1. **MySQL private, satu instance untuk prod dan dev**, dideploy sebagai
   stack `mysql` lewat playbook baru `deploy-mysql.yml`, dengan pola yang
   sama seperti `deploy-redis.yml`:
   - image `mysql:8.4` (LTS), versi di-pin;
   - **tidak mem-publish port apa pun**;
   - bergabung ke overlay network prod dan dev, app terhubung lewat
     `mysql_mysql:3306`;
   - data di `/opt/enem-landing/storage/mysql`, config di
     `/opt/enem-landing/mysql/`;
   - password dirender oleh Ansible dengan `no_log: true`.
2. **Sidecar `socat` untuk jalur tunnel**:
   - container biasa (`docker run`, bukan service Swarm) dengan
     `--restart unless-stopped`, publish `127.0.0.1:33300`, lalu meneruskan
     ke `mysql_mysql:3306`. `docker run` bisa bind ke `127.0.0.1`,
     sedangkan service Swarm tidak bisa;
   - bergabung hanya ke overlay khusus `mysql_admin` (`attachable: true`)
     yang juga diikuti service MySQL, bukan ke overlay app prod atau dev;
   - image `socat` di-pin versinya dan dikelola lewat `deploy-mysql.yml`;
   - karena bind ke loopback, port 33300 tidak bisa dijangkau dari luar
     VPS, dan masalah Docker melewati UFW tidak berlaku.
3. **Akses dari luar hanya lewat SSH tunnel**:
   - **TablePlus**: mode "Over SSH". Server SSH `enem-prod`
     (`43.133.149.209:22`), user `muzanella`, key
     `~/.ssh/id_ed25519_enem_prod`, lalu MySQL host `127.0.0.1` port
     `33300`;
   - **CLI**: script helper `scripts/db-tunnel.sh` yang membuka
     `ssh -L 33300:127.0.0.1:33300 enem-prod` di background, menampilkan
     status port, dan bisa menutup tunnel lagi;
   - **Runner GitHub (`migrate.yml`)**: tambah step yang membuka
     `ssh -L 33300:127.0.0.1:33300` ke VPS memakai `DEPLOY_SSH_KEY` yang
     sudah ada, lalu migrasi dan seed berjalan ke `127.0.0.1:33300`. Deploy
     tetap tidak jalan kalau migrasi gagal.
4. **Satu secret `DATABASE_URL_*`, host diganti di `migrate.yml`**
   (diputuskan 2026-11-23). App memakai `mysql_mysql:3306`, sedangkan
   migrasi lewat tunnel butuh `127.0.0.1:33300`:
   - `DATABASE_URL_API` dan `DATABASE_URL_ACCOUNT_API` tetap satu secret
     per environment, berisi host `mysql_mysql:3306` (dipakai app apa
     adanya);
   - `migrate.yml` mengganti `@mysql_mysql:3306` menjadi `@127.0.0.1:33300`
     di dalam step sebelum menjalankan migrasi dan seed. Hasilnya tidak
     di-echo ke log, dan nilai baru di-mask dengan `::add-mask::`;
   - kalau pola `@mysql_mysql:3306` tidak ditemukan di secret, step gagal
     dengan pesan jelas, supaya migrasi tidak diam-diam menembak host yang
     salah;
   - tidak ada secret tambahan seperti `DATABASE_URL_*_MIGRATE`.
5. **Opsional, least privilege untuk runner**: key SSH khusus tunnel
   (misalnya secret `DB_TUNNEL_SSH_KEY`) di `authorized_keys` dengan
   `permitopen="127.0.0.1:33300",no-pty,no-agent-forwarding,no-X11-forwarding,command="/bin/false"`.
   Key ini hanya bisa dipakai untuk forward ke MySQL dan tidak bisa membuka
   shell. Kalau tidak dikerjakan di story ini, runner memakai
   `DEPLOY_SSH_KEY` dan opsi ini dicatat untuk nanti.
6. **Isolasi prod dan dev lewat database dan user terpisah**:
   - prod: `enem_landing_api`, `enem_landing_account`, user `enem_prod`;
   - dev: `enem_landing_api_dev`, `enem_landing_account_dev`, user
     `enem_dev`;
   - setiap user hanya mendapat `GRANT` ke database miliknya, tanpa
     `SUPER`, `FILE`, atau `GRANT OPTION`;
   - `root` MySQL hanya bisa login dari `localhost` (lewat `docker exec`);
   - script `infra/mysql/init/01-init-databases.sh` diperluas atau dibuat
     versi baru untuk skema ini.
7. **Tuning untuk VPS 3.6 GB** (`my.cnf`):
   - `innodb_buffer_pool_size=256M`
   - `performance_schema=OFF`
   - `max_connections=60`
   - `innodb_redo_log_capacity=64M`
   - `local_infile=OFF`
   - `character-set-server=utf8mb4`, `collation-server=utf8mb4_unicode_ci`
   - limit memory container 640M, reservation 384M.
     Angka final disesuaikan setelah melihat ukuran data Aiven saat ini.
   - **Slow query log** untuk sub-menu DB di menu Logs monitor (Story 64):
     `slow_query_log=ON`, `long_query_time=1`, file
     `/var/log/mysql/slow.log` di dalam container yang di-bind mount ke
     `/opt/enem-landing/storage/mysql-logs` di host. Rotasi lewat logrotate
     host (mingguan, simpan 4, `copytruncate` atau `FLUSH SLOW LOGS`).
     Error log tetap ke stderr (bawaan image) sehingga terbaca lewat log
     container. General query log tidak diaktifkan.
8. **Backup harian terenkripsi ke luar VPS**:
   - `mysqldump --single-transaction --routines --triggers` per database,
     dikompres (gzip atau zstd) dan dienkripsi (age atau gpg) sebelum
     diupload;
   - tujuan: object storage di luar VPS (Cloudflare R2 atau Backblaze B2,
     dipilih saat implementasi);
   - retensi: 7 harian dan 4 mingguan;
   - dijalankan lewat cron atau systemd timer di host (dipasang oleh
     Ansible), bukan dari dalam aplikasi;
   - kalau backup gagal, harus ada notifikasi (minimal email atau webhook);
   - restore wajib dites sebelum Aiven dimatikan.
9. **Migrasi data dari Aiven** dengan downtime singkat:
   - freeze tulis: scale API ke 0, atau matikan sementara form contact dan
     tracking;
   - `mysqldump --single-transaction --set-gtid-purged=OFF` dari Aiven, lalu
     import lewat tunnel ke instance baru;
   - verifikasi jumlah baris per tabel di sumber dan tujuan;
   - ganti `DATABASE_URL_*` di kedua GitHub environment, lalu redeploy;
   - Aiven **jangan langsung dihapus**, simpan minimal 7 hari sebagai
     fallback;
   - dev dimigrasi lebih dulu sebagai latihan, baru prod.

## Di luar scope

- Hardening SSH (nonaktifkan login password dan root, fail2ban). Dibahas di
  story terpisah.
- Server bastion terpisah.
- Replikasi atau high availability. Single instance diterima untuk skala
  saat ini; VPS down berarti app dan DB mati bersamaan.
- Pindah dari MySQL ke engine lain.
- Retensi data tracking. Recording sudah dipangkas otomatis setelah 30
  hari (`tracking-recording.service.ts`). Ukuran tabel tracking lain cukup
  dipantau setelah migrasi.

## Acceptance criteria

- [x] Playbook `infra/ansible/playbooks/deploy-mysql.yml` idempoten: bisa
      dijalankan ulang untuk mengubah config atau merotasi password.
      (Diuji lokal per bagian: SQL user diterapkan dua kali, rotasi password
      membuat password lama ditolak, sidecar tidak dibuat ulang bila tidak
      berubah. Belum dijalankan utuh di VPS.)
- [x] MySQL berjalan sebagai stack `mysql` dengan limit memory, tidak
      mem-publish port, dan bisa dijangkau dari service prod dan dev lewat
      `mysql_mysql:3306`. (Diuji di Swarm docker-in-docker.)
- [ ] Dari luar VPS, port 3306 dan 33300 tertutup.
- [x] Sidecar `socat` hanya listen di `127.0.0.1:33300`, hidup lagi setelah
      VPS reboot, dan hanya terhubung ke overlay `mysql_admin`. (Diuji
      dengan restart daemon di docker-in-docker. Ditambah timer
      `mysql-tunnel-ensure` sebagai cadangan. Ditemukan juga bahwa MySQL
      dengan `restart_policy: on-failure` tidak hidup lagi setelah restart
      daemon karena exit 0, jadi stack memakai `condition: any`.)
- [ ] TablePlus bisa terhubung lewat mode "Over SSH" ke database prod dan
      dev.
- [x] `scripts/db-tunnel.sh` bisa membuka, mengecek, dan menutup tunnel.
      (Diuji ke container sshd lokal, termasuk bash 3.2 bawaan macOS.)
- [ ] Migrasi dan seed di workflow prod dan dev berjalan lewat SSH tunnel,
      dan deploy tetap tidak jalan kalau migrasi gagal.
- [ ] `migrate.yml` memakai `DATABASE_URL_*` yang sama dengan app, mengganti
      host ke `127.0.0.1:33300`, gagal dengan jelas bila pola host tidak
      cocok, dan tidak membocorkan connection string ke log.
- [x] Slow query log aktif, tertulis di
      `/opt/enem-landing/storage/mysql-logs`, dan dirotasi.
- [x] User dev tidak bisa membaca atau menulis database prod, dan `root`
      tidak bisa login selain dari `localhost` (dites dengan query
      langsung, lokal. Ulangi di VPS setelah deploy).
- [ ] Backup harian otomatis terupload ke storage di luar VPS, terenkripsi,
      dengan retensi sesuai keputusan di atas.
- [ ] Restore dari backup sudah dites ke database sementara dan datanya
      cocok.
- [ ] Notifikasi muncul ketika backup gagal (dites dengan memaksa gagal).
- [ ] Data dev dan prod sudah pindah dari Aiven, jumlah baris per tabel
      cocok.
- [ ] `DATABASE_URL_*` di kedua GitHub environment sudah mengarah ke
      instance baru, dan Aiven tidak lagi dipakai.
- [x] `infra/ansible/README.md`, `docs/github-actions-secrets.md`, dan
      komentar di `compose.yml` serta `migrate.yml` yang menyebut Aiven
      sudah diperbarui, termasuk cara akses lewat TablePlus.
- [ ] Lint, format, test, build, dan e2e lulus lokal sebelum PR.

Catatan implementasi:

- Backup: Cloudflare R2 (bucket private terpisah dari bucket uploads),
  dienkripsi dengan `age`, notifikasi gagal lewat webhook (format
  Discord/Slack). Alur backup, restore ke database sementara, dan
  notifikasi gagal sudah diuji lokal dengan server S3 tiruan; masih perlu
  diulang dengan R2 asli.
- Keputusan #5 (key SSH khusus tunnel dengan `permitopen`) belum
  dikerjakan. Runner memakai `DEPLOY_SSH_KEY`.
- `scripts/provision-db.sh` (khusus Aiven) dihapus. Database dan user di
  VPS dibuat oleh `deploy-mysql.yml` (`mysql-users.sql.j2`).
- Root password dibuat di VPS saat run pertama dan tidak pernah keluar
  dari VPS, jadi tidak ada secret root di GitHub.

## Langkah manual setelah deploy

1. Jalankan `deploy-mysql.yml` di VPS (butuh `-e ansible_user=deploy` dan
   key deploy, sama seperti Redis).
2. Dari luar VPS, pastikan port 3306 dan 33300 tertutup.
3. Buka tunnel dan coba connect dari TablePlus ke database dev.
4. Migrasi data dev dari Aiven, update secret `development`, lalu redeploy
   dev. Cek CMS dev, blog, dan tools.
5. Ulangi untuk prod di jam sepi, lalu cek `muzanella.com`, `/blog`,
   `tools.muzanella.com`, login CMS, form contact, dan tracking.
6. Jalankan backup manual sekali, lalu tes restore ke database sementara.
7. Cek `free -h` dan `docker stats` beberapa hari setelahnya untuk
   memastikan RAM aman.
8. Setelah 7 hari tanpa masalah, matikan service Aiven.

## Referensi

- MySQL 8.4, InnoDB buffer pool:
  https://dev.mysql.com/doc/refman/8.4/en/innodb-buffer-pool-resize.html
- MySQL 8.4, `mysqldump`:
  https://dev.mysql.com/doc/refman/8.4/en/mysqldump.html
- Docker, overlay network (`attachable`):
  https://docs.docker.com/engine/network/drivers/overlay/
- Docker dan UFW (port publish melewati firewall):
  https://docs.docker.com/engine/network/packet-filtering-firewalls/
- OpenSSH, opsi `authorized_keys` (`permitopen`, `no-pty`):
  https://man.openbsd.org/sshd.8#AUTHORIZED_KEYS_FILE_FORMAT
- TablePlus, koneksi lewat SSH:
  https://docs.tableplus.com/gui-tools/manage-connections
