# Story 63: Menu Server di CMS untuk Membaca Log VPS

**Status:** Draft (2026-11-23)

**Apps touched:** `enem-landing-cms`, `enem-landing-api`, app baru
`enem-landing-log-reader`, `infra/ansible`, `.github/workflows`,
`compose.yml`, `compose.prod.yml`, `compose.dev.yml`

**Depends on:** Story 62 (kebersihan log server), Story 10 (infra/CI-CD)

## Background

Hasil brainstorm log server 2026-11-23.

Saat ini satu-satunya cara melihat log adalah SSH ke VPS lalu memakai
`docker service logs`, `journalctl`, atau membaca `/var/log`. Sebagian besar
file di `/var/log` hanya bisa dibaca `root` atau grup `adm`, jadi butuh
`sudo`. Akibatnya, saat insiden (misalnya API crash-loop saat outage Upstash
2026-11-18, atau CMS OOM 2026-11-07), mencari penyebabnya lambat.

Log yang ada di VPS (dicek 2026-11-23), dikelompokkan berdasarkan
kegunaannya:

### Keamanan dan akses

| Log          | Lokasi               | Format             | Isi                                                |
| ------------ | -------------------- | ------------------ | -------------------------------------------------- |
| Auth         | `/var/log/auth.log*` | teks, rotasi `.gz` | login SSH sukses dan gagal, `sudo`, perubahan user |
| Login gagal  | `/var/log/btmp*`     | biner `utmp`       | setiap percobaan login gagal (setara `lastb`)      |
| Login sukses | `/var/log/wtmp`      | biner `utmp`       | login sukses, logout, reboot (setara `last`)       |
| Last login   | `/var/log/lastlog`   | biner `lastlog`    | waktu login terakhir per user (setara `lastlog`)   |
| Faillog      | `/var/log/faillog`   | biner `faillog`    | hitungan login gagal per user                      |
| Firewall     | `/var/log/ufw.log*`  | teks, rotasi `.gz` | koneksi yang diblokir UFW                          |

### Sistem

| Log     | Lokasi               | Format             | Isi                                                     |
| ------- | -------------------- | ------------------ | ------------------------------------------------------- |
| Journal | `/var/log/journal/`  | biner journald     | semua service systemd (sshd, dockerd, containerd, cron) |
| Syslog  | `/var/log/syslog*`   | teks, rotasi `.gz` | log umum sistem                                         |
| Kernel  | `/var/log/kern.log*` | teks, rotasi `.gz` | pesan kernel, termasuk OOM killer                       |
| Dmesg   | `/var/log/dmesg`     | teks               | pesan kernel saat boot                                  |

### Container

| Log           | Lokasi                                           | Format                              | Isi                                   |
| ------------- | ------------------------------------------------ | ----------------------------------- | ------------------------------------- |
| Container app | `/var/lib/docker/containers/<id>/<id>-json.log*` | JSON per baris (driver `json-file`) | stdout dan stderr semua service Swarm |

### Paket dan update

| Log                 | Lokasi                                   | Format             |
| ------------------- | ---------------------------------------- | ------------------ |
| Riwayat apt         | `/var/log/apt/history.log*`, `term.log*` | teks, rotasi `.gz` |
| dpkg                | `/var/log/dpkg.log*`                     | teks, rotasi `.gz` |
| Unattended upgrades | `/var/log/unattended-upgrades/*.log*`    | teks, rotasi `.gz` |
| Alternatives        | `/var/log/alternatives.log*`             | teks               |

### Setup awal dan provider

| Log            | Lokasi                                             | Format             |
| -------------- | -------------------------------------------------- | ------------------ |
| cloud-init     | `/var/log/cloud-init.log`, `cloud-init-output.log` | teks               |
| Installer      | `/var/log/installer/*`                             | teks               |
| Tencent Cloud  | `/var/log/qcloud_action.log`                       | teks               |
| Landscape      | `/var/log/landscape/sysinfo.log`                   | teks               |
| Ubuntu Pro     | `/var/log/ubuntu-advantage*.log*`                  | teks               |
| Apport (crash) | `/var/log/apport.log*`                             | teks, rotasi `.gz` |

## Goal

Admin bisa membaca semua log di atas dari CMS, di menu baru **Server**,
dikelompokkan berdasarkan kegunaannya. Log dibaca langsung dari file di VPS
(read-only), tanpa SSH dan tanpa layanan log pihak ketiga.

## Arsitektur

```
CMS page (/server/...)
  -> BFF CMS (server/api/server-logs/...)
  -> enem-landing-api (modul server-logs, SsoAuthGuard + SuperAdmin)
  -> enem-landing-log-reader (internal, overlay, token)
  -> file host read-only:
       /var/log                    -> /host/var/log:ro
       /var/lib/docker/containers  -> /host/docker/containers:ro
```

## Keputusan awal

1. **Service pembaca terpisah: `enem-landing-log-reader`** (app Nx baru,
   Node tanpa framework berat), bukan di dalam `enem-landing-api`.
   - Membaca file host butuh hak baca file milik `root` dan grup `adm`.
     Hak ini (`cap_add: DAC_READ_SEARCH`, atau jalan sebagai root) tidak
     boleh diberikan ke `enem-landing-api` yang menerima traffic publik.
   - Service ini tidak mem-publish port, hanya bergabung ke overlay network,
     dan hanya menerima request dari `enem-landing-api` yang membawa header
     token rahasia (`LOG_READER_TOKEN`).
   - Container dibuat seketat mungkin: semua mount `:ro`, `read_only: true`
     pada root filesystem, `cap_drop: ALL` lalu hanya `cap_add:
DAC_READ_SEARCH`, tanpa akses ke Docker socket, limit memory kecil
     (misalnya 96M).
   - Kalau Swarm di VPS ternyata tidak mendukung `cap_add`, fallback-nya
     jalan sebagai root dengan batasan lain yang sama. Keputusan dicatat
     saat implementasi.
