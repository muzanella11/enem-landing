# Story 17: Comprehensive SEO Optimization (Homepage & Technical SEO)

**Apps touched:** `enem-landing-web`

## Background

Audit dilakukan terhadap `apps/enem-landing-web` (satu-satunya app publik-facing,
Nuxt 4, single-page portfolio `index.vue` + layout `default.vue`) sebelum ada
perubahan apapun, sesuai permintaan user. Metode: baca source
(`nuxt.config.ts`, `app/pages/index.vue`, `app/layouts/default.vue`,
`app/components/*`, `public/robots.txt`, `public/sitemap.xml`,
`libs/shared/types/src/lib/seo-meta.ts` & `site-profile.ts`), plus build
`.output` dan curl langsung ke server yang dijalankan lokal untuk melihat
HTML `<head>` yang benar-benar di-render (bukan tebakan).

### Temuan arsitektur

- **Rendering**: Nuxt 4, SSR aktif (default, tidak di-override ke
  `ssr: false`), preset Nitro `node-server`. Konten SEO-critical (title, H1,
  bio, experience, portfolio, link) sudah ada di HTML awal dari server,
  Googlebot tidak bergantung pada client-side JS untuk melihat konten inti.
- **Struktur halaman**: benar-benar satu halaman (`index.vue`) dengan
  section berbasis anchor (`#experience`, `#portfolio`, `#about`,
  `#contact`) — bukan multi-route.
- **Sumber konten**: `experiences`, `site-profile`, `skills`, `seo-meta`
  di-fetch dari `enem-landing-api` lewat BFF routes
  (`server/api/**/index.get.ts`) yang dikelola dari `enem-landing-cms`.
  `public/experience.json` adalah file statis peninggalan lama, sudah tidak
  direferensikan di kode manapun (dead file).
- **SEO meta sudah dikelola dari CMS**: tabel `seo-meta` (`pageKey`,
  `title`, `description`, `ogImageUrl`) hanya punya satu baris relevan
  (`home`), di-edit lewat `enem-landing-cms`. `useSeoMeta`, canonical, dan
  JSON-LD `Person` sudah ada di `index.vue` — fondasinya sudah cukup baik,
  jadi story ini adalah pengayaan/pembenahan gap, bukan bangun dari nol.

### Rendered `<head>` aktual (dari curl ke build lokal, tanpa API/CMS jalan
sehingga fallback default yang terlihat)

```html
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Nurfirliana Muzanella</title>
...
<meta name="description" content="Hello, I'm Frontend Engineer. Combine the art of design with the art of programming.">
<meta property="og:title" content="Nurfirliana Muzanella">
<meta property="og:description" content="Hello, I'm Frontend Engineer. Combine the art of design with the art of programming.">
<link rel="canonical" href="https://muzanella.com/">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Person",...}</script>
```

`charset`/`viewport` sudah otomatis dari Nuxt (bukan gap). Yang **tidak**
muncul sama sekali: `og:image`, `og:url`, `og:type`, semua `twitter:*`,
dan schema `WebSite`.

### Prioritas temuan

**P0 (critical)** — tidak ada. Fondasi teknis (SSR, single H1, canonical,
robots.txt, sitemap.xml, semantic `<header>`/`<nav>`/`<main>`/`<footer>`)
sudah benar dan tidak ada yang memblokir crawling/indexing.

**P1 (high impact)**
1. Title tag homepage cuma "Nurfirliana Muzanella" — tidak menyebut role
   (Frontend Engineer / Full Stack Developer) padahal itu target keyword
   utama #2 di brief.
2. `og:image` tidak pernah muncul kalau `ogImageUrl` CMS kosong (tidak ada
   fallback), `og:url`, dan `og:type` tidak pernah di-set sama sekali →
   social share preview (WhatsApp/LinkedIn/Twitter) berpotensi tampil
   rusak/kosong.
3. Tidak ada meta `twitter:card`/`twitter:title`/`twitter:description`/
   `twitter:image` sama sekali.
4. Tidak ada asset image raster (PNG/JPG, idealnya 1200x630) yang memang
   diperuntukkan sebagai OG image — yang ada cuma `avataaars.svg` (SVG,
   umumnya tidak didukung sebagai `og:image` oleh Facebook/Twitter/LinkedIn
   crawler).

**P2 (medium impact)**
5. Structured data cuma `Person`, belum ada `WebSite`.
6. Logic SEO (`useSeoMeta` + canonical + JSON-LD) di-inline langsung di
   `index.vue`, canonical URL hardcode literal string — kalau nanti nambah
   halaman, ini harus disalin manual per halaman (risiko typo/inkonsisten).
