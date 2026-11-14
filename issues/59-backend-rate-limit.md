# Story 59: Rate Limit Global untuk Semua Endpoint Backend

**Status:** Draft (2026-11-14)

**Apps touched:** `enem-landing-api`, `enem-landing-account-api`, `enem-landing-web`, `enem-landing-tools`, `enem-landing-cms`, `enem-landing-account-web`, `libs/backend`

**Depends on:** Story 58 (IP pengunjung dari `CF-Connecting-IP`)

**Dikerjakan sebelum:** Story 57 (anti-spam contact form). Rate limit
per IP contact form di Story 57 memakai mekanisme dari story ini.

## Background

Hasil brainstorm 2026-11-14 (lanjutan Story 57). Saat ini satu-satunya
rate limit ada di `contact-submissions.service.ts` (in-memory, 5 per
menit per IP). Endpoint lain tidak dibatasi sama sekali, termasuk
`POST /auth/signin`, `signup`, dan `change-password` di
`enem-landing-account-api`, endpoint tracking, dan upload.

Permukaan yang terbuka ke internet:

- `enem-landing-api` dan `enem-landing-account-api` **internal-only**
  (`traefik.enable=false` di `compose.yml`), hanya bisa dipanggil lewat
  BFF.
- Yang publik adalah route BFF Nuxt: `muzanella.com/api/*` (21 route),
  `tools.muzanella.com/api/*` (11), `cms.muzanella.com/api/*` (56), dan
  `account.muzanella.com/api/*` (2). Hampir semuanya meneruskan request ke
  salah satu API.

Tujuan story ini: walaupun alamat endpoint diketahui (lewat BFF, atau
kalau suatu saat API ikut terekspos karena salah konfigurasi), setiap
endpoint tetap punya batas, sehingga spam, brute force login, dan
penyalahgunaan resource tertahan di backend.

Masalah yang harus diselesaikan bersama rate limit:

- **Kebanyakan BFF tidak meneruskan IP pengunjung.** `createApiClient()`
  di `apps/enem-landing-web/server/utils/api-client.ts` tidak menambahkan
  `x-forwarded-for`; hanya route contact dan tracking yang melakukannya
  manual. Tanpa perbaikan, semua request dari BFF terbaca sebagai IP
  container BFF, sehingga satu kuota terbagi untuk semua pengunjung dan
  satu orang bisa membuat semua orang kena 429 (masalah yang sama yang
  dulu terjadi di rate limit contact, lihat komentar di
  `server/api/contact-submissions/index.post.ts`).
- **`trust proxy` 1 di `enem-landing-api`** berarti `X-Forwarded-For`
  dari hop mana pun dipercaya. Kalau API terekspos langsung, penyerang
  bisa mengisi header itu sendiri dan setiap request mendapat kuota baru.
- `enem-landing-account-api` belum mengatur `trust proxy` sama sekali.

## Goal

1. Setiap endpoint di kedua API punya rate limit, dengan batas yang
   sesuai jenis endpoint.
2. Kuota dihitung per pengunjung asli (atau per user untuk endpoint
   admin), bukan per container BFF.
3. Header IP tidak bisa dipalsukan walaupun API terekspos langsung.
4. Penyimpanan kuota di Redis, tahan restart dan siap multi-instance.

## Keputusan awal

