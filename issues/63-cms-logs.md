# Story 63: Menu Logs di CMS (Server, DB, Redis, Apps)

**Status:** Draft (2026-11-23)

**Apps touched:** `enem-landing-cms`, `enem-landing-api`, app baru
`enem-landing-log-reader`, `infra/ansible`, `.github/workflows`,
`compose.yml`, `compose.prod.yml`, `compose.dev.yml`

**Depends on:** Story 62 (kebersihan log server), Story 10 (infra/CI-CD)

**Terkait:** Story 61 (self-host MySQL). Sub-menu **DB** baru berisi data
setelah MySQL pindah ke VPS. Sebelum itu, sub-menu DB menampilkan pesan
bahwa MySQL masih di Aiven.

## Background

Hasil brainstorm log server 2026-11-23.

Saat ini satu-satunya cara melihat log adalah SSH ke VPS lalu memakai
`docker service logs`, `journalctl`, atau membaca `/var/log`. Sebagian besar
file di `/var/log` hanya bisa dibaca `root` atau grup `adm`, jadi butuh
`sudo`. Akibatnya, saat insiden (misalnya API crash-loop saat outage Upstash
2026-11-18, atau CMS OOM 2026-11-07), mencari penyebabnya lambat.

### Log host (sub-menu Server)

Dicek di VPS 2026-11-23, dikelompokkan berdasarkan kegunaannya.

**Keamanan dan akses**

| Log          | Lokasi               | Format             | Isi                                                |
| ------------ | -------------------- | ------------------ | -------------------------------------------------- |
| Auth         | `/var/log/auth.log*` | teks, rotasi `.gz` | login SSH sukses dan gagal, `sudo`, perubahan user |
| Login gagal  | `/var/log/btmp*`     | biner `utmp`       | setiap percobaan login gagal (setara `lastb`)      |
| Login sukses | `/var/log/wtmp`      | biner `utmp`       | login sukses, logout, reboot (setara `last`)       |
| Last login   | `/var/log/lastlog`   | biner `lastlog`    | waktu login terakhir per user (setara `lastlog`)   |
| Faillog      | `/var/log/faillog`   | biner `faillog`    | hitungan login gagal per user                      |
| Firewall     | `/var/log/ufw.log*`  | teks, rotasi `.gz` | koneksi yang diblokir UFW                          |

**Sistem**

| Log     | Lokasi               | Format             | Isi                                                     |
| ------- | -------------------- | ------------------ | ------------------------------------------------------- |
| Journal | `/var/log/journal/`  | biner journald     | semua service systemd (sshd, dockerd, containerd, cron) |
| Syslog  | `/var/log/syslog*`   | teks, rotasi `.gz` | log umum sistem                                         |
| Kernel  | `/var/log/kern.log*` | teks, rotasi `.gz` | pesan kernel, termasuk OOM killer                       |
| Dmesg   | `/var/log/dmesg`     | teks               | pesan kernel saat boot                                  |

**Paket dan update**

| Log                 | Lokasi                                   | Format             |
| ------------------- | ---------------------------------------- | ------------------ |
| Riwayat apt         | `/var/log/apt/history.log*`, `term.log*` | teks, rotasi `.gz` |
| dpkg                | `/var/log/dpkg.log*`                     | teks, rotasi `.gz` |
| Unattended upgrades | `/var/log/unattended-upgrades/*.log*`    | teks, rotasi `.gz` |
| Alternatives        | `/var/log/alternatives.log*`             | teks               |

**Setup awal dan provider**

| Log            | Lokasi                                             | Format             |
| -------------- | -------------------------------------------------- | ------------------ |
| cloud-init     | `/var/log/cloud-init.log`, `cloud-init-output.log` | teks               |
| Installer      | `/var/log/installer/*`                             | teks               |
| Tencent Cloud  | `/var/log/qcloud_action.log`                       | teks               |
| Landscape      | `/var/log/landscape/sysinfo.log`                   | teks               |
| Ubuntu Pro     | `/var/log/ubuntu-advantage*.log*`                  | teks               |
| Apport (crash) | `/var/log/apport.log*`                             | teks, rotasi `.gz` |

### Log container (sub-menu DB, Redis, Apps, dan infra di Server)

Semua container memakai driver `json-file`, jadi log stdout dan stderr-nya
ada di `/var/lib/docker/containers/<id>/<id>-json.log*` (JSON per baris,
dirotasi sesuai Story 62). Metadata container (nama service, stack, status
jalan, waktu start) ada di `config.v2.json` pada folder yang sama.

Service yang jalan saat ini:

| Stack               | Service                                                                             | Sub-menu       |
| ------------------- | ----------------------------------------------------------------------------------- | -------------- |
| `enem-landing`      | `enem-landing-web`, `-tools`, `-cms`, `-api`, `-account-web`, `-account-api` (prod) | Apps           |
| `enem-landing-dev`  | service yang sama untuk dev                                                         | Apps           |
| `redis`             | `redis_redis`                                                                       | Redis          |
| `mysql` (Story 61)  | `mysql_mysql`                                                                       | DB             |
| `traefik`           | `traefik_traefik`                                                                   | Server (infra) |
| `log-reader` (baru) | `enem-landing-log-reader`                                                           | Server (infra) |

## Goal

SuperAdmin bisa membaca log dari CMS di satu menu **Logs** dengan sub-menu
**Server**, **DB**, **Redis**, dan **Apps**. Untuk container, yang
ditampilkan adalah log dari masing-masing container yang sedang aktif.
Semua log dibaca langsung dari file di VPS (read-only), tanpa SSH dan tanpa
layanan log pihak ketiga.

## Arsitektur

```
CMS page (/logs/server, /logs/db, /logs/redis, /logs/apps)
  -> BFF CMS (server/api/logs/...)
  -> enem-landing-api (modul logs, SsoAuthGuard + SuperAdmin)
  -> enem-landing-log-reader (internal, overlay, token)
  -> file host read-only:
       /var/log                          -> /host/var/log:ro
       /var/lib/docker/containers        -> /host/docker/containers:ro
       /opt/enem-landing/storage/mysql-logs -> /host/mysql-logs:ro (Story 61)
```

## Keputusan awal

1. **Service pembaca terpisah: `enem-landing-log-reader`** (app Nx baru,
   Node tanpa framework berat), bukan di dalam `enem-landing-api`.
   - Membaca file host butuh hak baca file milik `root` dan grup `adm`.
     Hak ini tidak boleh diberikan ke `enem-landing-api` yang menerima
     traffic publik.
   - Service ini tidak mem-publish port, hanya bergabung ke overlay network,
     dan hanya menerima request dari `enem-landing-api` yang membawa header
     token rahasia (`LOG_READER_TOKEN`).
   - Container dibuat seketat mungkin: semua mount `:ro`, `read_only: true`
     pada root filesystem, `cap_drop: ALL` lalu hanya
     `cap_add: DAC_READ_SEARCH` (didukung Swarm, Docker di VPS versi
     29.9.2), tanpa akses ke Docker socket, limit memory kecil (misalnya
     96M).
2. **Hanya `SuperAdmin`** yang bisa membuka menu Logs, bukan semua `Admin`.
   Log berisi IP, username, query, dan detail sistem.
   - Guard di `enem-landing-api` (helper baru, misalnya
     `assertSuperAdminRole`) dan menu CMS disembunyikan untuk role lain.
3. **Allowlist sumber log, bukan path bebas.**
   - API dan log-reader hanya menerima **id sumber** (misalnya `auth`,
     `btmp`, `mysql-slow`) atau **id container** yang ada di daftar
     container aktif. Path dipetakan di sisi log-reader. Tidak ada
     parameter path dari client, untuk mencegah path traversal.
   - Id container divalidasi sebagai hex 64 karakter dan harus ada di
     daftar container hasil pemindaian, bukan dipakai langsung sebagai
     path.
   - File rotasi (`.1`, `.2.gz`) dipilih lewat parameter `rotation` dengan
     angka yang divalidasi.
4. **Penemuan container aktif tanpa Docker socket.**
   - Log-reader memindai `/host/docker/containers/*/config.v2.json` dan
     mengambil: id, nama container, `State.Running`, `State.StartedAt`,
     `RestartCount`, label `com.docker.stack.namespace`, dan
     `com.docker.swarm.service.name`.
   - **Hanya container dengan `State.Running = true`** yang ditampilkan.
   - Container dikelompokkan ke sub-menu berdasarkan stack (tabel di
     Background). Stack yang tidak dikenal masuk ke Server bagian infra,
     supaya tidak ada container yang tersembunyi.
   - Kalau satu service punya lebih dari satu replika, setiap container
     tampil sendiri dengan nama task-nya.
   - Hasil pemindaian di-cache singkat (misalnya 10 detik) supaya tidak
     membaca ulang semua `config.v2.json` di setiap request.