7. `<img>` (avatar, cover portfolio, gallery modal) tidak punya atribut
   `width`/`height` eksplisit → potensi CLS kecil sebelum CSS selesai
   dimuat.
8. Halaman project individual (`/projects/nama-project`) belum ada —
   sesuai brief poin 10, perlu keputusan terpisah (lihat "Out of scope").

**P3 (nice to have)**
9. `public/experience.json` adalah dead file, tidak dipakai kode manapun —
   bisa jadi noise minor saat crawl.
10. Tidak ada halaman 404 custom (default Nuxt sudah mengembalikan status
    404 yang benar untuk route tak dikenal — jadi ini murni kosmetik,
    bukan bug SEO).
11. Anchor text link project pakai URL mentah ("Link to app: https://...")
    — bisa lebih deskriptif, tapi bukan pola "click here" yang buruk.

## Goal

Menaikkan technical SEO, on-page SEO, dan social-sharing readiness
homepage `muzanella.com` tanpa mengubah desain, fitur, atau menambah
blog/halaman blog, fokus ke gap P1 dan sebagian P2 di atas.

## Kenapa

Fondasi SSR/canonical/robots/sitemap sudah benar, tapi gap di title,
Open Graph, Twitter Card, dan structured data `WebSite` membuat homepage
kurang optimal saat: (a) Google menampilkan snippet pencarian untuk query
nama + role, (b) link di-share ke WhatsApp/LinkedIn/Twitter (preview bisa
kosong/rusak karena `og:image` tidak pernah ter-set).

## Scope

### Metadata & title (P1 #1, P2 #6-7)
- Update `DEFAULT_SEO` fallback di `index.vue` supaya title menyebut nama
  + role secara natural (mis. "Nurfirliana Muzanella - Frontend Engineer &
  Full Stack Developer"), tanpa keyword stuffing.
- Tambahkan `og:url` (samakan dengan canonical) dan `og:type: website` ke
  `useSeoMeta`.
- Tambahkan `width`/`height` (atau `aspect-ratio` via class Tailwind yang
  sudah ada) ke `<img>` avatar, cover portfolio, dan gallery modal.
- Evaluasi ekstrak logic SEO (`useSeoMeta` + canonical + JSON-LD) jadi
  composable kecil (`useSeoMeta` custom / `usePageSeo`) — **hanya kalau
  tidak menambah kompleksitas berarti untuk single-page app ini**; kalau
  cost/benefit tidak jelas untuk 1 call-site, cukup rapikan inline dan
  catat sebagai rekomendasi utk kalau nanti ada halaman project (lihat Out
  of scope) — keputusan final saat implementasi, bukan dipaksakan di sini.

### Open Graph & Twitter Card (P1 #2-4)
- Siapkan 1 asset image raster (PNG/JPG, ukuran ~1200x630) sebagai OG image
  default — pakai asset yang sudah ada (`enem.png` atau avatar) sebagai
  basis kalau memungkinkan tanpa bikin gambar baru dari nol; kalau tidak
  ada yang cocok, minta user siapkan 1 file (bukan generate AI image).
- `og:image` fallback ke asset ini kalau `ogImageUrl` dari CMS kosong.
- Tambahkan `twitter:card` (`summary_large_image`), `twitter:title`,
  `twitter:description`, `twitter:image` — nilainya konsisten dengan OG.

### Structured data (P2 #5)
- Tambahkan JSON-LD `WebSite` (nama, url) berdampingan dengan `Person`
  yang sudah ada — data yang benar-benar tersedia saja, tidak mengarang
  informasi.

### Cleanup minor (P3 #9)
- Hapus `public/experience.json` (dead file, tidak direferensikan kode
  manapun — dikonfirmasi lewat grep sebelum dihapus).

## Out of scope (butuh keputusan terpisah dari user, tidak dikerjakan di
story ini)

- **Halaman project individual** (`/projects/nama-project`, brief poin 10)
  — perlu keputusan produk (apakah konten tiap project di CMS sudah cukup
  dalam untuk halaman berdiri sendiri, atau berisiko jadi thin content).
  Bukan bagian dari "jangan buat blog", tapi tetap perubahan struktur/fitur
  yang lebih besar — didiskusikan terpisah sebelum dibangun.
- **Update konten SEO Meta di database CMS** (title/description aktual
  untuk row `home`) — itu data, dikelola lewat UI `enem-landing-cms`, bukan
  perubahan kode. Story ini hanya membenahi *fallback default* dan
  *mekanisme* (OG/Twitter/structured data), user disarankan cek & lengkapi
  isi row `seo-meta` "home" lewat CMS setelah story ini selesai.
