# Story 39: Generator Link WhatsApp dan QR Code

**Apps touched:** `enem-landing-tools`, `enem-landing-api` (seed registry)

**Depends on:** Story 20, Story 25

## Background

UMKM dan penjual online sering mencari "buat link WhatsApp" dan "buat QR
code". Tool ini cepat dibuat, mudah dibagikan, dan membawa pengunjung yang
juga butuh invoice/kwitansi (Story 24).

## Goal

1. `/link-whatsapp`: buat tautan `wa.me` dengan pesan otomatis.
2. `/buat-qr-code`: QR untuk URL, teks, WiFi, kontak (vCard), dan link
   WhatsApp, unduh PNG/SVG.

## Keputusan awal

1. **Normalisasi nomor Indonesia:** `08...`, `+62...`, `62...`, dan
   spasi/tanda hubung menjadi format `62...`; validasi panjang nomor.
2. **QR dibuat di browser** dengan library QR berlisensi permisif (dicek
   saat implementasi), dengan pilihan ukuran, warna, margin, tingkat
   koreksi error, dan logo di tengah (dengan peringatan bila logo terlalu
   besar untuk dipindai).
3. **Tidak ada shortlink atau redirect** lewat server kita; tautan yang
   dibuat langsung ke `wa.me` atau URL tujuan.
4. Tidak membuat QRIS (QR pembayaran) karena itu standar Bank Indonesia
   yang diterbitkan PJP; halaman menjelaskan bedanya.

## Scope

- Link WhatsApp: nomor, pesan (dengan template untuk toko), hasil link,
  tombol salin, tombol uji, dan QR dari link tersebut.
- QR code: jenis konten, kustomisasi, pratinjau langsung, unduh PNG dan SVG,
  uji pindai dengan kamera di perangkat (opsional).
- FAQ, JSON-LD.

## Monetisasi

AdSense dan donasi. Cross-link ke invoice/kwitansi (Story 24).

## Out of scope

- QRIS, shortlink, statistik klik link.

## Acceptance Criteria

- [ ] Unit test normalisasi nomor (berbagai format, nomor tidak valid) dan
      encoding pesan (emoji, baris baru).
- [ ] QR hasil terbaca oleh aplikasi kamera Android dan iPhone untuk tiap
      jenis konten.
- [ ] Data WiFi dan kontak tidak pernah dikirim ke server.
- [ ] Muncul di registry (Story 25), punya meta/JSON-LD, masuk sitemap.
- [ ] Tidak ada request jaringan yang membawa nilai input pengguna.
- [ ] `nx lint`, `nx test`, dan e2e dasar (buka halaman, isi input, hasil muncul) lulus.