5. **Isi tiap sub-menu**:
   - **Server**: tab Ringkasan, Keamanan dan Akses, Sistem, Paket dan
     Update, Setup dan Provider, serta **Infra** (log container Traefik,
     log-reader, dan stack lain yang tidak dikenal). Ringkasan berisi
     daftar semua sumber log beserta ukuran dan waktu ubah terakhir, plus
     angka singkat (login gagal 24 jam terakhir, jumlah event OOM di
     `kern.log`).
   - **DB**:
     - log container `mysql_mysql` (error log MySQL dikirim ke stderr
       oleh image resmi: startup, shutdown, crash, koneksi yang gagal
       autentikasi);
     - **slow query log**: Story 61 perlu mengaktifkan
       `slow_query_log=ON`, `long_query_time=1`, dan
       `slow_query_log_file` di folder yang di-bind mount ke
       `/opt/enem-landing/storage/mysql-logs`, serta rotasinya (logrotate
       host dengan `copytruncate`, atau `FLUSH SLOW LOGS`). Log-reader
       membaca folder itu read-only;
     - general query log **tidak** diaktifkan karena berat dan berisi
       semua query termasuk data sensitif.
   - **Redis**:
     - log container `redis_redis` (Redis menulis ke stdout karena
       `logfile ""`): startup, persistence AOF, peringatan memory,
       koneksi;
     - **opsional**: `SLOWLOG GET` lewat `RedisService` yang sudah ada di
       `enem-landing-api`. Ini bukan file, karena Redis menyimpan
       slowlog di memory. Kalau dikerjakan, tampil di tab terpisah dan
       read-only.
   - **Apps**: dua grup, **Prod** dan **Dev**, masing-masing berisi
     container aktif dari keenam service. Setiap container menampilkan
     waktu start, jumlah restart, dan tanda bila baru start kurang dari 5
     menit (indikasi crash-loop atau deploy baru).
6. **Cara membaca per format**:
   - **Teks**: dibaca dari **akhir file** per potongan (tail), bukan
     memuat seluruh file. Pagination mundur memakai offset byte.
   - **`.gz`**: didekompresi secara streaming dengan batas ukuran hasil
     (misalnya 50 MB); kalau lebih, tampilkan pesan dan minta pakai filter.
   - **`btmp`, `wtmp`**: parse struct `utmp` (384 byte per record di
     x86_64) menjadi tabel waktu, user, IP, dan tipe. Dibaca dari akhir
     file.
   - **`lastlog`, `faillog`**: parse struct masing-masing, tampilkan hanya
     user yang punya data.
   - **Journal**: format biner journald tidak di-parse manual. Image
     log-reader menyertakan `journalctl`, lalu membaca file yang di-mount
     dengan `journalctl --directory=/host/var/log/journal --output=json`.
     Ini tetap membaca langsung dari file, tanpa akses ke systemd host.
     Filter: unit, prioritas, rentang waktu.
   - **Container (`json-file`)**: setiap baris di-parse menjadi waktu,
     stream (`stdout` atau `stderr`), dan pesan. Filter stream tersedia,
     dan baris `stderr` diberi warna berbeda. Kalau pesan app berupa JSON,
     tampilkan rapi dengan opsi expand.
   - **Slow query log MySQL**: teks multi-baris, dikelompokkan per entri
     (waktu, durasi, rows examined, query).
   - **`.xz`** (misalnya `apt/eipp.log.xz`): di luar scope, cukup
     ditampilkan sebagai "format tidak didukung".
7. **Batas per request**: maksimal sekitar 1.000 baris atau 1 MB per
   response, timeout baca, dan rate limit memakai mekanisme rate limit
   global yang sudah ada.
8. **Menu Logs di CMS** (sidebar `layouts/dashboard.vue`, icon misalnya
   `mdi-text-box-search-outline`) dengan sub-menu **Server**, **DB**,
   **Redis**, dan **Apps** (`/logs/server`, `/logs/db`, `/logs/redis`,
   `/logs/apps`).
9. **Fitur viewer** (komponen bersama untuk semua log teks dan container):
   - pilih file rotasi;
   - jumlah baris (100, 500, 1.000) dan tombol "muat lebih lama";
   - pencarian teks sederhana (case-insensitive) yang dijalankan di
     log-reader, bukan di browser;
   - auto refresh opsional (misalnya tiap 10 detik) untuk file aktif;
   - font monospace, wrap bisa dimatikan, highlight kata seperti `error`,
     `failed`, `oom`, `killed`;
   - tombol unduh potongan yang sedang tampil.
     Log biner (`btmp`, `wtmp`, `lastlog`, `faillog`) dan journal tampil
     sebagai tabel dengan filter.
10. **Satu log-reader untuk prod dan dev**. Log host, DB, dan Redis memang
    sama untuk kedua environment karena berjalan di VPS yang sama.
    Log-reader dideploy sebagai stack sendiri (seperti Redis) yang
    bergabung ke overlay prod dan dev, dan masing-masing environment punya
    `LOG_READER_TOKEN` sendiri. Fitur bisa dimatikan per environment lewat
    `LOGS_ENABLED`.
11. **Audit akses**: setiap request baca log dicatat di log
    `enem-landing-api` (user, sumber log atau container, waktu), supaya
    akses ke data sensitif bisa ditelusuri.

## Di luar scope

- Menulis, menghapus, atau merotasi log dari CMS. Semua akses read-only.
- Log container yang sudah berhenti (riwayat task Swarm). Hanya container
  aktif yang ditampilkan.