- Halaman 404 custom, redesign visual, `@nuxt/image`/format modern
  otomatis untuk gambar upload CMS — dicatat sebagai rekomendasi
  next-step, di luar scope perubahan minimal story ini.
- Blog/halaman blog — eksplisit tidak boleh, dikerjakan terpisah oleh
  user.

## Acceptance Criteria

- [x] Title tag homepage (fallback default) menyebut nama + role secara
      natural, satu H1 tetap dipertahankan.
- [x] `og:image`, `og:url`, `og:type` selalu ter-render (fallback ke asset
      lokal kalau CMS kosong), `og:image` absolute URL sesuai spec.
- [x] `twitter:card`/`twitter:title`/`twitter:description`/`twitter:image`
      ter-render dan konsisten dengan OG.
- [x] JSON-LD `WebSite` valid di samping `Person` yang sudah ada
      (diverifikasi lewat curl ke build lokal, bukan cuma baca kode).
- [x] `<img>` avatar punya `width`/`height` eksplisit (240x240, sesuai
      crop `rounded-full`). Cover portfolio & gallery modal **tidak**
      ditambah `width`/`height` — sudah dikonstrain penuh oleh Tailwind
      (`h-52`/`h-64` + `w-full`/`w-auto`), jadi atribut dimensi di situ
      tidak menambah proteksi CLS apapun (lihat catatan implementasi di
      bawah).
- [x] `public/experience.json` dihapus (dikonfirmasi dead file, tidak
      direferensikan kode manapun sebelum dihapus), build tetap sukses.
- [x] `nx build enem-landing-web` sukses, `nx lint enem-landing-web` 0
      error (8 warning pre-existing, tidak terkait perubahan ini),
      `nx e2e enem-landing-web-e2e` 3/3 lulus (termasuk `seo-meta.spec.ts`
      yang di-update ke fallback title/description baru).
- [x] Tidak ada perubahan desain/branding/UI — hanya metadata `<head>`,
      2 atribut `width`/`height`, dan penghapusan file statis yang tidak
      pernah dirender.

## Status: SELESAI (2026-09-07)

Semua item scope P1 + sebagian P2 dikerjakan. Detail implementasi:

- `DEFAULT_SEO` di `index.vue`: title jadi "Nurfirliana Muzanella -
  Frontend Engineer & Full Stack Developer", description menyebut role +
  Vue.js + Indonesia secara natural (satu kalimat, tidak stuffing).
- `og:image`/`twitter:image` fallback ke asset baru
  `libs/frontend/src/assets/images/og-image.png` (dipublish ke
  `/og-image.png` lewat `nitro.publicAssets` yang sudah ada) — **bukan
  gambar baru**, hasil crop+resize (1200x630, via `sips`, tanpa generative
  AI) dari `enem.png` yang sudah ada di repo tapi sebelumnya tidak
  dipakai di manapun. Semua URL og:image/twitter:image dibuat absolute
  (`https://muzanella.com/og-image.png`), bukan relative path — relative
  path awalnya salah dicoba, ketauan pas verifikasi manual, diperbaiki
  sebelum lint/test.
- `og:url`, `og:type: website`, dan 4 meta `twitter:*` ditambahkan ke
  `useSeoMeta()` call yang sudah ada.
- JSON-LD `WebSite` ditambahkan berdampingan dengan `Person` (2 script
  tag terpisah). Nama di kedua schema diperbaiki ke literal
  "Nurfirliana Muzanella" (sebelumnya field `name` Person JSON-LD ikut
  memakai `DEFAULT_SEO.title` yang sekarang sudah termasuk suffix role —
  tidak sesuai untuk field `name` sebuah `Person`).
- Composable ekstraksi (`usePageSeo`) **tidak dibuat** — dievaluasi sesuai
  catatan di Scope, tapi untuk 1 call-site (halaman ini satu-satunya
  halaman) itu jadi abstraksi prematur tanpa manfaat nyata. Tetap dicatat
  sebagai rekomendasi kalau nanti ada halaman project individual (lihat
  Out of scope).
- Verifikasi dilakukan dengan build asli (`nx build`) + jalankan
  `.output/server/index.mjs` + curl langsung ke HTML yang di-render, bukan
  cuma baca kode — semua tag head dikonfirmasi via output curl.

Tidak ada regresi ditemukan: lint 0 error, e2e 3/3 lulus (spec
`seo-meta.spec.ts` di-update untuk fallback baru).

Rekomendasi follow-up (di luar scope story ini, lihat juga "Out of
scope"): update konten row `seo-meta` "home" di CMS (title/description
aktual, `ogImageUrl` custom kalau mau override asset default), dan
keputusan terpisah soal halaman project individual.
