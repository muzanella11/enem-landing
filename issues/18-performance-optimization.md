# Story 18: Performance Optimization (PageSpeed Insights Follow-up)

**Depends on:** 17 (SEO Optimization)
**Apps touched:** `enem-landing-web`

## Background

User membagikan hasil PageSpeed Insights untuk `https://muzanella.com/`
(laporan 7 Sep 2026, dites langsung di browser terhadap situs production,
bukan build lokal — jadi mencerminkan versi yang sudah live, sebelum
perubahan Story 17 di-deploy).

### Skor aktual

| Kategori | Mobile | Desktop |
|---|---|---|
| Performa | **78** | **96** |
| Aksesibilitas | 100 | 100 |
| Praktik Terbaik | 100 | 100 |
| SEO | 100 | 100 |

Aksesibilitas/Praktik Terbaik/SEO sudah 100/100 di kedua form factor —
mengonfirmasi kerja Story 17 sudah kepakai (skor SEO 100 baru muncul
setelah itu). Gap yang tersisa murni di kategori **Performa**, terutama
mobile (throttle 4G lambat + CPU emulasi Moto G Power — jauh lebih ketat
dari desktop).

### Temuan performa (mobile, root cause per item)

1. **Permintaan pemblokiran render — ~820 md**: stylesheet Google Fonts
   (`fonts.googleapis.com/css2?...`, 750 md) dan CSS entry Nuxt
   (`entry.CHsCliJr.css`, 210 md) sama-sama render-blocking. Google Fonts
   adalah porsi terbesar dan satu-satunya yang bisa dibuat non-blocking
   tanpa mengubah apapun secara visual.
2. **LCP 3,3 dtk** — elemen LCP adalah avatar hero (`/avataaars.svg`).
   Breakdown: TTFB 370 md, **resource load delay 1.420 md**, resource
   load duration 1.290 md, **render delay 1.420 md**. Delay besar di load
   & render sebagian besar disebabkan parser/browser masih sibuk dengan
   request render-blocking (poin 1) sebelum sempat memprioritaskan
   gambar LCP.
3. **Elemen gambar tanpa `width`/`height` jelas** — flag persis di avatar
   (`<img src="/avataaars.svg" ... class="w-48 lg:w-60 ...">`). **Ini
   sudah diperbaiki di Story 17** (`Masthead.vue`, `width="240"
   height="240"`) tapi belum ter-deploy ke production saat laporan ini
   diambil — akan otomatis resolve begitu Story 17 di-deploy, tidak perlu
   kerjaan tambahan di story ini.
4. **Durasi cache kurang efisien — ~7 KiB**: `/avataaars.svg` (first-party,
   `muzanella.com`) cuma di-cache 4 jam. Sisanya (`beacon.min.js` dari
   Cloudflare, `cloudflare-static/email-decode.min.js`) adalah resource
   pihak ketiga/infra Cloudflare, di luar kendali kode aplikasi ini.
5. **JavaScript versi lama — 11 KiB**: 100% berasal dari
   `beacon.min.js` (`static.cloudflareinsights.com`) — polyfill
   `Array.prototype.at`/`findLast` yang di-inject Cloudflare, bukan kode
   aplikasi. Tidak ada yang bisa diperbaiki dari sisi `enem-landing-web`.
6. **Perubahan posisi/geometri paksa (forced reflow) — ~1.011 md**:
   sumbernya "[tanpa atribut]" di laporan (kemungkinan skrip pihak
   ketiga atau internal Vue/Nuxt saat hydration) — tidak bisa dipetakan
   dengan yakin ke baris kode spesifik di app ini, jadi dicatat sebagai
   observasi, bukan item yang diperbaiki langsung.
7. **Main-thread work 3,1 dtk**: sebagian besar biaya hydration SPA
   (satu halaman, satu bundle). Mengurangi ini butuh perubahan arsitektur
   (mis. lazy/deferred hydration section di bawah fold) yang berisiko
   regresi interaksi (nav scroll-spy, portfolio modal, contact form) —
   di luar scope perubahan minimal story ini, dicatat sebagai rekomendasi.
8. **"Penjelajahan Agentic" 2/3**: kategori baru PageSpeed Insights
   (kesiapan untuk crawler agentic/LLM) — bukan metrik SEO/performa
   klasik, tidak diselidiki di story ini kecuali user memang ingin fokus
   ke situ (bisa jadi story terpisah).

### Prioritas

**P1**: render-blocking Google Fonts (item 1) — root cause terbesar,
terukur, aman diperbaiki tanpa mengubah desain.

**P2**: cache TTL `/avataaars.svg` (item 4, bagian first-party saja).

**Tidak dikerjakan di story ini** (di luar kendali kode / butuh keputusan
terpisah): item 5, 6 (third-party/infra Cloudflare), item 7 (perubahan
arsitektur signifikan), item 8 (kategori baru, bukan permintaan asli
user).

## Goal

Menaikkan skor Performa PageSpeed Insights (terutama mobile) dengan
memperbaiki root cause yang benar-benar berasal dari kode
`enem-landing-web`, tanpa mengubah desain/fitur.

## Scope

- `nuxt.config.ts`: ubah `<link rel="stylesheet">` Google Fonts jadi pola
  non-blocking standar (`rel="preload" as="style"` + `onload` swap ke
  `rel="stylesheet"`) — mengikuti rekomendasi resmi web.dev untuk kasus
  ini, tidak mengubah font/tampilan apapun.
