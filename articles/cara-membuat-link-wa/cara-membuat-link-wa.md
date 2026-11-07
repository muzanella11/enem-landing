---
title: "Cara Membuat Link WhatsApp dengan Pesan Otomatis untuk Toko Online"
slug: "cara-membuat-link-wa"
excerpt: "Format link wa.me, cara menulis nomor yang benar, dan cara menambahkan pesan otomatis supaya pembeli langsung bisa chat dari Instagram atau marketplace."
metaTitle: "Cara Membuat Link WA dengan Pesan Otomatis"
metaDescription: "Cara membuat link WA (wa.me) dengan pesan otomatis: format nomor 62 tanpa angka 0, encode teks pesan, contoh link untuk toko online, dan QR code-nya."
categories:
  - "Bisnis"
tags:
  - "WhatsApp"
  - "Toko Online"
keywords:
  - "link wa"
  - "cara membuat link wa"
  - "link whatsapp dengan pesan otomatis"
  - "wa.me"
featuredImage: "./images/hero.png"
imageAlt: "Diagram pembuatan link WhatsApp: nomor 08 diubah menjadi 628, pesan di-encode, lalu digabung menjadi tautan wa.me dan QR code"
status: "draft"
author: "Nurfirliana Muzanella"
date: "2026-11-07"
---

# Cara Membuat Link WhatsApp dengan Pesan Otomatis untuk Toko Online

Link WhatsApp memakai format resmi Click to Chat: `https://wa.me/<nomor>?text=<pesan>`. Orang yang mengklik langsung masuk ke chat Anda, dengan pesan yang sudah terisi.

## Menulis Nomor dengan Benar

Nomor harus memakai kode negara, tanpa tanda plus, spasi, atau tanda hubung. Untuk Indonesia, angka 0 di depan diganti 62.

- Salah: `0812-3456-7890`, `+62 812 3456 7890`
- Benar: `6281234567890`

## Menambahkan Pesan Otomatis

Teks pesan harus di-encode untuk URL. Spasi menjadi `%20`, baris baru menjadi `%0A`. Contoh pesan "Halo, saya mau pesan kaos ukuran M":

```text
https://wa.me/6281234567890?text=Halo%2C%20saya%20mau%20pesan%20kaos%20ukuran%20M
```

## Tips untuk Toko Online

- Buat pesan berbeda per produk atau per kampanye, supaya Anda tahu pembeli datang dari mana.
- Pasang link di bio Instagram, deskripsi marketplace, dan katalog.
- Untuk brosur atau kemasan, ubah link menjadi QR code supaya pembeli cukup memindai.

## Kesalahan yang Sering Terjadi

- Nomor masih diawali 0, sehingga WhatsApp tidak menemukan akun.
- Pesan tidak di-encode, sehingga teks terpotong di tanda `&` atau `#`.

Buat link dan QR code-nya sekaligus di [pembuat link WhatsApp](https://tools.muzanella.com/link-whatsapp). Kalau butuh QR untuk WiFi atau kontak, baca [cara membuat QR code](../cara-membuat-qr-code/cara-membuat-qr-code.md).

## Referensi

- [WhatsApp: Click to Chat](https://faq.whatsapp.com/5913398998672934)
