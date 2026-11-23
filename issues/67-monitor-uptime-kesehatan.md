# Story 67: Uptime dan Kesehatan Layanan di Monitor

**Status:** Done (2026-11-23)

**Apps touched:** `enem-landing-monitor-api`, `enem-landing-monitor`,
`enem-landing-log-reader`

**Depends on:** Story 63 (monitor), Story 65 (alert email)

## Background

Hasil brainstorm 2026-11-23. Sekarang tidak ada pengecekan dari luar
apakah situs benar-benar bisa diakses. Bad Gateway CMS (2026-11-07) dan API
crash-loop (2026-11-18) baru ketahuan saat dibuka manual. Ada dua hal lain
yang juga belum terpantau:

- **Sertifikat TLS**: wildcard `*.muzanella.com` diperbarui otomatis oleh
  Traefik lewat ACME DNS-01. Kalau token Cloudflare kedaluwarsa, renewal
  gagal diam-diam sampai sertifikat habis.
- **Backup MySQL harian** (Story 61): hasilnya hanya ada di journal.

## Goal

SuperAdmin bisa melihat status naik/turun, latency, dan riwayat setiap
situs dan API, sisa masa berlaku sertifikat TLS, dan status backup MySQL
terakhir, dengan alert email saat ada yang bermasalah.

## Keputusan awal

1. **Target cek** (konfigurasi di kode, bukan input bebas dari UI, supaya
   monitor-api tidak bisa dipakai sebagai SSRF):

   | Target          | Cara cek                                                          | Environment |
   | --------------- | ----------------------------------------------------------------- | ----------- |
   | Situs publik    | `GET https://muzanella.com`, `tools`, `cms`, `account`, `monitor` | prod        |
   | Situs dev       | domain `dev-*` yang sama                                          | dev         |
   | API internal    | `GET /health` lewat overlay network                               | per env     |
   | MySQL dan Redis | status container + `ping`                                         | bersama     |

   Situs publik dicek lewat Cloudflare (sama seperti pengunjung), jadi
   kegagalan Cloudflare atau DNS juga ketahuan.

2. **Interval 1 menit**, timeout 10 detik, oleh scheduler monitor-api.
   Hasil per menit disimpan di Redis (TTL 7 hari) untuk menghitung uptime
   24 jam dan 7 hari serta grafik latency.
3. **Down** = 3 kegagalan berturut-turut (status bukan 2xx/3xx atau
   timeout). Kirim alert email (Story 65), lalu email "resolved" saat naik
   lagi, berisi lama downtime.
4. **Sertifikat TLS**: monitor-api membuka koneksi TLS ke
   `muzanella.com` dan setiap subdomain sekali sehari, membaca tanggal
   `valid_to`. Alert kalau sisa di bawah 14 hari.
5. **Backup MySQL**: log-reader membaca daftar file di folder backup
   (read-only, hanya nama, ukuran, dan waktu, isinya tidak dibaca) dan
   hasil unit `mysql-backup.service` dari journal. Alert kalau backup
   terakhir lebih dari 26 jam lalu atau gagal. Webhook gagal-backup dari
   Story 65 tetap berlaku.
6. **Monitor**:
   - menu baru **Uptime**: daftar target dengan status, uptime 24 jam dan
     7 hari, latency terakhir, grafik latency 24 jam, dan riwayat
     kejadian down;
   - bagian **TLS** dan **Backup** di menu yang sama;
   - dashboard: card **Uptime** (jumlah target naik/turun, target dengan
     latency tertinggi, sisa hari sertifikat, backup terakhir).

## Catatan implementasi

- `mysql-backup.sh` mengunggah langsung ke R2 dan tidak menyimpan file di
  VPS, jadi status backup dibaca hanya dari journal
  `mysql-backup.service` (baris `Backup <stamp> done` dan baris gagal),
  tanpa mount folder backup.
- Cek MySQL di Uptime memakai koneksi user `enem_monitor` (Story 69).
  Kalau `DATABASE_URL_MONITOR` belum diisi, target MySQL ditandai "tidak
  dicek".

## Di luar scope

- Cek dari lokasi lain di luar VPS (kalau VPS mati total, monitor ikut
  mati). Bisa dipertimbangkan layanan eksternal gratis di story lain.
- Halaman status publik.
- Target yang bisa ditambah bebas dari UI.

## Acceptance criteria

- [ ] Semua target tampil dengan status, uptime 24 jam, dan latency.
- [ ] Mematikan satu service dev memicu alert setelah 3 cek dan email
      "resolved" dengan lama downtime saat dinyalakan lagi (di dev hanya
      tercatat, sesuai aturan Story 65).
- [ ] Sisa masa berlaku sertifikat cocok dengan
      `openssl s_client -connect muzanella.com:443 | openssl x509 -noout -enddate`.
- [ ] Status backup terakhir cocok dengan `journalctl -u mysql-backup.service`
      dan isi folder backup.
- [ ] Target cek tidak bisa diubah dari request (tes unit).
- [ ] Lint, format, test, build, dan e2e lulus lokal sebelum PR.

## Langkah manual setelah deploy

1. Pastikan path folder backup MySQL ikut di-mount read-only ke
   log-reader, lalu jalankan ulang `deploy-log-reader.yml`.
2. Cek menu Uptime dan bandingkan dengan `curl -I` ke setiap domain.

## Referensi

- Node `tls.connect` dan `getPeerCertificate`:
  https://nodejs.org/api/tls.html#tlssocketgetpeercertificatedetailed
- OWASP SSRF prevention:
  https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
