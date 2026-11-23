# Story 69: Statistik MySQL dan Redis Lebih Dalam, Pindah Halaman Cache

**Status:** Draft (2026-11-23)

**Apps touched:** `enem-landing-monitor-api`, `enem-landing-monitor`,
`enem-landing-log-reader`, `enem-landing-cms` (hapus halaman Cache),
`enem-landing-api` (endpoint cache), `libs/backend/redis`,
`infra/ansible` (`mysql-users.sql.j2`, `deploy-mysql.yml`)

**Depends on:** Story 61 (MySQL self-host), Story 64 (menu DB dan Redis),
Story 65 (alert email)

## Background

Hasil brainstorm 2026-11-23. Menu DB dan Redis di monitor baru berisi log
container, slow query log, dan `SLOWLOG`. Pertanyaan yang sering muncul
belum terjawab:

- MySQL: berapa koneksi aktif dibanding `max_connections = 60`, database
  dan tabel mana yang paling besar, query lambat mana yang paling sering.
- Redis: berapa memory terpakai dibanding `maxmemory 96mb`, apakah ada
  eviction, berapa hit rate cache, berapa key per prefix (prod, `dev`,
  `monitor`).
- Halaman **Cache** masih di CMS, padahal sifatnya operasional (Story 63
  sudah mencatat rencana memindahkannya).

## Goal

Menu DB dan Redis di monitor menampilkan kondisi MySQL dan Redis yang
paling penting, dan halaman Cache pindah dari CMS ke monitor.

## Keputusan awal

1. **MySQL**:
   - user baru `enem_monitor` dengan hak minimal: hanya `PROCESS` (untuk
     `SHOW PROCESSLIST`) dan `USAGE`, tanpa `SELECT` ke data aplikasi.
     Password disimpan sebagai secret `DATABASE_URL_MONITOR` per
     environment, dibuat oleh `deploy-mysql.yml`;
   - monitor-api membaca `SHOW GLOBAL STATUS` (koneksi, `Threads_running`,
     `Slow_queries`, `Aborted_connects`, uptime), `SHOW GLOBAL VARIABLES`
     (`max_connections`, `innodb_buffer_pool_size`), dan
     `SHOW PROCESSLIST` (query yang sedang jalan lebih dari 1 detik);
   - **ukuran database dan tabel** dibaca log-reader dari ukuran file
     `.ibd` di `/opt/enem-landing/storage/mysql` (mount read-only baru, hanya
     nama dan ukuran file, isinya tidak dibaca), jadi user monitor tetap
     tidak butuh akses ke `information_schema` milik aplikasi;
   - **slow query dikelompokkan per pola**: angka dan string di query
     diganti `?`, lalu dihitung jumlah, total waktu, rata-rata, dan
     maksimum per pola. Dikerjakan di log-reader dari `slow.log`.
2. **Redis**:
   - `RedisService` mendapat `getInfo()` (`INFO memory`, `stats`,
     `clients`, `persistence`, `keyspace`);
   - jumlah key per prefix dihitung dengan `SCAN` (bukan `KEYS`), dibatasi
     waktu, dan di-cache 5 menit;
   - tampil: memory terpakai dibanding `maxmemory`, fragmentasi, evicted
     keys, hit rate, jumlah client, status AOF terakhir, key per prefix.
3. **Halaman Cache pindah ke monitor**:
   - halaman dan BFF `cache` di CMS dihapus beserta menu-nya;
   - endpoint `GET /cache` dan `DELETE /cache` tetap di `enem-landing-api`
     (yang memiliki key cache), tapi role diperketat menjadi SuperAdmin
     dengan `assertSuperAdminRole`;
   - monitor memanggilnya lewat monitor-api, yang meneruskan token SSO
     user, lalu menampilkannya sebagai tab **Cache** di menu Redis untuk
     prod dan dev masing-masing.
4. **Aturan alert baru** (Story 65): koneksi MySQL di atas 80%
   `max_connections`, Redis memory di atas 85% `maxmemory`, evicted keys
   naik, AOF rewrite gagal.
5. Dashboard: card DB ditambah koneksi aktif dan ukuran total; card Redis
   ditambah memory terpakai dan hit rate.

## Di luar scope

- Mengubah konfigurasi MySQL atau Redis dari monitor.
- `EXPLAIN` query dari monitor.
- Mengaktifkan `performance_schema` (sengaja `OFF` untuk hemat memory).

## Acceptance criteria

- [ ] Angka koneksi dan variabel MySQL cocok dengan `SHOW GLOBAL STATUS`
      di VPS.
- [ ] User `enem_monitor` tidak bisa `SELECT` tabel aplikasi (dites).
- [ ] Ukuran database cocok dengan `du -sh` folder data MySQL.
- [ ] Slow query tampil per pola dengan jumlah dan waktu.
- [ ] Statistik Redis cocok dengan `redis-cli INFO`.
- [ ] Halaman Cache tidak ada lagi di CMS, dan tab Cache di monitor bisa
      melihat serta menghapus cache prod dan dev. `Admin` biasa mendapat
      403 dari `enem-landing-api` untuk endpoint cache.
- [ ] Lint, format, test, build, dan e2e lulus lokal sebelum PR (e2e CMS
      untuk Cache dipindah ke e2e monitor).

## Langkah manual setelah deploy

1. Jalankan ulang `deploy-mysql.yml` untuk membuat user `enem_monitor`,
   simpan `DATABASE_URL_MONITOR` di kedua environment GitHub.
2. Jalankan ulang `deploy-log-reader.yml` (mount folder data MySQL).
3. Bandingkan angka dengan `SHOW GLOBAL STATUS` dan `redis-cli INFO`.

## Referensi

- MySQL `SHOW STATUS`:
  https://dev.mysql.com/doc/refman/8.4/en/show-status.html
- MySQL privileges (`PROCESS`):
  https://dev.mysql.com/doc/refman/8.4/en/privileges-provided.html
- Redis `INFO`: https://redis.io/docs/latest/commands/info/
- Redis `SCAN`: https://redis.io/docs/latest/commands/scan/
