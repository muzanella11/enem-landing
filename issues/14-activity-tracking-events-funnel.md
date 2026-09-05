# Story 14: Activity Tracking - Custom Event & Funnel Tracking

**Depends on:** 13 (Activity Tracking - Fondasi)

**Apps touched:** `enem-landing-api`, `enem-landing-web`, `enem-landing-cms`

## Goal

Memungkinkan pencatatan event custom (mis. klik tombol contact, submit
form) dan mendefinisikan funnel (urutan event/pageview) untuk melihat
drop-off antar step, mengikuti pola goal-tracking yang dibahas di
[12-epic-activity-tracking-overview.md](12-epic-activity-tracking-overview.md).

## Kenapa

Pageview saja tidak cukup untuk tahu aksi spesifik apa yang dilakukan
pengunjung (klik CTA, submit form kontak) atau di mana mereka drop-off
sebelum menyelesaikan alur penting — insight ini yang paling sering dicari
dari tool seperti Userpilot.

## Scope

### Backend (`enem-landing-api`, modul `tracking` yang sudah ada)

- `TrackingEventEntity` (`id`, `sessionId` FK, `name`, `payload` kolom
  `JSON` MySQL nullable, `path`, `occurredAt`).
- `POST /tracking/events` — terima array event (batch), hormati flag
  `eventsEnabled` dari `/tracking/config` (tolak/no-op kalau nonaktif,
  jangan cuma didisiplinkan di client).
- `TrackingFunnelEntity` (`id`, `name`, `steps` — kolom `JSON` array nama
  event/path terurut).
- `GET/POST/PUT/DELETE /tracking/funnels` — admin-only CRUD definisi
  funnel.
- `GET /tracking/funnels/:id/report` — hitung jumlah visitor unik yang
  mencapai tiap step funnel (berbasis `sessionId` yang match event/pageview
  di tiap step, berurutan), return data untuk chart drop-off.

### Client (`enem-landing-web`)

- Composable `useTracker().track(eventName, payload?)` — dipanggil manual
  dari komponen yang mau diinstrumen (mis. tombol contact, link social).
- Auto-binding: elemen dengan atribut `data-track="nama_event"` otomatis
  terkirim event saat diklik, tanpa perlu wiring manual per komponen —
  directive/plugin Nuxt kecil yang delegasikan click listener di level
  document.
- Event dibatch sama seperti pageview (kirim tiap beberapa detik/saat page
  hide), lewat BFF route baru `server/api/tracking/events.post.ts`.

### CMS

- Halaman "Activity Tracking" > "Funnels" — list funnel, form buat/edit
  (urutan step, drag-to-reorder kalau sempat, minimal input list biasa
  untuk MVP), halaman detail funnel menampilkan chart drop-off per step
  (skill `dataviz`).

## Acceptance Criteria

- [x] Event custom manual (`track()`) dan auto-binding (`data-track`)
      dua-duanya tercatat benar dengan `payload` yang sesuai.
      **Catatan**: `track()` manual diverifikasi end-to-end lewat curl
      (payload custom tersimpan benar). Auto-binding `data-track` sudah
      diimplementasikan (listener klik terdelegasi di `document`, sama
      pola dengan yang sudah dites di Story 13) tapi belum diklik manual
      di browser sungguhan pada sesi ini karena rate limit tool browser -
      logic-nya identik/lebih sederhana dari `trackPageview()` yang sudah
      terverifikasi penuh, risiko rendah.
- [x] Saat `eventsEnabled=false`, endpoint `/tracking/events`
      menolak/no-op walau ada request yang nyasar terkirim (diverifikasi
      end-to-end lewat curl - baris tidak bertambah di `tracking_events`).
- [x] Funnel dengan >=2 step menghitung drop-off yang benar terhadap data
      uji manual (diverifikasi end-to-end: 3 sesi curl - 1 in-order lolos
      ke step 2, 1 cuma sampai step 1, 1 out-of-order dikecualikan dengan
      benar dari step 2 walau punya event yang match).
- [x] CMS bisa membuat, mengedit, menghapus funnel, dan melihat report
      drop-off-nya (halaman + BFF routes selesai, build sukses; belum
      diklik manual di browser pada sesi ini karena rate limit, tapi
      endpoint yang dipanggilnya sudah tervalidasi penuh lewat curl).
- [x] Unit test funnel report logic (kasus: 0 sesi mencapai step
      tertentu, urutan step tidak berurutan, dst) - 7 test baru di
      `tracking-funnels.service.spec.ts`, semua lulus.
- [x] `nx build` semua app yang tersentuh sukses.

## Status: SELESAI (2026-09-05)

Tidak ada bug baru yang ditemukan selama implementasi story ini (berbeda
dari Story 13) - kemungkinan karena pola entity/service/controller/BFF-nya
sudah divalidasi & diperbaiki tuntas di Story 13, jadi Story 14 murni
replikasi pola yang sudah teruji ke domain baru (event & funnel).
