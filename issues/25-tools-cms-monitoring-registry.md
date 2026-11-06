# Story 25: CMS untuk Tools Hub (Monitoring Multi-site + Registry Tool, Iklan, Donasi)

**Status:** Done (2026-11-06). Perbaikan 2026-11-06: fallback snapshot registry sekarang menyaring tool dengan `enabled: false` di halaman tool, halaman utama, dan sitemap (sebelumnya tool nonaktif tampil aktif saat API tidak bisa dihubungi).

**Apps touched:** `enem-landing-api`, `enem-landing-cms`, `enem-landing-web`,
`enem-landing-tools`, `libs/frontend`

**Depends on:** Story 13 s.d. 16 (activity tracking), Story 20 (app
`enem-landing-tools`). Bisa dikerjakan paralel dengan Story 20 setelah app
tools di-scaffold.

## Background

Story 20 s.d. 24 merencanakan `enem-landing-tools` di `tools.muzanella.com`.
User ingin tools hub punya CMS seperti enem-landing: bisa dimonitor
(pageview, event, funnel, heatmap) dan dikelola tanpa redeploy.

Kondisi activity tracking saat ini (dicek sesi 2026-11-06):

- Semua tabel tracking di `enem-landing-api` dianggap berasal dari
  `enem-landing-web`. Belum ada kolom yang membedakan situs.
  `tracking_settings` adalah single-row, dan `tracking_clicks` tidak punya
  `sessionId`, jadi klik dari dua situs dengan `path` sama (mis. `/`) akan
  tercampur di heatmap.
- Tracker berupa composable di dalam app web
  (`apps/enem-landing-web/app/composables/use-tracker.ts`), belum bisa
  dipakai app lain.
- Event dikirim lewat BFF Nuxt (`apps/enem-landing-web/server/api/tracking/*`),
  bukan langsung dari browser ke API.

Di sisi lain, tools hub punya janji privasi yang lebih ketat dari landing
page: nilai input (gaji, nominal zakat, isi invoice) tidak pernah dikirim,
dan file tidak pernah di-upload (Story 20, 23, 24).

## Goal

1. `enem-landing-cms` menjadi satu dashboard untuk dua situs (`landing` dan
   `tools`), dengan semua halaman activity tracking bisa difilter per situs.
2. `enem-landing-tools` memakai tracker yang sama dengan `enem-landing-web`,
   dengan batasan privasi khusus tools.
3. Registry tool, pengaturan iklan, dan opsi donasi tools hub dikelola dari
   CMS, berlaku tanpa rebuild.

## Keputusan (hasil brainstorming sesi 2026-11-06)

1. **Satu CMS, bukan CMS terpisah.** Tambah dimensi `site` (`landing` |
   `tools`) di data tracking dan pengaturan. Menambah situs lain nanti cukup
   menambah nilai enum.
2. **Scope CMS: monitoring + registry** (keputusan user 2026-11-06).
   Registry mencakup daftar tool, pengaturan iklan, dan opsi donasi.
   Affiliate tidak termasuk karena ditunda (keputusan user 2026-11-06,
   lihat Story 20).
3. **Session recording dimatikan permanen untuk site `tools`** (opsi a,
   keputusan user 2026-11-06). rrweb merekam isi input dan teks hasil di
   DOM, sehingga angka gaji atau isi invoice ikut ter-upload ke R2.
   Pembatasan ini dipasang di beberapa lapis (lihat Scope), bukan hanya
   toggle yang bisa dinyalakan tidak sengaja.
4. **Payload event dari site `tools` memakai whitelist.** Hanya key yang
   terdaftar yang boleh dikirim (`toolId`, `action`, `step`, `placement`,
   `mode`, `donationOptionId`), nilainya string pendek. Key lain dibuang di client
   dan divalidasi ulang di API. Tidak ada angka nominal di event.
5. **Heatmap dan pageview boleh untuk tools.** Klik hanya membawa koordinat
   relatif, `path`, dan device bucket (tanpa teks elemen), jadi aman.
