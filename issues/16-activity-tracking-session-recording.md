# Story 16: Activity Tracking - Session Recording (rrweb + Upload ke R2)

**Depends on:** 13 (Activity Tracking - Fondasi), 03 (enem-landing-account-api
— untuk endpoint `/uploads` & konfigurasi R2 yang sudah ada)

**Apps touched:** `enem-landing-api`, `enem-landing-web`,
`enem-landing-account-api`, `enem-landing-cms`

## Goal

Merekam interaksi pengunjung (DOM mutation, gerakan mouse, scroll) di
halaman publik menggunakan `rrweb`, upload hasil rekaman ke Cloudflare R2
lewat rantai BFF → backend api → backend account, dan sediakan pemutar
ulang (`rrweb-player`) di CMS.

## Kenapa

Session recording memberi insight paling detail soal friction pengunjung
(dead click, kebingungan navigasi) yang tidak tertangkap dari
pageview/event/heatmap saja. Ini fitur paling kompleks & paling besar
storage-nya dari 4 fitur activity tracking, sengaja dikerjakan terakhir
setelah fondasi + funnel + heatmap stabil, sesuai
[12-epic-activity-tracking-overview.md](12-epic-activity-tracking-overview.md).

## Scope

### Auth service-to-service baru (`enem-landing-account-api`)

- `InternalApiGuard` baru — cek header `X-Internal-Api-Key` terhadap env
  var `INTERNAL_API_KEY`, dipasang di jalur upload khusus caller
  server-to-server (bukan menggantikan `JwtAuthGuard` yang sudah ada untuk
  upload dari CMS/user login — endpoint terpisah atau strategi guard
  majemuk, detail ditentukan saat implementasi).
- `INTERNAL_API_KEY` di-generate & disimpan sebagai env var di
  `enem-landing-api` dan `enem-landing-account-api` (harus sama persis di
  kedua app).
- Endpoint upload menerima `dto.app = 'enem-landing-web'`,
  **`dto.purpose = 'user-activity-tracking'`** (reuse `UploadFileDto`/
  `UploadsService` yang sudah ada) — key R2 hasil
  `user-activity-tracking/{id}.{ext}`, mengikuti pola
  `${app}/${purpose}/${id}.${ext}` yang sudah ada, dengan prefix khusus ini
  supaya lifecycle/retention rule di R2 bisa diatur terpisah dari upload
  konten CMS.

### Backend (`enem-landing-api`, modul `tracking`)

- `TrackingRecordingChunkEntity` (`id`, `sessionId` FK, `sequence` int,
  `r2Key`, `r2Url`, `sizeBytes`, `occurredAt`).
- `POST /tracking/session-recording` — terima 1 chunk rrweb (gzip, base64
  atau multipart), hormati flag `sessionRecordingEnabled` + sampling rate.
  - Panggil `enem-landing-account-api` `/uploads` (dengan header
    `X-Internal-Api-Key`) untuk upload blob dengan
    `purpose='user-activity-tracking'`.
  - Simpan metadata chunk (bukan blob-nya) ke
    `tracking_recording_chunks`.
- `TrackingSettingsEntity` ditambah field `sessionRecordingSampleRatePct`
  (default rendah, mis. 10) — dicek di client sebelum mulai
  `rrweb.record()` per sesi baru (random roll sekali per sesi, bukan per
  event).
- Job retensi baru (via `SchedulerService`) — hapus recording (baik object
  R2 lewat panggil `DELETE /uploads/:id` yang sudah ada, maupun row
  metadata) yang lebih tua dari window retensi (mis. 30 hari) — kontrol
  storage sesuai concern yang dibahas saat brainstorming.
- `GET /tracking/sessions?hasRecording=true` — admin-only, list sesi yang
  punya rekaman (durasi, halaman dikunjungi, device) untuk halaman replay
  CMS.
- `GET /tracking/sessions/:id/recording` — admin-only, return urutan chunk
  (metadata + `r2Url`) untuk 1 sesi, dipakai player rebuild event stream.

### Client (`enem-landing-web`)

- Dependency baru `rrweb`.
- Saat `sessionRecordingEnabled=true` dan sample-rate roll lolos untuk
  sesi ini, `rrweb.record({ emit })` — `emit` mengumpulkan event ke
  buffer, di-gzip & dikirim per chunk (mis. tiap 10 detik atau saat buffer
  mencapai ukuran tertentu) lewat BFF route baru
  `server/api/tracking/session-recording.post.ts`.
- BFF route ini meneruskan body (termasuk `sessionId`, `sequence`) ke
  `enem-landing-api` lewat `createApiClient` seperti route lain —
  `enem-landing-api` yang urus panggilan lanjutan ke
  `enem-landing-account-api`, BFF tidak perlu tahu soal R2/internal key
  sama sekali.

### CMS

- Dependency baru `rrweb-player` (+ CSS-nya).
- Halaman "Activity Tracking" > "Sessions" — list sesi yang punya rekaman,
  klik untuk buka halaman replay yang fetch semua chunk (`GET
  /tracking/sessions/:id/recording`), gabungkan event dari tiap chunk
  sesuai `sequence`, feed ke `rrweb-player`.

## Acceptance Criteria

- [x] Panggilan ke `enem-landing-account-api` `/uploads/internal` tanpa
      header `X-Internal-Api-Key` yang valid ditolak (401) — diverifikasi
      end-to-end lewat curl (tanpa key, key salah, key benar tapi body
      invalid → lolos guard, kena validasi DTO 400 seperti seharusnya).
