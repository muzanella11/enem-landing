# SEO Content Plan: muzanella.com Blog

This batch covers 8 articles across 5 topic clusters, chosen to match the author's demonstrated
expertise (Frontend Engineer / Full Stack JavaScript Developer) rather than broad, highly
competitive keywords. None of these claim guaranteed search rankings: the goal is topical
authority and long-tail search intent coverage that compounds as more articles are published.

## Article Table

| Article | Primary Keyword | Search Intent | Secondary Keywords | Cluster | Priority |
|---|---|---|---|---|---|
| [Docker Fundamentals for Node.js Developers](fundamental-docker/fundamental-docker.md) | docker for node.js developers | Informational: learn core Docker concepts (image/container/network/volume) specifically in a Node.js context | dockerize node.js app, docker image vs container explained, docker node.js best practices | Docker / DevOps | 1 |
| [Docker Compose for Node.js Development Environments](docker-compose-nodejs/docker-compose-nodejs.md) | docker compose node.js development | Informational/practical: set up a multi-container local dev stack (app + db + cache) | docker compose node.js postgres redis, docker compose live reload node, docker compose bind mount node_modules | Docker / DevOps | 2 |
| [Node.js Environment Variables: A Practical Guide to Configuration Management](nodejs-environment-variables/nodejs-environment-variables.md) | node.js environment variables | Informational/practical: structure and validate config instead of raw process.env reads | node.js configuration management, process.env validation, typed config node.js | Node.js / Backend | 1 |
| [How to Structure a NestJS Project with TypeScript](nestjs-project-structure/nestjs-project-structure.md) | nestjs project structure | Practical/how-to: organize a growing NestJS codebase correctly | nestjs typescript architecture, nestjs feature module pattern, nestjs controller service repository | Node.js / Backend | 2 |
| [Vue 3 Composition API: Practical Patterns for Real Projects](vue-3-composition-api-patterns/vue-3-composition-api-patterns.md) | vue 3 composition api patterns | Practical/how-to: decide between ref/reactive and watch/watchEffect correctly | vue 3 ref vs reactive, vue 3 watch vs watcheffect, vue composition api best practices | Vue / Frontend | 1 |
| [Building Reusable Vue Composables: A Practical Guide](vue-composables-guide/vue-composables-guide.md) | vue composables | Practical/how-to: extract genuinely reusable composables without shared-state bugs | vue 3 custom composables, vue composable best practices, reusable logic vue 3 | Vue / Frontend | 2 |
| [Nuxt 3 SEO: A Practical Guide to Meta Tags, Sitemaps, and Structured Data](nuxt-3-seo-guide/nuxt-3-seo-guide.md) | nuxt 3 seo | Practical/how-to: implement per-page SEO correctly (useSeoMeta, canonical, JSON-LD, sitemap) | nuxt useseometa, nuxt ssr seo, nuxt structured data json-ld, nuxt canonical url | Nuxt | 1 |
| [React useEffect: A Practical Guide to Dependency Arrays and Cleanup](react-useeffect-dependency-array/react-useeffect-dependency-array.md) | react useeffect dependency array | Practical/how-to: fix infinite loops and stale closures by understanding the Object.is comparison and cleanup lifecycle | react useeffect infinite loop, react useeffect stale closure, react useeffect cleanup function, react exhaustive-deps | React | 1 |

## Why These Keywords

Every primary keyword is a long-tail phrase with a clear, single search intent, deliberately
avoiding head terms like "Docker," "Node.js," or "Vue" alone, which are dominated by official
documentation and large-scale publishers and are not realistic targets for a personal portfolio
site. Each keyword also maps to a real, specific problem a developer searches for while working
(not a definitional "what is X" query), which is what the content actually answers.

## Topic Clusters and How They Connect

