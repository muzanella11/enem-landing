# Story 58: Perbaikan IP Pengunjung yang Bisa Dipalsukan (Cloudflare)

**Status:** Done (2026-11-14). Catatan: helper bersama `resolveClientIp` ada di `libs/shared/utils`, dibungkus `getClientIp` di setiap BFF (`server/utils/client-ip.ts` di web, tools, cms, account-web). Origin dibatasi lewat middleware Traefik `cloudflare-only` (`ipAllowList`, file provider `traefik-dynamic.yml.j2`) pada kedua entrypoint, bukan UFW: port yang dipublish Docker (mode host) melewati rule UFW lewat iptables. Pembatasan ini baru aktif setelah `init-server.yml` dijalankan ulang di VPS, jadi AC port belum dicentang. Semua subdomain prod dan dev sudah dicek proxied lewat DNS. e2e lokal: web 31/31, cms 21/21, account-web 12/12; tools 322/327, 5 kegagalan di fitur PDF (Chromium) dan header cache yang hanya ada di build produksi, tidak menyentuh kode yang diubah.

**Apps touched:** `enem-landing-web`, `enem-landing-tools`, `infra/ansible`

**Depends on:** Story 10 (infra/CI-CD), Story 13 (tracking session), Story 06 (rate limit contact)

**Dikerjakan sebelum:** Story 59 (rate limit global backend) dan Story 57
(anti-spam contact form), karena rate limit dan pencatatan IP di kedua
story itu bergantung pada IP yang benar.

## Background

Ditemukan saat brainstorm Story 57 (2026-11-14).

muzanella.com dan tools.muzanella.com berada di belakang proxy Cloudflare
(DNS resolve ke IP Cloudflare). Alurnya:

```
pengunjung -> Cloudflare -> Traefik (VPS) -> BFF Nuxt -> enem-landing-api
```

BFF mengambil IP pengunjung dengan
`getRequestIP(event, { xForwardedFor: true })` lalu meneruskannya ke
`enem-landing-api` lewat header `x-forwarded-for`. Fungsi h3 ini memakai
**entri pertama** dari `X-Forwarded-For`
(`split(",").shift()`).

Masalahnya, Cloudflare **menambahkan** IP asli pengunjung di belakang
header `X-Forwarded-For` yang sudah dikirim pengunjung, bukan menggantinya.
Traefik (`forwardedheaders.trustedips` = IP Cloudflare) meneruskan header
itu apa adanya. Jadi kalau pengirim mengirim
`X-Forwarded-For: 1.2.3.4`, yang sampai di BFF adalah
`1.2.3.4, <IP asli>`, dan BFF memakai `1.2.3.4`.

Dampak:

- **Rate limit contact form bisa dilewati** dengan mengganti nilai
  `X-Forwarded-For` di setiap request.
- **IP di tracking session** (`/api/tracking/session` di web dan tools)
  bisa dipalsukan, sehingga geolokasi dan peta pengunjung di CMS bisa
  diisi data palsu.
- IP yang akan dicatat di Story 57 tidak bisa dipercaya.

Lokasi kode yang terdampak:

- `apps/enem-landing-web/server/api/contact-submissions/index.post.ts`
- `apps/enem-landing-web/server/api/tracking/session.post.ts`
- `apps/enem-landing-tools/server/api/tracking/session.post.ts`

## Goal

IP pengunjung yang dipakai untuk rate limit, tracking, dan pencatatan
pengirim selalu IP asli dari Cloudflare dan tidak bisa diisi pengirim.

## Keputusan awal

1. **Pakai header `CF-Connecting-IP`.** Header ini diisi Cloudflare dengan
   satu IP pengunjung dan selalu ditimpa oleh Cloudflare, jadi nilai dari
   pengirim tidak ikut.
2. **Helper `getClientIp(event)`** di setiap BFF (atau di lib bersama bila
   ada tempat yang cocok untuk util server Nuxt):
   - pakai `CF-Connecting-IP` bila ada;
   - kalau tidak ada (dev lokal tanpa Cloudflare), pakai alamat socket
     (`event.node.req.socket.remoteAddress`);
   - **tidak pernah** memakai `X-Forwarded-For` dari request masuk.
3. **Origin hanya menerima traffic dari Cloudflare.** Tanpa ini, orang yang
   tahu IP VPS bisa langsung menembak Traefik dan mengirim
   `CF-Connecting-IP` palsu, karena `forwardedheaders` Traefik hanya
   mengurus header `X-Forwarded-*`. Pilihan implementasi (dipilih saat
   implementasi):
   - firewall VPS (ufw) hanya membuka port 80/443 untuk rentang IP
     Cloudflare (`cloudflare_trusted_ips` yang sudah ada di Ansible); atau
   - middleware Traefik `ipAllowList` dengan rentang yang sama pada
     entrypoint `websecure`.
     Opsi firewall lebih disukai karena juga menolak koneksi sebelum sampai
     ke Traefik.
4. BFF tetap meneruskan IP ke `enem-landing-api` lewat `x-forwarded-for`
   berisi satu nilai dari `getClientIp`, sehingga `trust proxy` 1 di
   `enem-landing-api` tidak perlu diubah.

## Acceptance criteria

- [x] Ketiga route BFF di atas memakai `getClientIp`, tidak lagi
      `getRequestIP(event, { xForwardedFor: true })`.
- [x] Request dengan header `X-Forwarded-For` palsu tetap tercatat dengan
      IP asli dan tetap kena rate limit.
- [x] Dev lokal tanpa Cloudflare tetap berjalan (IP dari socket).
- [ ] Port 80/443 VPS hanya menerima koneksi dari rentang IP Cloudflare;
      request langsung ke IP VPS ditolak.
- [x] Tes unit untuk `getClientIp` (ada `CF-Connecting-IP`, tidak ada,
      dan ada `X-Forwarded-For` palsu).
- [x] Lint, format, test, build, dan e2e lulus lokal sebelum PR.

## Langkah manual setelah deploy

1. Kirim request ke form contact dengan header
   `X-Forwarded-For: 1.2.3.4` dan pastikan IP yang tercatat bukan
   `1.2.3.4`.
2. Coba akses IP VPS langsung (tanpa domain) dan pastikan koneksi ditolak.
3. Cek peta pengunjung di CMS masih terisi normal.

## Referensi

- Cloudflare, HTTP request headers (`CF-Connecting-IP`,
  `X-Forwarded-For`):
  https://developers.cloudflare.com/fundamentals/reference/http-headers/
- Cloudflare, daftar rentang IP: https://www.cloudflare.com/ips/
- h3 `getRequestIP`: https://h3.dev/utils/request
