# Story 19: Blog (CMS Authoring + Public Site)

**Apps touched:** `enem-landing-api`, `enem-landing-cms`, `enem-landing-web`

## Background

`enem-landing-web` saat ini benar-benar single-page (`pages/index.vue`, lihat
Story 17) — belum ada routing multi-halaman sama sekali. `enem-landing-cms`
sudah punya pola CRUD content yang konsisten (`experiences`, `skills`,
`seo-meta`, `site-profile`): Entity + DTO + Service + Controller + Module di
`enem-landing-api`, dan halaman `CListPage`/`CFormPage` di CMS. Upload gambar
ke Cloudflare R2 sudah ada juga, tapi hidup di `enem-landing-account-api`
(`uploads.service.ts`, `internal-uploads.controller.ts`) — CMS memanggilnya
lewat proxy `server/api/uploads.post.ts`, dan `enem-landing-api` sendiri sudah
pernah memanggilnya server-to-server (`tracking-recording.service.ts`, Story
16) lewat `InternalApiGuard` untuk keperluan lain (rekaman sesi). Story 17
(SEO optimization) sengaja tidak menyentuh blog: "Blog/halaman blog —
eksplisit tidak boleh, dikerjakan terpisah oleh user" — story ini adalah
kelanjutannya, hasil brainstorming sesi 2026-09-07.

## Goal

Menambahkan fitur blog end-to-end: pengalaman menulis di CMS mirip Medium
(Quill, Delta JSON), alur draft/publish, dua taksonomi terpisah (kategori dan
tag), gambar cover + inline yang ter-upload ke R2 dan otomatis dibersihkan
saat tidak lagi dipakai, serta halaman publik di `enem-landing-web` (listing,
detail per slug, filter kategori/tag, related posts, SEO per artikel).

## Kenapa

User adalah satu-satunya penulis, tidak sering menulis, tapi ingin
pengalaman menulis yang nyaman (Medium-style) dan taksonomi yang bisa
dijelajahi pembaca. R2 storage sudah ada tapi belum ada mekanisme
pembersihan otomatis — tanpa itu, tiap edit artikel/ganti gambar akan
menumpuk file yatim di bucket.

## Keputusan hasil brainstorm (2026-09-07)

1. **Konten Quill disimpan sebagai Delta (JSON)**, bukan HTML mentah — lebih
   aman untuk di-render ulang/disanitasi di sisi publik.
2. **Upload gambar (cover + inline) lewat jalur upload CMS yang sudah ada**
   (`/api/uploads` proxy → `enem-landing-account-api` `POST /uploads`,
   R2-backed, balikin `{id, url}`). **Cleanup-nya murni client-side**
   (revisi dari rencana awal setelah dicek ke kode yang ada — tidak jadi
   pakai kolom `imageIds` + diff di backend + internal API call ke
   `enem-landing-account-api`; `enem-landing-api` tidak butuh integrasi
   baru sama sekali untuk ini), memakai endpoint publik `/api/uploads/:id`
   yang sudah dipakai form Experience/Project
   (`extractUploadId` di `experiences/[id].vue`). Bedanya dengan pola
   Experience/Project: di form Experience/Project gambar langsung
   terhapus dari R2 begitu tombol X diklik; untuk blog ini sengaja
   **ditunda sampai Save** (diff antara gambar yang ada saat post dimuat
   vs gambar final saat Save ditekan, baru dihapus setelah save berhasil)
   supaya penghapusan gambar di editor tetap bisa di-undo selama sesi
   edit (gambar inline disisipkan sebagai `blob:` URL lokal dulu — jadi
   ikut riwayat undo/redo Quill sendiri — baru diupload ke R2 saat Save).
   Saat post dihapus total, semua gambar yang pernah dipakai (cover +
   semua gambar konten) tetap langsung dihapus dari R2 — itu tidak ambigu,
   tidak ada concern undo.