**Docker / DevOps**: `fundamental-docker` establishes core concepts (images, containers,
networking, volumes) using a Node.js example throughout. `docker-compose-nodejs` builds directly
on it for local multi-container development. Each links to the other, plus both link out to
`nodejs-environment-variables` for how secrets and config should be injected into containers.

**Node.js / Backend**: `nodejs-environment-variables` and `nestjs-project-structure` cross-link:
the environment variables article shows the framework-agnostic and NestJS-specific config
patterns; the NestJS structure article shows where that config module fits alongside controllers,
services, and repositories.

**Vue / Frontend**: `vue-3-composition-api-patterns` covers the foundational reactivity
decisions (ref vs reactive, watch vs watchEffect); `vue-composables-guide` builds on it directly,
covering when and how to extract that logic into reusable composables. Each links to the other.

**Nuxt**: `nuxt-3-seo-guide` is currently a single-article cluster, but it's deliberately wired
into the Vue cluster: it links to `vue-3-composition-api-patterns` for the reactivity model
`useSeoMeta`/`useHead` are built on, and that article links back to it as a practical example of
Composition API usage inside a real framework. This is a natural cluster to expand (Nuxt SSR
internals, Nuxt SSG, Nuxt routing) once this batch is published and has a chance to accumulate
some initial traffic and internal link equity.