- Log MySQL di Aiven (sebelum Story 61 selesai).
- General query log MySQL.
- Streaming realtime (WebSocket atau SSE). Cukup auto refresh berkala.
- Log terpusat, retensi jangka panjang, dan alerting.
- Traefik access log (belum aktif).
- Menampilkan log dari VPS lain.

## Acceptance criteria

- [ ] App `enem-landing-log-reader` jalan sebagai service tanpa port
      publik, root filesystem read-only, semua mount host `:ro`, tanpa
      Docker socket, dan hanya punya capability `DAC_READ_SEARCH`.
- [ ] Log-reader menolak request tanpa `LOG_READER_TOKEN` yang benar.
- [ ] Hanya id sumber dari allowlist dan id container aktif yang diterima;
      percobaan path traversal (`../`, path absolut, id tidak dikenal, id
      container yang tidak aktif) ditolak dan ada tes unitnya.
- [ ] Endpoint di `enem-landing-api` hanya bisa diakses `SuperAdmin`;
      `Admin` biasa mendapat 403, dan menu Logs tidak tampil untuknya.
- [ ] Menu Logs tampil di sidebar CMS dengan sub-menu Server, DB, Redis,
      dan Apps.
- [ ] **Server**: semua log host di tabel Background bisa dibaca, termasuk
      file rotasi `.1` dan `.gz`; tab Infra menampilkan log container
      Traefik dan log-reader.
- [ ] `btmp`, `wtmp`, `lastlog`, dan `faillog` tampil sebagai tabel yang
      isinya cocok dengan `lastb`, `last`, `lastlog`, dan `faillog` di VPS.
- [ ] Journal bisa difilter berdasarkan unit, prioritas, dan waktu.
- [ ] **Apps**: menampilkan semua container aktif prod dan dev (12 saat
      ini), dikelompokkan per environment, lengkap dengan waktu start dan
      jumlah restart. Container yang sudah berhenti tidak tampil.
- [ ] **Redis**: log container `redis_redis` bisa dibaca.
- [ ] **DB**: log container `mysql_mysql` dan slow query log bisa dibaca
      setelah Story 61 selesai; sebelum itu tampil pesan bahwa MySQL masih
      di Aiven.
- [ ] Log container bisa difilter berdasarkan `stdout` dan `stderr`.
- [ ] File besar (misalnya `auth.log.1` 30 MB, `btmp` 100 MB) dibuka tanpa
      memuat seluruh file ke memory, dan memory log-reader tetap di bawah
      limit.
- [ ] Pencarian teks, pilihan jumlah baris, "muat lebih lama", auto
      refresh, dan unduh berjalan.
- [ ] Setiap akses baca log tercatat di log `enem-landing-api`.
- [ ] Deploy log-reader lewat Ansible dan workflow CI (build dan push
      image) terdokumentasi di `infra/ansible/README.md` dan
      `docs/github-actions-secrets.md`.
- [ ] Lint, format, test, build, dan e2e lulus lokal sebelum PR.

## Langkah manual setelah deploy

1. Buat `LOG_READER_TOKEN` acak (minimal 32 karakter) untuk prod dan dev,
   simpan di GitHub environment masing-masing.
2. Deploy stack log-reader, lalu redeploy API prod dan dev.
3. Login CMS sebagai `SuperAdmin`, buka setiap sub-menu Logs, dan cocokkan
   beberapa baris dengan isi file di VPS serta `docker service logs`.
4. Pastikan jumlah container di Apps sama dengan `docker ps` untuk stack
   `enem-landing` dan `enem-landing-dev`.
5. Login sebagai `Admin` biasa dan pastikan menu Logs tidak tampil serta
   endpoint-nya 403.
6. Buka `btmp` (sekitar 100 MB) dan pantau `docker stats` log-reader.

## Referensi

- Linux `utmp`/`wtmp`/`btmp` struct:
  https://man7.org/linux/man-pages/man5/utmp.5.html
- `lastlog`: https://man7.org/linux/man-pages/man8/lastlog.8.html
- `journalctl --directory` dan `--output=json`:
  https://www.freedesktop.org/software/systemd/man/latest/journalctl.html
- Docker JSON file logging driver:
  https://docs.docker.com/engine/logging/drivers/json-file/
- Linux capabilities (`CAP_DAC_READ_SEARCH`):
  https://man7.org/linux/man-pages/man7/capabilities.7.html
- Docker Swarm, `cap_add` dan `cap_drop` di service:
  https://docs.docker.com/reference/cli/docker/service/create/
- MySQL 8.4, slow query log:
  https://dev.mysql.com/doc/refman/8.4/en/slow-query-log.html
- Redis `SLOWLOG`: https://redis.io/docs/latest/commands/slowlog-get/