3. **Kategori dan Tag adalah dua taksonomi many-to-many yang terpisah**
   (bukan digabung) — ada `/blog/category/:slug` dan `/blog/tag/:slug`.
4. **Field SEO (`metaTitle`, `metaDescription`, `ogImageUrl`) menempel
   langsung di `BlogPostEntity`**, bukan di tabel `seo_meta` yang sudah ada
   — tabel itu di-key oleh `pageKey` statis, tidak cocok untuk granularitas
   per-artikel.
5. **Slug murni auto-generate dari judul, tidak bisa diedit manual sama
   sekali** (revisi 2026-09-07 — rencana awal "bisa diedit manual"
   dibatalkan). Di-generate sekali saat post dibuat, lalu permanen/unique —
   tidak ikut berubah walau judul diedit belakangan, supaya URL artikel
   yang sudah terbit tidak bergeser di mata pembaca/search engine. Field
   `slug` sudah tidak ada sama sekali di DTO update
   (`UpdateBlogPostDto`/`CreateBlogPostDto` tidak menerima slug dari
   klien) — bukan cuma dikunci di UI CMS (`readonly`), tapi memang tidak
   bisa diubah lewat API. SEO-friendly: lowercase, hyphen-separated
   (`slugify` yang sudah ada), dipotong maksimal 80 karakter di batas
   hyphen (tidak motong di tengah kata) supaya slug tetap ringkas, dan
   validasi menolak judul yang tidak menghasilkan slug sama sekali (mis.
   cuma emoji/simbol).
6. **Status `draft`/`published` + `publishedAt`** (di-set saat pertama kali
   publish) **+ `updatedAt`.**
7. **Related posts**: artikel lain yang berbagi minimal satu kategori atau
   tag dengan artikel saat ini, exclude diri sendiri, urut `publishedAt`
   desc, limit 3.

## Scope

### Backend (`enem-landing-api`)

- Migration baru: tabel `blog_categories`, `blog_tags`, `blog_posts`, plus
  join table yang dikelola TypeORM untuk kedua relasi M2M (`@ManyToMany` +
  `@JoinTable`, tanpa entity join terpisah — belum ada preseden join entity
  eksplisit di repo ini dan tidak dibutuhkan di sini).
- `BlogCategoryEntity`, `BlogTagEntity`: `id`, `name`, `slug` (unique).
- `BlogPostEntity`: `id`, `title`, `slug` (unique), `excerpt` (text,
  nullable), `contentDelta` (`json`, MySQL native — konsisten dengan
  keputusan Epic 12 poin 10 soal tipe kolom JSON), `coverImageId` (nullable),
  `coverImageUrl` (nullable), `status` (`draft`|`published`), `publishedAt`
  (nullable), `metaTitle`, `metaDescription` (text), `ogImageUrl`,
  `imageIds` (`simple-json` array), `createdAt`/`updatedAt`
  (`precision: 6`, konsisten dengan `ExperienceEntity`).
- Modul `blog` (posts, categories, tags) mengikuti bentuk modul
  `experiences`/`skills` (module/controller/service/dto per resource).
- Internal client ke `enem-landing-account-api` untuk cleanup upload —
  mirror `tracking-recording.service.ts` (axios client + `ACCOUNT_API_HOST`),
  panggil `DELETE /uploads/internal/:id` untuk `imageIds` yang orphan saat
  update/delete.
- Endpoint publik: `GET /blog-posts` (hanya `published`, paginated,
  `?category=slug`, `?tag=slug`), `GET /blog-posts/:slug` (hanya
  `published`, 404 untuk draft/tidak ada), related posts (embedded di
  response detail atau endpoint terpisah), `GET /blog-categories`,
  `GET /blog-tags`.
- Endpoint admin (`SsoAuthGuard` + `assertAdminRole`, mirror
  `experiences.controller.ts`): CRUD penuh post (termasuk list draft), CRUD
  category, CRUD tag.