1. **`@nestjs/throttler` dengan storage Redis** (misalnya
   `@nest-lab/throttler-storage-redis`, memakai `ioredis` yang sudah ada).
   Dibungkus di lib baru `libs/backend/rate-limit` (module, guard,
   decorator, konstanta tier) dan dipasang sebagai `APP_GUARD` global di
   kedua API, sehingga endpoint baru otomatis terlindungi. Key Redis
   memakai prefix environment yang sudah ada (PR #20).
2. **Tier batas** (nilai awal, diatur di satu file konstanta):

   | Tier         | Endpoint                                                                | Key     | Batas awal                  |
   | ------------ | ----------------------------------------------------------------------- | ------- | --------------------------- |
   | `default`    | semua endpoint publik yang membaca data (GET blog, tools, profil, dll.) | IP      | 120 per menit               |
   | `write`      | endpoint publik yang menulis, selain yang punya tier khusus             | IP      | 20 per menit                |
   | `tracking`   | `/tracking/*`                                                           | IP      | 300 per menit               |
   | `contact`    | `POST /contact-submissions`                                             | IP      | 3 per 10 menit, 10 per hari |
   | `auth`       | `signin`, `signup`, `change-password`                                   | IP      | 10 per menit, 50 per jam    |
   | `admin`      | endpoint dengan `SsoAuthGuard` (CMS)                                    | user ID | 300 per menit               |
   | `upload`     | `uploads/*`                                                             | user ID | 20 per menit                |
   | dikecualikan | `health`, endpoint internal dengan `X-Internal-Api-Key` yang valid      | -       | tanpa batas                 |

   Tier dipilih dengan decorator (misalnya `@RateLimit('auth')`); tanpa
   decorator, endpoint GET memakai `default` dan endpoint lain memakai
   `write`. Batas `contact` per email dan kuota global auto-reply tetap
   diurus Story 57 di service contact.

3. **Key pengunjung yang benar:**
   - Semua `createApiClient` di BFF (web, tools, cms, account-web)
     menerima `event` dan **selalu** meneruskan `x-forwarded-for` berisi
     IP dari `getClientIp(event)` (Story 58). Penambahan header manual di
     route contact dan tracking dihapus karena sudah tercakup.
   - Kedua API memakai `app.set('trust proxy', 'loopback, uniquelocal')`
     sehingga `X-Forwarded-For` hanya dipercaya kalau datang dari jaringan
     internal Docker (BFF). Request dari IP publik memakai alamat socket
     dan header palsunya diabaikan.
   - Request internal tanpa IP pengunjung (misalnya panggilan antar
     service atau SSR yang lupa meneruskan IP) mendapat key
     `internal:<ip>` dengan batas tinggi dan log warning, supaya tidak
     menghabiskan kuota bersama dan mudah ditemukan.
4. **Respons 429** memakai format `errorResponse` yang sudah seragam
   (PR #19), dengan header `Retry-After`. `handleApiError` di setiap BFF
   meneruskan status 429 dan `Retry-After` ke browser apa adanya.
5. **Dev, test, dan e2e:** batas bisa dikalikan atau dimatikan lewat env
   (misalnya `RATE_LIMIT_MULTIPLIER`, default 1; e2e lokal dan CI memakai
   nilai besar) supaya tes yang mengirim banyak request dari satu IP tidak
   gagal. Prod selalu memakai nilai default.
6. **Logging:** setiap 429 dicatat dengan tier, route, dan key yang
   disamarkan (bukan IP lengkap), supaya bisa dipantau tanpa menulis IP ke
   log.
7. **Lapisan edge opsional:** satu rule rate limiting Cloudflare (paket
   gratis menyediakan satu rule) untuk `POST /api/contact-submissions`
   atau `/api/*`, sebagai pelindung sebelum request sampai ke VPS.
   Dikonfigurasi manual di dashboard, bukan bagian kode.

## Scope

- `libs/backend/rate-limit`: module, guard, decorator `@RateLimit`,
  konstanta tier, resolver key (IP atau user ID), storage Redis.
- `enem-landing-api` dan `enem-landing-account-api`: pasang guard global,
  `trust proxy` ke `loopback, uniquelocal`, decorator tier di controller
  yang perlu tier khusus, pengecualian health dan endpoint internal.
- `enem-landing-api`: hapus rate limit in-memory lama di
  `contact-submissions.service.ts` (digantikan tier `contact`).
- BFF (`enem-landing-web`, `enem-landing-tools`, `enem-landing-cms`,
  `enem-landing-account-web`): `createApiClient(event)` selalu meneruskan
  IP pengunjung; `handleApiError` meneruskan 429 dan `Retry-After`.
- Env `RATE_LIMIT_MULTIPLIER` di `.env.example`, konfigurasi CI e2e, dan
  deploy.
- Tes unit untuk guard, resolver key, dan pemilihan tier; tes e2e atau
  integrasi bahwa batas `auth` dan `contact` menghasilkan 429.

### Di luar scope

- Rate limit di route BFF yang tidak memanggil API (bila ada, dievaluasi
  terpisah; lapisan Cloudflare di Keputusan awal no. 7 menutupnya
  sementara).
- Blokir IP otomatis atau ban jangka panjang.
- Tampilan statistik 429 di CMS.

## Acceptance criteria

- [ ] Semua endpoint di `enem-landing-api` dan `enem-landing-account-api`
      terlindungi guard global; endpoint tanpa decorator memakai tier
      `default` (GET) atau `write` (lainnya).
- [ ] Endpoint `auth`, `tracking`, `contact`, `admin`, dan `upload` memakai
      tier masing-masing sesuai tabel.
- [ ] `health` dan endpoint internal dengan `X-Internal-Api-Key` valid
      tidak kena rate limit.
- [ ] Kuota tersimpan di Redis dengan prefix environment dan tetap
      berlaku setelah API restart.
- [ ] Semua BFF meneruskan IP pengunjung asli di setiap panggilan API;
      dua pengunjung berbeda punya kuota terpisah.
- [ ] Request langsung ke API dari IP publik dengan `X-Forwarded-For`
      palsu tetap dihitung dengan IP socket.
- [ ] Endpoint admin dan upload dihitung per user ID, bukan per IP.
- [ ] Respons 429 berformat `errorResponse` dengan header `Retry-After`,
      dan sampai ke browser dengan status yang sama lewat BFF.
- [ ] Rate limit in-memory lama di service contact sudah dihapus.
- [ ] e2e lokal dan CI tidak gagal karena rate limit
      (`RATE_LIMIT_MULTIPLIER`).
- [ ] Log 429 memuat tier dan route tanpa IP lengkap.
- [ ] Lint, format, test, build, dan e2e lulus lokal sebelum PR.

## Langkah manual setelah deploy

1. Pastikan Story 58 sudah live.
2. Coba `signin` dengan password salah lebih dari 10 kali dalam semenit
   dan pastikan mendapat 429.
3. Pantau log 429 selama beberapa hari; naikkan batas tier yang terlalu
   ketat untuk pengunjung asli (terutama `default` dan `tracking`).
4. Opsional: buat satu rule rate limiting di Cloudflare untuk
   `POST /api/contact-submissions`.

## Referensi

- NestJS rate limiting (`@nestjs/throttler`):
  https://docs.nestjs.com/security/rate-limiting
- Redis storage untuk throttler:
  https://github.com/jmcdo29/nest-lab/tree/main/packages/throttler-storage-redis
- Express `trust proxy` (`loopback`, `uniquelocal`):
  https://expressjs.com/en/guide/behind-proxies.html
- Cloudflare rate limiting rules:
  https://developers.cloudflare.com/waf/rate-limiting-rules/
- OWASP API Security Top 10, API4:2023 Unrestricted Resource Consumption:
  https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/
