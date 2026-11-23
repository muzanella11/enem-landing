# Story 66: Metrik Live Server dan Container di Monitor

**Status:** Draft (2026-11-23)

**Apps touched:** `enem-landing-log-reader`, `enem-landing-monitor-api`,
`enem-landing-monitor`, `infra/ansible` (`log-reader-stack.yml.j2`)

**Depends on:** Story 64 (log-reader), Story 65 (alert email)

## Background

Hasil brainstorm 2026-11-23. Monitor baru menampilkan log. Masalah yang
paling sering terjadi di VPS ini justru soal memory:

- 2026-11-07: CMS prod crash "JavaScript heap out of memory" di heap 60M
  (Bad Gateway).
- 2026-11-09: tools OOM karena cache route `swr` tanpa batas.
- Limit container sekarang hanya bisa dicek lewat SSH dan `docker stats`.

VPS 3.6 GB / 2 vCPU menjalankan prod, dev, MySQL (640M), Redis (160M),
Traefik, monitor, dan log-reader. Pemakaian memory per container dibanding
limit-nya adalah angka paling penting untuk mencegah OOM berikutnya.

## Goal

SuperAdmin bisa melihat pemakaian CPU, RAM, swap, disk, dan load host,
serta memory dan CPU setiap container dibanding limit-nya, lengkap dengan
grafik 24 jam dan alert email sebelum container kena OOM.

## Keputusan awal

1. **Sumber data tetap read-only, tanpa Docker socket**:
   - host: `/proc/meminfo`, `/proc/loadavg`, `/proc/stat` (CPU), dan
     `/proc/uptime`. Di dalam container tanpa lxcfs, file ini menampilkan
     angka host, jadi tidak perlu mount tambahan. Dicek ulang saat
     implementasi;
   - disk: `statfs` pada mount `/host/var/log` (filesystem root host) dan
     `/opt/enem-landing/storage` (MySQL, Redis, backup);
   - container: cgroup v2 host di-mount read-only
     (`/sys/fs/cgroup:/host/cgroup:ro`), lalu baca
     `system.slice/docker-<id>.scope/memory.current`, `memory.max`,
     `memory.peak`, `memory.events` (jumlah `oom_kill`), dan `cpu.stat`.
     Path cgroup dicek ulang di VPS (Ubuntu 24.04, driver cgroup systemd).
     Id container tetap harus dari hasil pemindaian, sama seperti Story 64.
2. **Endpoint log-reader baru**: `GET /metrics/host` dan
   `GET /metrics/containers` (hanya container yang jalan).
3. **Sampling 1 menit oleh monitor-api** (scheduler yang sama dengan
   alert), disimpan di Redis sebagai time series sederhana: satu key per
   metrik per hari, nilai per menit, TTL 2 hari. Hanya prod yang
   melakukan sampling (host sama untuk kedua environment), dev membaca
   data yang sama.
4. **Tampilan monitor**:
   - menu **Server**: tab baru **Metrik** di posisi pertama, berisi
     gauge CPU, RAM, swap, disk, load, dan uptime host, plus grafik 24
     jam;
   - menu **Apps**, **DB**, **Redis**: setiap kartu container menampilkan
     memory terpakai dibanding limit (bar, merah di atas 85%), CPU, dan
     `oom_kill` dari `memory.events`;
   - tab **Memory** di Apps: tabel semua container diurutkan dari persen
     memory tertinggi, termasuk total semua limit dibanding RAM host
     (menggantikan hitungan manual di header `compose.prod.yml`);
   - dashboard: card Server ditambah RAM dan disk, card Apps ditambah
     container dengan memory tertinggi.
5. **Aturan alert baru** (Story 65): memory container di atas 90% limit
   selama 5 menit, disk di atas 80%, swap di atas 50%, load rata-rata 5
   menit di atas 2x jumlah vCPU selama 10 menit. Semuanya punya email
   "resolved".
6. Library grafik ringan di monitor saja (misalnya `chart.js`), tidak
   ditambahkan ke app lain.

## Di luar scope

- Prometheus, Grafana, atau time-series DB.
- Metrik di dalam aplikasi (heap V8, event loop lag, request per detik).
- Retensi lebih dari 2 hari.

## Acceptance criteria

- [ ] Angka RAM, swap, disk, dan load di monitor cocok dengan `free -h`,
      `df -h`, dan `uptime` di VPS (selisih wajar karena waktu baca).
- [ ] Memory per container cocok dengan `docker stats --no-stream`.
- [ ] Container yang dipaksa mendekati limit memicu email alert, lalu
      email "resolved" setelah turun.
- [ ] Grafik 24 jam tampil untuk host dan per container.
- [ ] Log-reader tetap tanpa Docker socket, mount baru read-only, dan
      memory-nya tetap di bawah limit 96M.
- [ ] Lint, format, test, build, dan e2e lulus lokal sebelum PR.

## Langkah manual setelah deploy

1. Cek path cgroup di VPS: `ls /sys/fs/cgroup/system.slice | grep docker`.
2. Jalankan ulang `deploy-log-reader.yml` (mount cgroup baru).
3. Bandingkan angka monitor dengan `free -h`, `df -h`, `docker stats`.

## Referensi

- `proc(5)`: https://man7.org/linux/man-pages/man5/proc.5.html
- cgroup v2 memory controller:
  https://docs.kernel.org/admin-guide/cgroup-v2.html#memory
- Docker runtime metrics:
  https://docs.docker.com/engine/containers/runmetrics/