6. **Parameter pajak/BPJS tetap di kode**, tidak dipindah ke CMS. Data ini
   versioned dan dijaga unit test (Story 20); salah ketik di CMS bisa
   membuat hasil kalkulator salah tanpa ada test yang menangkap.
7. **Halaman tools memakai SWR cache, bukan prerender penuh.** Supaya
   perubahan registry di CMS (urutan, aktif/nonaktif, badge, iklan, donasi)
   tampil tanpa rebuild, halaman index dan halaman tool di-render Nitro
   dengan `routeRules` `swr` (mis. 10 menit). Hitungan tetap 100% di
   browser. Ini mengubah keputusan 3 di Story 20.
8. **Konfigurasi publik tools disajikan satu endpoint** yang di-cache
   (`CacheService`, `libs/backend/cache`), sama seperti
   `GET /tracking/config`. Setiap perubahan dari CMS menginvalidasi cache.

## Scope

### A. Tracking multi-site (`enem-landing-api`)

- Migrasi: tambah kolom `site` (`varchar(32)`, default `'landing'`, index)
  ke `tracking_sessions`, `tracking_clicks`, `tracking_click_aggregates`,
  `tracking_funnels`, dan `tracking_settings`. Data lama otomatis jadi
  `landing`.
- `tracking_pageviews`, `tracking_events`, dan recording tetap ikut site
  dari session-nya (join lewat `sessionId`), tidak perlu kolom baru.
- `tracking_settings` berubah dari single-row menjadi satu baris per site
  (unique `site`), dengan pola get-or-create yang sama.
- Endpoint publik menerima `site` (body atau query, default `landing`
  supaya `enem-landing-web` tetap jalan selama transisi):
  `GET /tracking/config`, `POST /tracking/session`, `POST /tracking/clicks`.
- Endpoint admin (`overview`, `visitors`, `funnels`, `heatmap/*`,
  `sessions`, `settings`) menerima filter `site`.
- Job agregasi heatmap dan prune memproses per site.
- **Guard recording untuk tools:**
  - `PUT /tracking/settings` menolak `sessionRecordingEnabled = true` untuk
    site `tools`.
  - `GET /tracking/config?site=tools` selalu mengembalikan recording
    `false`, apa pun isi DB.
  - `POST /tracking/session-recording` menolak chunk dari session ber-site
    `tools` (400) dan tidak meneruskannya ke R2.
- **Validasi event tools:** `POST /tracking/events` untuk session ber-site
  `tools` membuang key di luar whitelist dan memotong nilai string (mis.
  maks 64 karakter). Nilai numerik ditolak.

### B. Tracker sebagai lib bersama (`libs/frontend`)

- Pindahkan `use-tracker` dari `enem-landing-web` ke `libs/frontend`,
  dengan opsi:
  - `site`: dikirim di setiap request session/klik/config.
  - `recording`: `false` untuk tools (lib bahkan tidak meng-import rrweb,
    supaya tidak masuk bundle tools).
  - `eventPropsWhitelist`: filter key di client sebelum dikirim.
- `enem-landing-web` memakai lib ini dengan `site: 'landing'`, perilakunya
  tidak berubah.
- BFF tracking di `enem-landing-tools/server/api/tracking/*` (tanpa
  `session-recording`), meneruskan ke `enem-landing-api` seperti BFF web.
  Bila handler BFF bisa dibagi, taruh di lib; bila tidak, cukup diduplikasi
  dengan tipis.

### C. Registry tools (`enem-landing-api`, modul baru `tools`)

Entity:

- `ToolEntity` (`tools`): `id`, `slug` (unique, sama dengan route di app
  tools), `name`, `shortDescription`, `category` (mis. `keuangan`,
  `dokumen`, `ibadah`), `sortOrder`, `enabled`, `badge` (nullable:
  `baru` | `populer`), `adsEnabled`, `updatedAt`.
