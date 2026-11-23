# Story 62: Kebersihan Log Server (Rotasi Docker, Batas journald, Simpan Container Crash)

**Status:** Kode selesai, menunggu rollout di VPS (2026-11-23)

**Apps touched:** `infra/ansible` (`init-server.yml`, `deploy.yml`)

**Depends on:** Story 10 (infra/CI-CD)

**Dikerjakan sebelum:** Story 64 (menu Logs di monitor), supaya pembaca log
di monitor langsung menangani file rotasi Docker (`*-json.log.1`, `.2`).

## Background

Hasil brainstorm log server 2026-11-23. Kondisi di VPS `enem-prod`:

| Area                 | Kondisi                                                                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Log container Docker | Driver `json-file` tanpa `max-size`. Tidak ada `/etc/docker/daemon.json` dan tidak ada `logging:` di compose. Total 9.4 MB, tapi tumbuh tanpa batas |
| journald             | 1.0 GB di `/var/log/journal`, `journald.conf` masih default (batas bawaan bisa sampai 4 GB, 10% filesystem)                                         |
| Disk                 | 59 GB, 46 GB free                                                                                                                                   |

Disk masih lega, tapi tidak ada yang mencegah log container atau journal
memenuhi disk diam-diam, misalnya kalau ada container yang crash-loop dan
menulis stack trace terus-menerus seperti saat outage Upstash 2026-11-18.

### Log container yang crash ikut terhapus saat deploy

Ditemukan saat brainstorm Story 64 (2026-11-23):

- Di VPS ada 14 container jalan dan **0 container yang sudah berhenti**.
- `docker service ps enem-landing_enem-landing-api` masih mencatat dua task
  `Failed 5 days ago` dengan error "task: non-zero exit (1)" dari outage
  Upstash, tapi container dan log-nya sudah tidak ada.
- Penyebabnya `docker container prune -f` di akhir
  `infra/ansible/playbooks/deploy.yml` (task "Hapus container Swarm task
  lama yang sudah exited"). Perintah ini menghapus **semua** container yang
  berhenti di seluruh host, jadi **deploy dev juga menghapus container prod
  yang crash**, dan deploy dev terjadi setiap merge ke `develop`.

Akibatnya, log penyebab crash hanya bertahan sampai deploy berikutnya.
Setelah outage Upstash, deploy perbaikannya justru menghapus bukti
crash-nya.

## Goal

Log container Docker dan journald punya batas ukuran yang jelas, dan
container yang crash tetap tersimpan beberapa hari supaya log-nya bisa
diperiksa. Semua diatur lewat Ansible sehingga tercatat di repo dan ikut
terpasang kalau VPS dibuat ulang.

## Keputusan awal

1. **Rotasi log Docker lewat `/etc/docker/daemon.json`**:
   ```json
   {
     "log-driver": "json-file",
     "log-opts": { "max-size": "10m", "max-file": "3" }
   }
   ```
   - Maksimal sekitar 30 MB per container.
   - Kalau `daemon.json` sudah ada, key lain dipertahankan (merge, bukan
     timpa).
   - Opsi ini hanya berlaku untuk container yang **dibuat setelahnya**.
     Container yang sedang jalan baru ikut setelah dibuat ulang (deploy
     berikutnya, atau `docker service update --force`).
   - Restart dockerd me-restart semua container, jadi dilakukan di jam sepi
     dan lewat handler Ansible yang hanya jalan bila file berubah.
2. **Batas journald** lewat drop-in
   `/etc/systemd/journald.conf.d/size.conf`:
   ```ini
   [Journal]
   SystemMaxUse=300M
   SystemKeepFree=2G
   ```
   lalu restart `systemd-journald` (tidak mengganggu container) dan
   `journalctl --vacuum-size=300M` sekali untuk langsung mengecilkan journal
   yang sudah 1 GB.
3. **Semua diatur di `init-server.yml`**, dengan task idempoten dan
   handler restart, tidak diubah manual di server.
4. **Prune container yang sudah berumur saja** di `deploy.yml`:
   ```
   docker container prune -f --filter "until=72h"
   ```
   - Container yang berhenti kurang dari 72 jam tidak dihapus, termasuk
     container crash dari environment lain di host yang sama.
   - Jumlahnya tetap terbatas karena Swarm hanya menyimpan 5 task terakhir
     per slot (`TaskHistoryRetentionLimit=5`, dicek 2026-11-23), dan log
     per container dibatasi sekitar 30 MB oleh keputusan 1.
   - Kondisi `changed_when` pada task tersebut tetap berfungsi.
   - `docker image prune -a -f` tidak diubah. Image yang masih dipakai
     container berhenti tidak ikut terhapus oleh Docker, jadi tidak
     bentrok.
   - Komentar di header `deploy.yml` yang menjelaskan prune diperbarui.

## Di luar scope

- Duplikasi journal ke `syslog`, `auth.log`, dan `kern.log` lewat rsyslog.
  Biarkan apa adanya karena Story 64 membaca file teks tersebut.
- Rotasi `btmp`. Sudah dirotasi bulanan oleh logrotate bawaan; ukurannya
  besar karena brute force SSH dan akan mengecil setelah hardening SSH
  (story terpisah).
- Log terpusat, alerting, dan Traefik access log.

## Acceptance criteria

- [x] `init-server.yml` memasang `daemon.json` dengan `max-size: 10m` dan
      `max-file: 3`, idempoten, dan tidak menghapus key lain yang sudah ada.
- [x] `init-server.yml` memasang drop-in journald dengan
      `SystemMaxUse=300M` dan `SystemKeepFree=2G`.
- [ ] Menjalankan playbook dua kali berturut-turut tidak me-restart
      dockerd pada run kedua.
- [ ] Setelah rollout, `docker inspect` container baru menunjukkan
      `LogConfig` dengan `max-size` dan `max-file`.
- [ ] `journalctl --disk-usage` di bawah 300 MB.
- [ ] `deploy.yml` memakai `docker container prune -f --filter "until=72h"`.
      Container yang berhenti kurang dari 72 jam masih ada setelah deploy
      prod maupun dev (dites dengan container yang sengaja dihentikan).
- [x] `infra/ansible/README.md` menjelaskan batas log ini.

## Langkah manual setelah deploy

1. Jalankan `init-server.yml` di jam sepi (restart dockerd me-restart semua
   container prod dan dev sebentar).
2. Redeploy stack prod dan dev (atau `docker service update --force`) agar
   semua container dibuat ulang dengan opsi log baru.
3. Cek `docker inspect --format '{{.HostConfig.LogConfig}}'` pada salah
   satu container app.
4. Cek `sudo journalctl --disk-usage`.
5. Pastikan semua service kembali `1/1` di `docker service ls`.
6. Setelah deploy berikutnya, cek `docker ps -a -f status=exited`: container
   task lama yang berumur kurang dari 72 jam masih ada.

## Referensi

- Docker, JSON file logging driver:
  https://docs.docker.com/engine/logging/drivers/json-file/
- Docker, konfigurasi daemon (`daemon.json`):
  https://docs.docker.com/engine/daemon/
- Docker, `container prune --filter until`:
  https://docs.docker.com/reference/cli/docker/container/prune/
- systemd, `journald.conf` (`SystemMaxUse`, `SystemKeepFree`):
  https://www.freedesktop.org/software/systemd/man/latest/journald.conf.html
