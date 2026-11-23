# Story 68: Analisis Keamanan Login di Monitor

**Status:** Draft (2026-11-23)

**Apps touched:** `enem-landing-log-reader`, `enem-landing-monitor-api`,
`enem-landing-monitor`

**Depends on:** Story 64 (log `btmp`, `wtmp`, `auth.log`), Story 65 (alert
email)

**Terkait:** story SSH hardening (masih rencana). Data dari story ini
menjadi bukti dan pengukur hasil hardening.

## Background

Hasil brainstorm 2026-11-23. Dicek di VPS hari itu: `sshd` masih menerima
login root dan password, dengan sekitar 11 ribu login gagal per hari. Menu
Server di monitor sudah bisa membaca `btmp` dan `auth.log` baris per
baris, tapi belum menjawab pertanyaan penting: siapa yang menyerang, dari
mana, menebak user apa, dan apakah ada login sukses yang tidak dikenal.

## Goal

SuperAdmin bisa melihat ringkasan serangan login (IP, negara, user yang
ditebak, tren per jam) dan login sukses yang mencurigakan, dengan alert
email untuk kejadian berisiko.

## Keputusan awal

1. **Agregasi di log-reader**, bukan di browser: endpoint baru
   `GET /security/summary?hours=24|168` membaca `btmp` dari akhir (bisa
   sampai sekitar 100 MB, tetap streaming dengan batas waktu Story 64) dan
   mengembalikan:
   - jumlah login gagal per jam;
   - top 50 IP (jumlah, percobaan pertama dan terakhir, user yang paling
     sering ditebak);
   - top 50 username yang ditebak;
   - login sukses dari `wtmp` dan baris `Accepted ...` di `auth.log`:
     user, IP, metode (`publickey` atau `password`), waktu.
2. **Lokasi IP**: memakai `ip-api.com` (layanan yang sudah dipakai
   `geo-lookup.ts` di `enem-landing-api`), dipanggil dari monitor-api,
   bukan dari log-reader (log-reader tidak boleh punya akses internet
   keluar). Hasil di-cache di Redis 7 hari, batch maksimal sesuai limit
   gratis ip-api. Logika lookup dipindah ke lib bersama kalau dipakai dua
   app.
3. **Daftar IP dikenal**: IP yang pernah login sukses dengan `publickey`
   dianggap dikenal. Disimpan di Redis, bisa diberi label dari monitor
   (misalnya "rumah", "kantor").
4. **Aturan alert baru** (Story 65):
   - login sukses dari IP yang belum dikenal (severity tinggi);
   - login sukses memakai **password** (bukan key);
   - login sukses sebagai `root`;
   - lonjakan login gagal (sudah ada di Story 65, ambangnya bisa diatur).
5. **Monitor**: tab baru **Analisis** di menu Server bagian Keamanan dan
   Akses: grafik login gagal per jam, tabel top IP dengan negara dan ASN,
   tabel top username, dan daftar login sukses dengan penanda IP dikenal
   atau baru. Dashboard: card Server ditambah "IP penyerang unik 24 jam" dan
   "login sukses dari IP baru".
6. Tidak ada aksi blokir dari monitor (tetap read-only). Monitor hanya
   menampilkan perintah yang disarankan (misalnya `ufw deny from <ip>`)
   untuk dijalankan manual.

## Di luar scope

- Memblokir IP otomatis (fail2ban atau sejenisnya). Lebih cocok di story
  SSH hardening.
- Log akses Traefik dan serangan HTTP.

## Acceptance criteria

- [ ] Jumlah login gagal 24 jam cocok dengan
      `lastb -s -1days | wc -l` di VPS (toleransi kecil karena waktu baca).
- [ ] Top IP dan top username cocok dengan hasil `lastb` yang diolah
      manual.
- [ ] Login sukses dari IP baru dan login password memicu email (dites di
      dev dengan login sengaja).
- [ ] Membaca `btmp` 100 MB tidak membuat log-reader melewati limit memory.
- [ ] Lint, format, test, build, dan e2e lulus lokal sebelum PR.

## Langkah manual setelah deploy

1. Tandai IP sendiri sebagai dikenal di monitor.
2. Bandingkan angka dengan `lastb` dan `last` di VPS.

## Referensi

- `utmp(5)`: https://man7.org/linux/man-pages/man5/utmp.5.html
- ip-api batch endpoint: https://ip-api.com/docs/api:batch