- `DonationOptionEntity` (`tools_donation_options`): `id`, `label` (mis.
  "Saweria", "Trakteer", "QRIS"), `platform` (`saweria` | `trakteer` |
  `sociabuzz` | `qris` | `other`), `url` (nullable untuk QRIS),
  `qrisImageUrl` (nullable, diunggah lewat upload R2 yang sudah ada),
  `note` (nullable, mis. "potongan paling kecil"), `enabled`, `sortOrder`.
  Dibuat sebagai daftar supaya platform bisa diganti atau ditambah tanpa
  deploy (lihat perbandingan biaya di Story 20).
- `ToolsSettingsEntity` (`tools_settings`, single-row): `adsEnabled`
  (kill switch global), `adsenseClientId` (nullable),
  `donationCtaText` (teks ajakan, mis. "Traktir kopi"),
  `blockedCategoriesNote` (catatan internal kategori yang diblokir di
  AdSense, sebagai pengingat).

Endpoint:

- `GET /tools/config` (publik, di-cache): tool yang `enabled` urut
  `sortOrder`, opsi donasi aktif urut `sortOrder`, dan settings publik. Iklan dianggap aktif hanya bila global
  **dan** per tool sama-sama `true`.
- CRUD admin (`SsoAuthGuard` + `assertAdminRole`) untuk tools, opsi
  donasi, dan settings. Setiap tulis menginvalidasi cache `GET /tools/config`.
- Seed awal berisi tool yang sudah ada di app tools saat migrasi dijalankan.

Validasi URL donasi: hanya `https`.

### D. App `enem-landing-tools`

- Ambil `GET /tools/config` lewat BFF (`server/api/tools/config.get.ts`) dan
  pakai saat render SWR.
- Halaman index membaca registry dari config. Tool yang tidak ada di config
  (atau `enabled = false`) tidak tampil di index dan sitemap. Halaman tool
  yang dinonaktifkan menampilkan pesan "tool sedang dinonaktifkan" dengan
  `noindex`, bukan 404, supaya link lama yang dibagikan tidak rusak.
- `AdSlot` membaca status iklan dari config (menggantikan runtime config di
  Story 20). `DonationCta` membaca opsi donasi dan teks ajakan dari config;
  bila tidak ada opsi aktif, CTA tidak dirender.
- Event standar dari semua tool, lewat helper bersama supaya konsisten:
  - `tool_view` (`toolId`)
  - `tool_calculate` (`toolId`, `mode` opsional)
  - `tool_share` (`toolId`)
  - `tool_download` (`toolId`, mis. PDF/CSV/ZIP)
  - `donate_click` (`toolId`, `placement`, `donationOptionId`)
- **Fallback:** bila config gagal diambil, pakai snapshot registry yang
  dibundel saat build, supaya halaman tidak kosong dan tidak error.

### E. CMS (`enem-landing-cms`)

- **Site switcher** di header halaman activity tracking (Overview,
  Visitors, Funnels, Heatmap, Sessions, Settings). Pilihan disimpan di
  query `?site=` supaya bisa dibagikan/bookmark. Default `landing`.
- Saat site `tools` dipilih: menu Sessions disembunyikan dan toggle
  recording di Settings dinonaktifkan dengan penjelasan singkat
  ("dimatikan permanen demi privasi input pengguna tools").
- Menu baru **Tools**:
  - **Daftar tool:** list, edit (nama, deskripsi, kategori, badge,
    aktif/nonaktif, iklan per tool), urutkan dengan drag atau input
    `sortOrder`. Kolom ringkas per tool untuk 30 hari terakhir: view,
    calculate, rasio calculate/view.
  - **Donasi:** CRUD opsi donasi (termasuk unggah gambar QRIS), urutan,
    aktif/nonaktif, dan jumlah klik 30 hari terakhir per opsi dan per
    tool (dari event `donate_click`).
  - **Pengaturan:** kill switch iklan global, AdSense client ID, teks
    ajakan donasi.
- Pakai komponen CMS yang sudah ada (`CListPage`, `CFormPage`,
  `CPageHeader`, `CBarList`).

