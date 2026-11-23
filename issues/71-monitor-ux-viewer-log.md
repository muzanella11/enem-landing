# Story 71: Viewer Log Lebih Nyaman (Live Tail, Korelasi Waktu, Deep Link)

**Status:** Done (2026-11-23)

**Apps touched:** `enem-landing-monitor`, `enem-landing-monitor-api`,
`enem-landing-log-reader`

**Depends on:** Story 64 (viewer log)

## Background

Hasil brainstorm 2026-11-23. Viewer log Story 64 sudah punya pencarian,
"muat lebih lama", dan auto refresh 10 detik. Saat investigasi insiden
masih ada beberapa hal yang lambat:

- auto refresh memuat ulang satu halaman penuh, bukan hanya baris baru;
- saat satu container crash, harus membuka container lain satu per satu
  untuk melihat apa yang terjadi di waktu yang sama (misalnya API crash
  karena Redis atau MySQL bermasalah);
- tidak bisa membagikan atau menyimpan posisi baris log tertentu;
- filter yang sering dipakai harus diketik ulang.

## Goal

Membaca log di monitor lebih cepat untuk investigasi: live tail, lihat
semua log di sekitar satu waktu, deep link ke baris tertentu, dan filter
tersimpan.

## Keputusan awal

1. **Live tail lewat SSE** (Server-Sent Events):
   - log-reader: `GET /containers/:id/follow` dan
     `GET /sources/:id/follow` yang mengirim baris baru setiap ada
     tambahan (polling ukuran file tiap 1 detik, mengikuti rotasi);
   - monitor-api meneruskan stream dengan guard yang sama, dan audit log
     mencatat awal dan akhir sesi;
   - BFF Nuxt meneruskan stream ke browser;
   - batas: maksimal 3 stream per user, putus otomatis setelah 15 menit,
     dan berhenti saat tab tidak aktif;
   - mode auto refresh 10 detik tetap ada sebagai cadangan.
2. **Korelasi waktu**:
   - endpoint log-reader `GET /timeline?around=<ISO>&window=<menit>`:
     menggabungkan log semua container (jalan dan berhenti) dalam rentang
     waktu itu, maksimal 10 menit dan 2.000 baris, diurutkan per waktu,
     dengan nama service di setiap baris;
   - di viewer, klik waktu sebuah baris untuk membuka **Timeline** di
     sekitar waktu itu; container yang crash di rentang itu ditandai;
   - filter per stack (prod, dev, DB, Redis, infra) dan per service.
3. **Deep link**: state viewer (menu, sumber atau container, file, posisi
   `before`, pencarian, stream) disimpan di query URL, jadi bisa dibuka
   ulang atau dibagikan ke SuperAdmin lain. Baris yang ditautkan di-scroll
   dan di-highlight.
4. **Filter tersimpan** per browser (`localStorage`, dibungkus try/catch),
   misalnya "stderr saja", "cari: error", "unit ssh.service". Bukan data
   penting, jadi tidak disimpan di server.
5. **Lain-lain**: pilihan zona waktu tampilan (UTC atau Asia/Jakarta),
   loncat ke waktu tertentu di file teks, tombol salin baris, dan
   pintasan keyboard (`/` untuk cari, `g` untuk ke paling baru).

## Di luar scope

- WebSocket.
- Pencarian regex atau query terstruktur.
- Menyimpan filter di server atau berbagi filter antar user.

## Acceptance criteria

- [ ] Live tail menampilkan baris baru kurang dari 2 detik setelah ditulis,
      tetap jalan saat file dirotasi, dan berhenti setelah 15 menit atau
      saat tab ditutup.
- [ ] Batas 3 stream per user berlaku, dan sesi tercatat di audit log.
- [ ] Timeline di sekitar waktu crash container menampilkan log semua
      container lain di rentang itu, termasuk yang sudah berhenti.
- [ ] Deep link membuka viewer di posisi dan filter yang sama, termasuk di
      browser lain setelah login.
- [ ] Filter tersimpan tetap ada setelah reload, dan halaman tetap jalan
      kalau `localStorage` diblokir.
- [ ] Memory log-reader tetap di bawah limit dengan 3 stream aktif.
- [ ] Lint, format, test, build, dan e2e lulus lokal sebelum PR.

## Referensi

- Server-Sent Events:
  https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