- [ ] Rekaman rrweb dari 1 sesi browser nyata berhasil ter-upload sebagai
      beberapa chunk berurutan ke R2, tersimpan di bawah prefix
      `user-activity-tracking/`. **Tidak bisa diverifikasi di environment
      ini** — kredensial R2 (`R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`/dst)
      di `.env` lokal `enem-landing-account-api` kosong (belum ada akun
      Cloudflare R2 asli disetup untuk dev). Diverifikasi sejauh yang bisa
      diverifikasi tanpa kredensial asli: seluruh rantai berhasil sampai
      ke pemanggilan `S3Client.send(PutObjectCommand)` yang sebenarnya,
      gagal dengan error S3 SDK asli ("No value provided for input HTTP
      label: Bucket") — bukan error dari kode yang saya tulis. Begitu
      kredensial R2 asli diisi di `.env`, jalur ini seharusnya langsung
      bekerja tanpa perlu ubah kode.
- [x] Sampling rate benar-benar mengontrol persentase sesi yang direkam —
      diverifikasi: rate 100% menghasilkan `recordingSampled=true` selalu;
      rate 20% terhadap 50 sesi uji menghasilkan 12/50 (24%) tersampel,
      dalam toleransi statistik wajar untuk n=50.
- [ ] CMS bisa memutar ulang 1 sesi rekaman end-to-end. **Tidak bisa
      diverifikasi tanpa data rekaman asli di R2** (lihat poin di atas) —
      halaman replay (`app/pages/activity-tracking/sessions/[id].vue`)
      sudah dibangun (fetch chunk → `DecompressionStream('gzip')` →
      `rrweb-player`), CMS build sukses, tapi belum ada rekaman sungguhan
      untuk dites putar ulang.
- [x] Job retensi menghapus chunk + object R2 yang lebih tua dari window
      retensi — diverifikasi lewat unit test (`pruneOldRecordings`: hapus
      row+object saat delete R2 sukses, **tetap simpan row** saat delete
      R2 gagal supaya dicoba lagi run berikutnya alih-alih kehilangan
      jejak object yang mungkin masih ada) dan endpoint manual trigger
      (`POST /tracking/recordings/prune`) yang jalan bersih di curl.
- [x] Toggle `sessionRecordingEnabled=false` menghentikan `rrweb.record()`
      sepenuhnya — `shouldRecordSession()` dicek SEBELUM `import('rrweb')`
      bahkan dipanggil, jadi library-nya sendiri tidak pernah dimuat kalau
      nonaktif, bukan cuma stop kirim data setelah proses rekam jalan.
- [x] Unit test `InternalApiGuard` (request tanpa key, key salah, key
      benar, dan kasus tambahan: `INTERNAL_API_KEY` tidak diset sama
      sekali di server).
- [x] `nx build` semua app yang tersentuh (`enem-landing-api`,
      `enem-landing-account-api`, `enem-landing-web`, `enem-landing-cms`)
      sukses.

## Status: SELESAI, dengan 1 gap lingkungan (2026-09-05)

Semua kode selesai, semua yang bisa diuji tanpa kredensial R2 asli sudah
diuji end-to-end. Dua acceptance criteria (upload rekaman nyata ke R2,
replay end-to-end) tidak bisa divalidasi penuh karena `.env` lokal
`enem-landing-account-api` belum punya kredensial Cloudflare R2 asli —
ini bukan sesuatu yang bisa diperbaiki dari sisi kode, perlu diisi oleh
user kalau mau divalidasi penuh.

Penyesuaian desain dari sketsa awal (dengan alasan):
- **Keputusan sampling dipindah ke server** (kolom `recordingSampled` di
  `TrackingSessionEntity`, di-roll sekali saat `createSession`), bukan
  cuma dipercayakan ke client — supaya bisa diverifikasi/diaudit dan
  di-gate ulang saat chunk masuk (defense in depth), bukan cuma
  "dipercaya" client sudah roll dengan benar.
- **Gzip dilakukan di server** (`enem-landing-api`, pakai `zlib` bawaan
  Node), bukan di browser — menghindari kebutuhan `CompressionStream` API
  di client (dukungan browser lebih terbatas) sambil tetap dapat manfaat
  kompresi sebelum tersimpan di R2.
- **Upload internal jadi controller terpisah** (`InternalUploadsController`
  di path `uploads/internal`), bukan nambah guard kedua di controller
  upload yang sudah ada — karena `@UseGuards(JwtAuthGuard)` di controller
  itu levelnya class, bukan method, jadi guard tambahan akan di-AND-kan
  (butuh JWT DAN internal key sekaligus), bukan OR. Controller terpisah
  lebih simpel dan tidak berisiko mengubah perilaku upload yang sudah ada.
- **`r2Key` di rencana awal jadi `uploadId` + `url`** di
  `TrackingRecordingChunkEntity` — setelah cek kode `UploadsService`
  yang sebenarnya, ternyata field yang dibutuhkan untuk hapus record nanti
  adalah id baris `FileEntity` di `enem-landing-account-api` (dipakai
  `DELETE /uploads/internal/:id`), bukan R2 key mentah.
- **`sessionRecordingSampleRatePct` jadi public** (ikut di
  `GET /tracking/config`, bukan cuma admin-only settings) — koreksi dari
  catatan di Story 13 yang bilang public config "never" akan expose field
  admin-only baru. Alasannya BUKAN karena client butuh rate-nya untuk
  nge-roll sendiri (keputusan sampling sudah dipindah ke server, lihat
  poin pertama di atas) — client tidak pernah baca field ini sama sekali.
  Diekspos tetap karena bukan data sensitif, dan pakai 1 shape yang sama
  untuk config publik & settings admin lebih simpel daripada bikin tipe
  "public config" terpisah cuma untuk menyembunyikan 1 angka yang memang
  tidak rahasia.