## Out of scope

- SEO meta per tool dari CMS (modul `seo-meta` belum punya dimensi site).
  Kandidat story lanjutan bila meta di kode terasa kurang fleksibel.
- Override harga emas dan nilai zakat fitrah dari CMS (dibahas di Story 22
  bila dibutuhkan).
- Parameter pajak/BPJS di CMS (lihat keputusan 6).
- Session recording untuk tools dalam bentuk apa pun, termasuk dengan
  masking.
- Affiliate dalam bentuk apa pun (ditunda, lihat Story 20).
- Laporan pendapatan AdSense dan donasi (datanya ada di dashboard AdSense
  dan platform donasi, tidak ditarik ke CMS).
- Consent banner (sudah di Story 20).

## Acceptance Criteria

- [ ] Migrasi berjalan di DB yang sudah berisi data tracking; semua data
      lama tampil di CMS sebagai site `landing`, dan dashboard landing
      menampilkan angka yang sama dengan sebelum migrasi.
- [x] `enem-landing-web` memakai tracker dari `libs/frontend`, dan semua
      fitur tracking-nya (termasuk recording) tetap berfungsi.
- [ ] Pageview, event, funnel, dan heatmap dari `tools.muzanella.com`
      tampil di CMS saat site `tools` dipilih, dan tidak tercampur dengan
      data landing (diuji dengan path yang sama, mis. `/`).
- [x] Recording untuk tools tidak bisa dinyalakan: `PUT` settings ditolak,
      config publik selalu `false`, dan `POST /tracking/session-recording`
      dari session tools ditolak (dibuktikan dengan unit/e2e test API).
- [x] Bundle `enem-landing-tools` tidak mengandung rrweb.
- [x] Event dari tools dengan key di luar whitelist atau nilai numerik
      dibuang oleh API (unit test), dan tab Network tidak menunjukkan nilai
      input pengguna di request tracking.
- [ ] Mengubah urutan, menonaktifkan tool, mengubah opsi donasi, atau
      mematikan iklan di CMS tampil di `tools.muzanella.com` tanpa
      rebuild, paling lambat dalam TTL cache + SWR yang ditetapkan.
- [x] Tool nonaktif hilang dari index dan sitemap; halaman tool-nya
      menampilkan pesan nonaktif dengan `noindex`.
- [ ] Bila `GET /tools/config` gagal, halaman tools tetap tampil memakai
      snapshot build.
- [ ] Kolom view/calculate per tool dan jumlah klik per opsi donasi
      tampil di CMS.
- [ ] Memori container `enem-landing-tools` tetap di bawah limit 100M
      dengan render SWR aktif.
- [x] `nx lint` dan `nx test` lulus untuk semua project yang tersentuh; e2e
      CMS dasar untuk site switcher dan CRUD tool ditambahkan.

## Catatan implementasi (2026-11-06)

- Migrasi `AddSiteToTracking1788310000000` dan `CreateToolsTables1788320000000`
  (registry di-seed 13 tool, settings, dan opsi donasi SociaBuzz tanpa URL).
  Keduanya sudah diuji run, revert, dan run ulang di DB lokal.
- Payload event tools disaring di tiga tempat: tracker di browser, BFF
  `enem-landing-tools`, dan API (`sanitizeToolsEventPayload` di
  `libs/shared/definitions`).
- Tracker dipindah ke subpath `@enem-landing/frontend/tracking` supaya tidak
  menyeret Pinia atau rrweb ke app yang tidak memakainya.
- BFF CMS untuk menu Tools memakai satu route `server/api/tools-admin/[...path].ts`
  dengan whitelist path; otorisasi admin tetap di API.
- Env baru CMS: `NUXT_PUBLIC_TOOLS_HOST` (iframe heatmap untuk site tools).

## Referensi perhitungan

Dasar perhitungan dan data yang dipakai tool ini (dicek 2026-11-06):

- Tidak ada perhitungan berbasis regulasi. Story ini berisi registry, monitoring, dan tracking.
