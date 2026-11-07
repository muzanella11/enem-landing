---
title: "Cara Membuat QR Code untuk WiFi, Kontak, dan Link"
slug: "cara-membuat-qr-code"
excerpt: "Format isi QR code untuk berbagi WiFi tanpa menyebut password, menyimpan kontak (vCard), dan membuka link, serta tips ukuran dan format file untuk dicetak."
metaTitle: "Cara Membuat QR Code WiFi, Kontak, dan Link"
metaDescription: "Cara membuat QR code: format WIFI untuk berbagi WiFi, vCard untuk kontak, dan URL untuk link. Tips memilih PNG atau SVG, ukuran cetak, dan menguji sebelum dicetak."
categories:
  - "Dokumen dan Utilitas"
tags:
  - "QR Code"
  - "WiFi"
keywords:
  - "buat qr code"
  - "qr code wifi"
  - "qr code kontak"
  - "cara membuat qr code"
featuredImage: "./images/hero.png"
imageAlt: "Diagram QR code: data link, WiFi, atau kontak disusun dalam format standar, dikodekan menjadi QR, lalu diunduh sebagai PNG atau SVG"
status: "draft"
author: "Nurfirliana Muzanella"
date: "2026-11-07"
---

# Cara Membuat QR Code untuk WiFi, Kontak, dan Link

QR code hanyalah wadah untuk teks. Yang membuat ponsel tahu harus membuka browser, menyambung WiFi, atau menyimpan kontak adalah format teks di dalamnya.

## QR untuk Link

Isinya cukup URL lengkap, misalnya `https://muzanella.com`. Selalu sertakan `https://` supaya ponsel langsung mengenalinya sebagai link.

## QR untuk WiFi

Format yang dikenali Android dan iPhone:

```text
WIFI:T:WPA;S:NamaWifi;P:passwordnya;;
```

- `T` adalah jenis keamanan: `WPA`, `WEP`, atau `nopass`.
- `S` adalah nama jaringan (SSID), `P` adalah password.
- Karakter khusus `\ ; , : "` di nama atau password harus diberi garis miring terbalik di depannya.

Tamu cukup memindai, tanpa perlu Anda menyebutkan password.

## QR untuk Kontak

Kontak memakai format vCard. Ponsel akan menawarkan untuk menyimpan nama, nomor, email, dan perusahaan sekaligus. Cocok untuk kartu nama atau meja resepsionis.

## Tips Mencetak

- **SVG** tetap tajam di ukuran berapa pun, cocok untuk spanduk dan percetakan. **PNG** praktis untuk dikirim lewat chat.
- Beri ruang kosong (quiet zone) di sekeliling QR, dan jangan cetak terlalu kecil. Sebagai patokan umum, jangan lebih kecil dari sekitar 2 x 2 cm untuk dipindai dari dekat.
- Pastikan kontras cukup: kode gelap di latar terang.
- Uji pindai dengan dua ponsel berbeda sebelum dicetak massal.

Untuk link chat WhatsApp dengan pesan otomatis, baca [cara membuat link WA](../cara-membuat-link-wa/cara-membuat-link-wa.md). Buat QR code link, teks, WiFi, atau kontak, lalu unduh PNG atau SVG di [pembuat QR code](https://tools.muzanella.com/buat-qr-code).

## Referensi

- [ZXing: format isi barcode](https://github.com/zxing/zxing/wiki/Barcode-Contents)
- [RFC 2426: vCard 3.0](https://www.rfc-editor.org/rfc/rfc2426)