**React**: `react-useeffect-dependency-array` is also a single-article cluster today, added to
cover React specifically (part of the author's stated expertise alongside Vue), rather than
leaving the site's frontend content Vue-only. It cross-links with `vue-3-composition-api-patterns`
in both directions: each article contrasts React's explicit dependency array against Vue's
automatic dependency tracking in `watchEffect`, which is a genuine, non-forced comparison for a
reader who works across both frameworks. Future React additions (custom hooks, `useMemo` vs
`useCallback`, React Server Components) would build this into a full cluster the same way Docker
and Node.js grew into theirs.

## Internal Linking Strategy

Links were added only where they genuinely help the reader continue an in-progress thought (e.g.,
"here's how to inject the secret you just decided not to bake into the image"), not appended
mechanically to hit a link count. Every link uses descriptive anchor text naming the linked
article's actual topic, never "click here" or "read more." No article links to itself, and no two
articles link to each other for the same reason twice.

## Which Article to Publish First

Recommended order: **`fundamental-docker` → `nodejs-environment-variables` →
`vue-3-composition-api-patterns` → `react-useeffect-dependency-array` → `nuxt-3-seo-guide` →
`docker-compose-nodejs` → `nestjs-project-structure` → `vue-composables-guide`.**

Reasoning: the first article in each cluster (Docker, Node.js, Vue, React, Nuxt) is published
before its follow-up, so no published article ever links to a draft/unpublished one.
`fundamental-docker` goes first because it's the most foundational and highest-intent entry point
across all clusters. `react-useeffect-dependency-array` is placed right after
`vue-3-composition-api-patterns` since the two link to each other; publishing them close together
means neither sits with a dangling link to an unpublished article for long. `nuxt-3-seo-guide` is
placed early relative to its low internal-link count today, since publishing it sooner gives it
more time to accumulate external signals before the rest of a future Nuxt cluster arrives.

## Publishing via the CMS

The blog is database-driven (Quill Delta content via `enem-landing-cms`), not a static file
renderer: these Markdown files are drafts to paste into the CMS form, not files the app reads
directly. Frontmatter fields map to the CMS post form (`pages/blog/[id].vue`) as follows:

| Frontmatter field | CMS field | Notes |
|---|---|---|
| `title` | Title | |
| `slug` | *(not editable)* | CMS auto-generates the slug from Title and locks it permanently. The frontmatter `slug` is a planning reference only: it matches what the title is expected to generate. |
| `excerpt` | Excerpt | |
| *(article body)* | Content editor (Quill) | Paste/format the Markdown body into the rich text editor; code blocks need to be re-created as Quill code blocks. |
| *(none)* | Upload cover image | Upload `images/hero.png` here manually; there is no frontmatter-to-upload automation. |
| `categories` | Categories | Create the category in CMS first (`pages/blog/categories`) if it doesn't exist yet. |
| `tags` | Tags | Create the tag in CMS first (`pages/blog/tags`) if it doesn't exist yet. |
| `metaTitle` | Meta Title | |
| `metaDescription` | Meta Description | |
| *(none)* | OG Image URL | Optional; falls back to the cover image if left blank, so it can usually be skipped. |
| `keywords` | *(no CMS field)* | Reference only, for tracking what each article targets, not submitted anywhere. |
| `author` | *(no CMS field)* | The site has a single author with no per-post attribution field; kept in frontmatter for planning only. |
| `date` | *(no CMS field)* | `publishedAt` is set automatically by the CMS when a post is switched from draft to published. |
| `status` | Draft/Published toggle | All 7 articles ship as `status: draft` here: publishing is a manual decision left to the author. |

## Final Quality Check (applies to all 8 articles)

- [x] Search intent defined per article before writing
- [x] One primary keyword per article, no overlap between articles
- [x] Unique title and meta description per article
- [x] Exactly one H1 per article, no heading level skipped
- [x] Original SVG-based diagrams rendered to PNG per article (no stock photos, no third-party
      image licensing needed)
- [x] Descriptive image alt text, no keyword stuffing
- [x] Descriptive internal link anchor text, added only where genuinely helpful
- [x] No fabricated personal projects, clients, metrics, or incidents: claims use "a practical
      approach is..." framing rather than invented first-hand stories
- [x] Technical claims grounded in current, official documentation for each technology
- [x] No application code touched; all output is confined to `articles/`

## Tools Hub (tools.muzanella.com): 6-Month Content Plan and Search Console Routine

Added for Story 49 (2026-11-06). Seasonal articles published before each search peak. Blog
articles on muzanella.com link to the matching tool, and each tool page links back to the
article where it adds context. Articles are written with the `write-article` skill.

| Month | Article topic (primary keyword) | Target tool |
|-------|---------------------------------|-------------|
| November 2026 | UMP 2027 per provinsi dan cara menghitung kenaikannya ("ump 2027") | `/upah-minimum` |
| December 2026 | Rekonsiliasi PPh 21 Desember dengan TER ("pph 21 desember") | `/kalkulator-gaji-bersih` |
| December 2026 | Libur nasional dan cuti bersama 2027, long weekend ("libur nasional 2027") | `/libur-nasional` (after the BI PDF for 2027 is out) |
| January 2027 | Cara hitung THR dan pajaknya ("cara hitung thr") | `/kalkulator-thr`, `/thr/<nominal>` |
| February 2027 | Zakat fitrah dan fidyah 2027 ("zakat fitrah 2027") | `/kalkulator-zakat`, `/kalkulator-fidyah` |
| February 2027 | Jadwal imsakiyah Ramadan 1448 H ("jadwal imsakiyah 2027") | `/jadwal-imsakiyah` |
| March 2027 | PPh final UMKM 0,5% setelah PP 20/2026 ("pph umkm 0,5") | `/kalkulator-pph-umkm` |
| April 2027 | Iuran BPJS Kesehatan mandiri dan KRIS ("iuran bpjs mandiri") | `/iuran-bpjs-kesehatan` |
| Follow CPNS schedule | Passing grade SKD dan berkas CPNS ("passing grade skd") | `/simulasi-nilai-skd`, `/kompres-pdf`, `/pas-foto-latar-merah-biru` |

### Search Console checklist

- [ ] Verify the `tools.muzanella.com` domain property (DNS TXT record).
- [ ] Submit `https://tools.muzanella.com/sitemap.xml`.
- [ ] After 4 weeks: export queries per page; add answer pages (`/gaji-bersih/<nominal>`,
      `/thr/<nominal>`, token, land units) only for amounts that show impressions, and remove
      ones that get none after 3 months.
- [ ] Monthly: list pages with high impressions and CTR below 2%, rewrite their title and
      description, and recheck after 4 weeks.
- [ ] Monthly: check Coverage for `noindex` surprises (disabled tools, `/embed/*` should stay
      excluded) and 404s.
- [ ] Monthly: check that every tool in the registry has a published article or a row in the
      "Article for Every Tool" table below.
- [ ] Each season: update the data first (UMP, holidays, zakat/fidyah, BPJS, BBM prices), then
      publish the article.

## Tools Hub (tools.muzanella.com): Article for Every Tool

Added 2026-11-06: **every tool on tools.muzanella.com must have at least one supporting article**
on the muzanella.com blog. This table covers all 91 tools in the registry, grouped by
category. Rows marked "6-month plan" are scheduled in the seasonal plan above; "Backlog" rows
are written in between, highest search demand first, without a fixed month.

Rules for these articles:

- One article per row, one primary keyword per article, no overlap with another row.
- The article explains the topic (rules, formula, examples with sources) and links to its tool
  with descriptive anchor text; the tool page links back to the article where it adds context.
- Numbers in the article must match the tool and the sources in its story
  (`issues/NN-*.md`, section "Referensi perhitungan"); update the article when the data changes.
- `/kalkulator-waris` is disabled until a qualified faraid review; publish its article only
  after the tool is enabled.
- When a new tool is added to the registry, add its row here in the same change, and update
  "Status" when the article is published.

| Category | Tool | Article topic (primary keyword) | Plan | Status |
|----------|------|---------------------------------|------|--------|
| Keuangan dan bisnis | `/upah-minimum` | UMP 2027 per provinsi dan cara menghitung kenaikannya ("ump 2027") | 6-month plan (November 2026) | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-lembur` | Cara menghitung upah lembur sesuai PP 35/2021 ("cara hitung lembur") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-gaji-bersih` | Gaji bersih setelah PPh 21 TER dan BPJS ("gaji bersih") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-pesangon` | Hak pesangon karyawan per alasan PHK ("hitung pesangon") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/harga-emas` | Harga emas hari ini dan cara membaca harga spot ("harga emas hari ini") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-emas` | Cara menghitung nilai emas perhiasan per karat ("harga emas 18 karat") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-token-listrik` | Token listrik 100 ribu dapat berapa kWh ("token listrik 100 ribu berapa kwh") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/biaya-bangun-rumah` | Biaya bangun rumah per meter persegi ("biaya bangun rumah per meter") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/link-whatsapp` | Cara membuat link WhatsApp dengan pesan otomatis ("link wa") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-gaji-bersih` | Rekonsiliasi PPh 21 Desember dengan TER ("pph 21 desember") | 6-month plan (Desember 2026) | Belum ditulis |
| Keuangan dan bisnis | `/buat-invoice` | Cara membuat invoice yang benar untuk UMKM ("contoh invoice") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/buat-kwitansi` | Cara membuat kwitansi dan kapan perlu meterai ("contoh kwitansi") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/terbilang` | Cara menulis terbilang rupiah yang benar ("terbilang rupiah") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-hpp` | Cara menghitung HPP produk ("cara menghitung hpp") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-harga-jual` | Beda margin dan markup untuk menentukan harga jual ("cara menentukan harga jual") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-bep` | Cara menghitung titik impas (BEP) ("cara menghitung bep") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-fee-marketplace` | Simulasi biaya admin marketplace untuk penjual ("biaya admin marketplace") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-dana-darurat` | Berapa dana darurat yang ideal ("dana darurat ideal") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-tabungan` | Cara menghitung target tabungan per bulan ("target tabungan") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-investasi` | Simulasi investasi rutin bulanan dan bunga majemuk ("investasi bulanan") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-deposito` | Bunga deposito setelah pajak 20% ("bunga deposito") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-dana-pensiun` | Berapa dana pensiun yang dibutuhkan ("dana pensiun") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-pph-sewa` | Cara menghitung pajak sewa rumah dan ruko ("pajak sewa") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-thr` | Cara menghitung THR dan pajaknya ("cara hitung thr") | 6-month plan (Januari 2027) | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-bbm` | Biaya bensin mudik dan konsumsi BBM per km ("biaya bensin mudik") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-perjalanan-kereta` | Lama perjalanan kereta dan kecepatan rata-rata ("lama perjalanan kereta") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-bbm-kapal` | Waktu tempuh kapal dalam knot dan biaya bahan bakar ("kecepatan kapal knot") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-bahan-bakar-pesawat` | Berapa avtur yang dibakar pesawat per jam ("konsumsi bahan bakar pesawat") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-patungan` | Cara membagi tagihan patungan dengan adil ("cara hitung patungan") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/biaya-sim` | Biaya perpanjang SIM 2027 ("biaya perpanjang sim") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/biaya-stnk-bpkb` | Biaya ganti plat dan perpanjang STNK 5 tahunan ("biaya ganti plat") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-pajak-kendaraan` | Cara menghitung pajak kendaraan dan opsen ("cara menghitung pajak kendaraan") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/simulasi-gadai-emas` | Simulasi gadai emas untuk kebutuhan Lebaran ("simulasi gadai emas") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/simulasi-spt-tahunan` | SPT tahunan kurang bayar karena dua pemberi kerja ("spt kurang bayar") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-pph-umkm` | PPh final UMKM 0,5% setelah PP 20/2026 ("pph umkm 0,5") | 6-month plan (Maret 2027) | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-ppn` | PPN 12% dan DPP 11/12: cara menghitungnya ("cara menghitung ppn") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-pph-23` | Tarif PPh 23 jasa, royalti, dan tanpa NPWP ("tarif pph 23") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/simulasi-kur` | Simulasi KUR 2027: bunga dan angsuran ("simulasi kur") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/simulasi-asuransi-mobil` | Simulasi asuransi mobil all risk dan TLO sesuai OJK ("asuransi mobil all risk") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/simulasi-asuransi-motor` | Simulasi asuransi motor dan cara memilih jaminan ("asuransi motor") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/simulasi-kredit-kendaraan` | Simulasi kredit motor dan mobil: bunga flat vs efektif ("simulasi kredit motor") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/simulasi-kta` | Simulasi KTA dan biaya provisi ("simulasi kta") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/simulasi-kpr` | Simulasi KPR dengan bunga fixed dan floating ("simulasi kpr") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-pbb` | Cara menghitung PBB rumah ("cara menghitung pbb") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/biaya-balik-nama-rumah` | Biaya balik nama sertifikat rumah: BPHTB, PPh, PPAT ("biaya balik nama rumah") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-saham` | Cara menghitung untung rugi saham setelah fee dan pajak ("cara menghitung keuntungan saham") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-average-saham` | Cara average down saham yang benar ("average down saham") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/kalkulator-dividen` | Pajak dividen saham dan dividend yield ("pajak dividen") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/simulasi-reksa-dana` | Simulasi reksa dana untuk pemula ("simulasi reksa dana") | Backlog | Belum ditulis |
| Keuangan dan bisnis | `/simulasi-cicil-emas` | Simulasi cicil emas dan perbandingannya dengan beli tunai ("cicil emas") | Backlog | Belum ditulis |
| Pendidikan dan karier | `/buat-daftar-pustaka` | Cara menulis daftar pustaka APA edisi 7 ("daftar pustaka apa 7") | Backlog | Belum ditulis |
| Pendidikan dan karier | `/penghitung-kata` | Cara menghitung jumlah kata skripsi dan artikel ("hitung jumlah kata") | Backlog | Belum ditulis |
| Pendidikan dan karier | `/ubah-huruf` | Aturan huruf kapital judul menurut EYD ("huruf kapital judul") | Backlog | Belum ditulis |
| Pendidikan dan karier | `/kalkulator-nilai-rapor` | Cara menghitung nilai rapor dan nilai akhir berbobot ("cara menghitung nilai rapor") | Backlog | Belum ditulis |
| Pendidikan dan karier | `/kalkulator-ipk` | Cara menghitung IPK dan IPS ("cara menghitung ipk") | Backlog | Belum ditulis |
| Pendidikan dan karier | `/simulasi-nilai-skd` | Passing grade SKD CPNS dan cara menghitung skor ("passing grade skd") | 6-month plan (Ikut jadwal CPNS) | Belum ditulis |
| Kesehatan | `/kalkulator-bmi` | Cara menghitung BMI dan kategori menurut Kemenkes ("cara menghitung bmi") | Backlog | Belum ditulis |
| Kesehatan | `/kalkulator-kalori` | Kebutuhan kalori harian untuk turun berat badan ("kebutuhan kalori harian") | Backlog | Belum ditulis |
| Kesehatan | `/hitung-hpl` | Cara menghitung HPL dan usia kehamilan ("cara menghitung hpl") | Backlog | Belum ditulis |
| Kesehatan | `/kalkulator-masa-subur` | Cara menghitung masa subur ("masa subur") | Backlog | Belum ditulis |
| Kesehatan | `/iuran-bpjs-kesehatan` | Iuran BPJS Kesehatan mandiri dan KRIS ("iuran bpjs mandiri") | 6-month plan (April 2027) | Belum ditulis |
| Ibadah | `/jadwal-imsakiyah` | Jadwal imsakiyah Ramadan 1448 H ("jadwal imsakiyah 2027") | 6-month plan (Februari 2027) | Belum ditulis |
| Ibadah | `/kalkulator-zakat` | Zakat fitrah 2027: besaran beras dan uang ("zakat fitrah 2027") | 6-month plan (Februari 2027) | Belum ditulis |
| Ibadah | `/kalkulator-fidyah` | Cara menghitung fidyah puasa ("fidyah puasa") | Backlog (also linked from the 6-month plan) | Belum ditulis |
| Ibadah | `/kalkulator-kafarat` | Jenis kafarat dan cara membayarnya ("kafarat") | Backlog | Belum ditulis |
| Ibadah | `/jadwal-sholat` | Jadwal sholat sesuai Kemenag dan cara menghitungnya ("jadwal sholat") | Backlog | Belum ditulis |
| Ibadah | `/arah-kiblat` | Cara menentukan arah kiblat dari rumah ("arah kiblat") | Backlog | Belum ditulis |
| Ibadah | `/kalkulator-waris` | Pembagian waris Islam (faraid) dengan contoh ("pembagian warisan islam") | Backlog | Belum ditulis |
| Dokumen, PDF, gambar, dan utilitas | `/konversi-luas-tanah` | 1 tumbak, 1 bata, 1 ubin berapa meter persegi ("1 tumbak berapa meter") | Backlog | Belum ditulis |
| Dokumen, PDF, gambar, dan utilitas | `/buat-qr-code` | Cara membuat QR code WiFi, kontak, dan link ("buat qr code") | Backlog | Belum ditulis |
| Dokumen, PDF, gambar, dan utilitas | `/gabung-pdf` | Cara menggabungkan file PDF tanpa aplikasi ("gabung pdf") | Backlog | Belum ditulis |
| Dokumen, PDF, gambar, dan utilitas | `/libur-nasional` | Libur nasional dan cuti bersama 2027 serta long weekend ("libur nasional 2027") | 6-month plan (Desember 2026) | Belum ditulis |
| Dokumen, PDF, gambar, dan utilitas | `/hitung-hari-kerja` | Cara menghitung hari kerja tanpa libur ("hitung hari kerja") | Backlog | Belum ditulis |
| Dokumen, PDF, gambar, dan utilitas | `/pisah-pdf` | Cara memisahkan halaman PDF ("pisah pdf") | Backlog | Belum ditulis |
| Dokumen, PDF, gambar, dan utilitas | `/atur-halaman-pdf` | Cara mengurutkan, memutar, dan menghapus halaman PDF ("atur halaman pdf") | Backlog | Belum ditulis |
| Dokumen, PDF, gambar, dan utilitas | `/gambar-ke-pdf` | Cara mengubah foto menjadi PDF ("gambar ke pdf") | Backlog | Belum ditulis |
| Dokumen, PDF, gambar, dan utilitas | `/hitung-umur` | Cara menghitung umur tepat dalam tahun, bulan, hari ("hitung umur") | Backlog | Belum ditulis |
| Dokumen, PDF, gambar, dan utilitas | `/kalkulator-kecepatan` | Berapa lama perjalanan dengan kecepatan tertentu ("waktu tempuh perjalanan") | Backlog | Belum ditulis |
| Dokumen, PDF, gambar, dan utilitas | `/kompres-pdf` | Cara mengompres PDF hasil scan di bawah 1 MB ("kompres pdf") | Backlog (also linked from the 6-month plan) | Belum ditulis |
| Dokumen, PDF, gambar, dan utilitas | `/kompres-gambar` | Cara mengompres foto untuk upload berkas ("kompres foto") | Backlog | Belum ditulis |
| Dokumen, PDF, gambar, dan utilitas | `/ubah-ukuran-gambar` | Cara mengubah ukuran foto dalam piksel dan cm ("ubah ukuran foto") | Backlog | Belum ditulis |
| Dokumen, PDF, gambar, dan utilitas | `/konversi-gambar` | Cara mengubah HEIC, PNG, dan WEBP ke JPG ("heic ke jpg") | Backlog | Belum ditulis |
| Dokumen, PDF, gambar, dan utilitas | `/pdf-ke-jpg` | Cara mengubah PDF menjadi JPG ("pdf ke jpg") | Backlog | Belum ditulis |
| Dokumen, PDF, gambar, dan utilitas | `/watermark-pdf` | Cara menambahkan watermark ke PDF ("watermark pdf") | Backlog | Belum ditulis |
| Dokumen, PDF, gambar, dan utilitas | `/tanda-tangan-pdf` | Cara tanda tangan di PDF tanpa print ("tanda tangan pdf") | Backlog | Belum ditulis |
| Dokumen, PDF, gambar, dan utilitas | `/buat-surat` | Contoh surat lamaran kerja dan strukturnya ("surat lamaran kerja") | Backlog | Belum ditulis |
| Dokumen, PDF, gambar, dan utilitas | `/hitung-weton` | Cara menghitung weton dan neptu ("hitung weton") | Backlog | Belum ditulis |
| Dokumen, PDF, gambar, dan utilitas | `/konversi-hijriah` | Cara konversi tanggal Masehi ke Hijriah ("konversi hijriah") | Backlog | Belum ditulis |
| Dokumen, PDF, gambar, dan utilitas | `/selisih-tanggal` | Menghitung selisih hari antara dua tanggal ("selisih tanggal") | Backlog | Belum ditulis |
| Dokumen, PDF, gambar, dan utilitas | `/konversi-satuan` | Konversi satuan panjang, berat, suhu yang sering dipakai ("konversi satuan") | Backlog | Belum ditulis |
| Dokumen, PDF, gambar, dan utilitas | `/hapus-latar-foto` | Cara menghapus background foto tanpa aplikasi ("hapus background foto") | Backlog | Belum ditulis |
| Dokumen, PDF, gambar, dan utilitas | `/pas-foto-latar-merah-biru` | Ukuran dan warna latar pas foto untuk berkas ("pas foto latar merah") | Backlog (also linked from the 6-month plan) | Belum ditulis |