### CMS (`enem-landing-cms`)

- `pages/blog/index.vue` (list, `CListPage`, filter draft/published).
- `pages/blog/[id].vue` (form, `CFormPage`): title, slug (read-only,
  auto-generated), excerpt, editor Quill (Delta) dengan image-upload handler custom yang
  memanggil proxy `/api/uploads` yang sudah ada, upload cover image,
  multiselect kategori, multiselect tag, toggle status
  draft/publish, field SEO.
- `pages/blog/categories/index.vue`, `pages/blog/tags/index.vue`: CRUD
  sederhana, bentuk sama seperti `pages/skills/index.vue`.
- Dependency Quill ditambahkan hanya di `enem-landing-cms` (sisi penulis).

### Public web (`enem-landing-web`)

- Routing multi-halaman baru (app ini sekarang murni single-page
  `index.vue` — ini penambahan routing nyata pertama):
  - `pages/blog/index.vue`: listing + pagination.
  - `pages/blog/[slug].vue`: detail, render Delta→HTML (disanitasi),
    related posts, `useSeoMeta` + canonical + JSON-LD `Article` per artikel
    (mengikuti pola JSON-LD `Person`/`WebSite` dari Story 17).
  - `pages/blog/category/[slug].vue`, `pages/blog/tag/[slug].vue`: listing
    terfilter.
- Navigasi: tambahkan entry point "Blog" dari homepage (`Navigation.vue`) —
  penempatan pasti diputuskan saat implementasi, tidak mengubah section
  single-page yang sudah ada.
- Render Delta: tambah dependency render kecil (mis. `quill-delta-to-html`)
  daripada reimplement dari nol.

## Out of scope

- Komentar di artikel blog.
- Full-text search lintas artikel.
- RSS/Atom feed (kandidat story lanjutan setelah ada cukup banyak artikel
  terbit untuk itu relevan).
- Scheduled/future-dated publishing — `publishedAt` di-set saat publish
  terjadi, bukan pakai scheduler.
- Multi-author / atribusi penulis — satu penulis (pemilik situs), tidak ada
  field author terpisah.
- Migrasi/backfill konten lama — ini fitur baru dari nol, tidak ada konten
  blog lama yang perlu dipindah.

## Acceptance Criteria

- [ ] Migration dibuat dan berhasil dijalankan; rollback (`down`) diverifikasi.
- [ ] Admin bisa create/edit/delete artikel di CMS dengan editor Quill,
      cover image, multiselect kategori + tag, toggle draft/publish.
- [ ] Menghapus gambar inline dari editor (lalu simpan) atau mengganti cover
      image menghapus file yang sudah tidak dipakai dari R2 (diverifikasi
      lewat tabel `files` account-api / listing bucket R2, bukan cuma "tidak
      ada error").
- [ ] Menghapus artikel menghapus semua file R2 terkait (cover + setiap
      gambar inline yang pernah tercatat di `imageIds`).
- [ ] `/blog` publik menampilkan hanya artikel `published`, dengan pagination.
- [ ] `/blog/:slug` publik merender konten dengan benar (Delta→HTML), 404
      untuk slug draft/tidak ada.
- [ ] `/blog/category/:slug` dan `/blog/tag/:slug` memfilter dengan benar.
- [ ] Related posts (kategori/tag sama, exclude diri sendiri, terbaru 3)
      tampil di halaman detail.
- [ ] `<head>` tiap artikel punya `metaTitle`/`metaDescription`/`og:image`
      yang benar (fallback wajar kalau dikosongkan) dan JSON-LD `Article`.
- [ ] `nx lint`/`nx test` lulus untuk ketiga app yang disentuh; e2e baru
      ditambahkan untuk `enem-landing-web-e2e` dan `enem-landing-cms-e2e`
      sesuai konvensi per-app yang sudah ada.