2. **Hanya `SuperAdmin`** yang bisa membuka menu Server, bukan semua
   `Admin`. Log berisi IP, username, dan detail sistem.
   - Guard di `enem-landing-api` (helper baru, misalnya
     `assertSuperAdminRole`) dan menu CMS disembunyikan untuk role lain.
3. **Allowlist sumber log, bukan path bebas.**
   - API dan log-reader hanya menerima **id sumber** (misalnya `auth`,
     `btmp`, `container:enem-landing_enem-landing-api`), lalu memetakannya
     ke path di sisi log-reader. Tidak ada parameter path dari client, untuk
     mencegah path traversal.
   - File rotasi (`.1`, `.2.gz`) dipilih lewat parameter `rotation` dengan
     angka yang divalidasi, juga dipetakan di sisi server.
4. **Cara membaca per format**:
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
   - **Container**: baca `<id>-json.log` dan file rotasinya (Story 62).
     Nama service Swarm diambil dari `config.v2.json` di folder container
     yang sama (label `com.docker.swarm.service.name`), jadi tidak perlu
     Docker socket. Container lama (riwayat task Swarm) ditampilkan
     terpisah dari yang sedang jalan.
   - **`.xz`** (misalnya `apt/eipp.log.xz`): di luar scope, cukup
     ditampilkan sebagai "format tidak didukung".
5. **Batas per request**: maksimal sekitar 1.000 baris atau 1 MB per
   response, timeout baca, dan rate limit memakai mekanisme rate limit
   global yang sudah ada.
6. **Menu Server di CMS** (sidebar `layouts/dashboard.vue`, icon
   `mdi-server`), dengan sub-menu sesuai kegunaan:
   - **Ringkasan**: daftar semua sumber log beserta ukuran dan waktu ubah
     terakhir, plus angka singkat (login gagal 24 jam terakhir, jumlah
     event OOM di `kern.log`).
   - **Keamanan dan Akses**: Auth, Login gagal, Login sukses, Last login,
     Faillog, Firewall.
   - **Sistem**: Journal, Syslog, Kernel, Dmesg.
   - **Container**: daftar service Swarm (prod, dev, Redis, Traefik, dan
     stack lain) lalu log per service.
   - **Paket dan Update**: apt, dpkg, unattended upgrades, alternatives.
   - **Setup dan Provider**: cloud-init, installer, Tencent Cloud,
     Landscape, Ubuntu Pro, Apport.
7. **Fitur viewer** (komponen bersama untuk semua log teks):
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
8. **Satu log-reader untuk prod dan dev**. Log host memang sama untuk kedua
   environment karena berjalan di VPS yang sama. Log-reader dideploy
   sebagai stack sendiri (seperti Redis) yang bergabung ke overlay prod dan
   dev, dan masing-masing environment punya `LOG_READER_TOKEN` sendiri.
   Fitur bisa dimatikan per environment lewat `SERVER_LOGS_ENABLED`.
9. **Audit akses**: setiap request baca log dicatat di log
   `enem-landing-api` (user, sumber log, waktu), supaya akses ke data
   sensitif bisa ditelusuri.

## Di luar scope

- Menulis, menghapus, atau merotasi log dari CMS. Semua akses read-only.
- Streaming realtime (WebSocket atau SSE). Cukup auto refresh berkala.
- Log terpusat, retensi jangka panjang, dan alerting.
- Traefik access log (belum aktif).
- Menampilkan log dari VPS lain.

## Acceptance criteria

- [ ] App `enem-landing-log-reader` jalan sebagai service tanpa port
      publik, root filesystem read-only, semua mount host `:ro`, dan hanya
      punya capability yang diperlukan.
- [ ] Log-reader menolak request tanpa `LOG_READER_TOKEN` yang benar.
- [ ] Hanya id sumber dari allowlist yang diterima; percobaan path
      traversal (`../`, path absolut, id tidak dikenal) ditolak dan ada tes
      unitnya.
- [ ] Endpoint di `enem-landing-api` hanya bisa diakses `SuperAdmin`;
      `Admin` biasa mendapat 403, dan menu Server tidak tampil untuknya.
- [ ] Menu Server tampil di sidebar CMS dengan sub-menu Ringkasan,
      Keamanan dan Akses, Sistem, Container, Paket dan Update, serta Setup
      dan Provider.
- [ ] Semua log teks di tabel Background bisa dibaca, termasuk file rotasi
      `.1` dan `.gz`.
- [ ] `btmp`, `wtmp`, `lastlog`, dan `faillog` tampil sebagai tabel yang
      isinya cocok dengan `lastb`, `last`, `lastlog`, dan `faillog` di VPS.
- [ ] Journal bisa difilter berdasarkan unit, prioritas, dan waktu.
- [ ] Log container tampil per service Swarm, termasuk file rotasi, tanpa
      memakai Docker socket.
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
3. Login CMS sebagai `SuperAdmin`, buka setiap sub-menu Server, dan
   cocokkan beberapa baris dengan isi file di VPS.
4. Login sebagai `Admin` biasa dan pastikan menu Server tidak tampil serta
   endpoint-nya 403.
5. Buka `btmp` (sekitar 100 MB) dan pantau `docker stats` log-reader.

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