- `nitro.routeRules` (`nuxt.config.ts`): set `Cache-Control` yang lebih
  panjang untuk asset statis first-party yang di-publish lewat
  `publicAssets` (`/avataaars.svg`, `/favicon.ico`, `/enem.png`,
  `/og-image.png`) — asset ini di-commit ke repo, jarang berubah, aman
  di-cache lama.

## Out of scope

- Perubahan third-party/infra Cloudflare (Web Analytics beacon, email
  obfuscation) — keputusan akun Cloudflare, bukan kode.
- Lazy/deferred hydration untuk kurangi main-thread work — perubahan
  arsitektur lebih besar, berisiko ke interaksi yang sudah jalan.
- Kategori "Penjelajahan Agentic" — bukan bagian dari permintaan SEO/
  performa yang diminta, didiskusikan terpisah kalau memang diinginkan.

## Acceptance Criteria

- [x] Google Fonts stylesheet tidak lagi render-blocking (pola
      `preload` + `onload` swap ke `stylesheet`, dikonfirmasi lewat curl
      ke build lokal). Verifikasi ulang skor PSI sungguhan butuh redeploy
      ke production dulu (di luar kendali sesi ini).
- [x] `/avataaars.svg`, `/favicon.ico`, `/enem.png`, `/og-image.png`
      punya `Cache-Control: public, max-age=31536000, immutable`
      (dikonfirmasi lewat curl -I ke build lokal).
- [x] Tidak ada regresi visual (font tetap Lato/Montserrat, avatar tetap
      tampil normal — dicek lewat browser).
- [x] `nx build enem-landing-web` sukses, lint 0 error (termasuk 8
      warning `vue/html-self-closing` pre-existing yang ikut dirapikan,
      lihat catatan di bawah), `nx build`/`lint` bersih.

## Status: SELESAI, minus 1 item di luar kendali sesi ini (2026-09-07)

Implementasi:

- `nuxt.config.ts`: Google Fonts stylesheet diubah dari
  `<link rel="stylesheet">` blocking jadi pola non-blocking standar
  (`rel="preload" as="style"` + `<link rel="stylesheet" media="print"
  onload="this.media='all'">`) — tidak mengubah font/tampilan.
- `nuxt.config.ts`: `nitro.routeRules` ditambahkan untuk 4 asset statis
  first-party (avatar, favicon, `enem.png`, OG image) dengan
  `Cache-Control` 1 tahun immutable — semuanya asset yang di-commit ke
  repo, cuma berubah lewat deploy baru, aman di-cache lama.

Temuan tambahan di luar rencana awal (dikerjakan atas permintaan user
"fix warning tersebut" setelah lint menunjukkan 8 warning
`vue/html-self-closing` pre-existing yang sempat tampak lagi saat
verifikasi): root cause-nya `eslint-config-prettier` ada sebagai
dependency tapi tidak pernah di-wire ke config flat manapun di
monorepo ini, jadi rule stylistic `vue/html-self-closing` bawaan
`@nuxt/eslint-config` (void: 'never') bentrok dengan output asli
Prettier untuk .vue (yang selalu self-closing void element). Sempat
dicoba `eslint --fix` lalu `prettier --write` — hasilnya prettier
mengembalikan lagi ke `/>` (membuktikan konflik ini nyata, bukan
salah baca). Perbaikan yang diambil: set opsi rule
`vue/html-self-closing` di `apps/enem-landing-web/eslint.config.mjs`
supaya cocok dengan gaya Prettier (`void: 'always'`) — scoped ke app
ini saja, bukan ubah `eslint-config-prettier` di root yang akan
mempengaruhi semua app di monorepo tanpa direview dulu dampaknya ke
app lain.

Verifikasi e2e: sempat menemukan 8 test gagal (`contact-form.spec.ts`
di semua browser + beberapa test firefox lain) saat `nx e2e`. Dikonfirmasi
dulu **bukan regresi dari story ini** (`git stash` perubahan story ini,
kegagalannya identik persis dengan atau tanpa perubahan). Root cause
sungguhan: migration `AddIspToTrackingSessions1788290000000`
(`apps/enem-landing-api/src/database/migrations/1788290000000-...ts`,
ditambahkan bersamaan dengan commit `efe1b55` "feat: add visitor IP and
geolocation detail to activity tracking") belum pernah dijalankan di
database lokal environment sesi ini — bukan bug kode, DB dev yang
tertinggal. Akibatnya `POST /tracking/session` selalu 500 ("Unknown
column 'isp' in 'field list'"), dan itu merusak render halaman lewat
plugin `tracking.client.ts` sehingga form contact (dan konten lain)
tidak ditemukan Playwright di semua browser. Dijalankan
`yarn nx run enem-landing-api:migration:run` — setelah itu **15/15 e2e
lulus, dicoba 2x berturut-turut, hasil konsisten**. Tidak ada perubahan
kode untuk ini, murni katch-up migration DB lokal.

**Belum bisa diverifikasi** (butuh redeploy production): re-run
PageSpeed Insights sungguhan setelah Story 17 + 18 live, untuk
konfirmasi skor Performa mobile naik dari 78 dan item "Elemen gambar
tanpa width/height" hilang.
