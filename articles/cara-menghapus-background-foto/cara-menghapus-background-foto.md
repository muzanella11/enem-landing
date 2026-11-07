---
title: "Cara Menghapus Background Foto Tanpa Aplikasi dan Tanpa Upload"
slug: "cara-menghapus-background-foto"
excerpt: "Cara membuat latar foto transparan atau menggantinya dengan warna lain langsung di browser, bagaimana model segmentasi bekerja, dan foto seperti apa yang hasilnya paling rapi."
metaTitle: "Cara Menghapus Background Foto Tanpa Aplikasi"
metaDescription: "Cara menghapus background foto tanpa aplikasi: latar jadi transparan atau diganti warna, diproses di browser dengan model segmentasi tanpa upload. Tips foto agar hasil rapi."
categories:
  - "Dokumen dan Utilitas"
tags:
  - "Foto"
  - "Background"
keywords:
  - "hapus background foto"
  - "cara menghapus background foto"
  - "background transparan"
  - "ganti latar foto"
featuredImage: "./images/hero.png"
imageAlt: "Diagram hapus background: foto diproses model segmentasi menjadi mask orang, tepi mask dihaluskan, lalu foto digabung dengan latar transparan atau warna baru"
status: "draft"
author: "Nurfirliana Muzanella"
date: "2026-11-07"
---

# Cara Menghapus Background Foto Tanpa Aplikasi dan Tanpa Upload

Menghapus latar foto dulu butuh aplikasi edit dan ketelatenan memotong pinggiran rambut. Sekarang model segmentasi bisa memisahkan orang dari latarnya secara otomatis, bahkan langsung di browser.

## Cara Kerjanya

1. Model segmentasi (MediaPipe Selfie Segmentation) membaca foto dan menghasilkan **mask**, yaitu peta yang menandai piksel mana bagian orang dan mana latar.
2. Tepi mask dihaluskan supaya pinggiran tidak bergerigi.
3. Foto digabungkan dengan latar baru: transparan, putih, merah, biru, atau warna lain.

Semua proses berjalan di perangkat Anda. Foto tidak dikirim ke server, sehingga aman untuk foto wajah dan dokumen pribadi.

## Langkah

1. Buka [hapus latar foto](https://tools.muzanella.com/hapus-latar-foto) dan pilih foto.
2. Tunggu proses selesai. Saat pertama dibuka, model perlu diunduh sekali.
3. Pilih latar transparan atau warna, lalu unduh PNG.

## Foto yang Hasilnya Paling Rapi

- Model ini dirancang untuk **orang**, terutama foto setengah badan atau wajah. Untuk foto produk atau hewan, hasilnya kurang akurat.
- Latar polos dan kontras dengan baju serta rambut.
- Cahaya merata, tanpa bayangan tajam di belakang kepala.
- Rambut yang sangat tipis atau berantakan bisa ikut terpotong sebagian.

## Format File

Latar transparan hanya bisa disimpan sebagai PNG atau WebP. JPG tidak mendukung transparansi dan akan mengisi bagian kosong dengan warna.

Untuk pas foto dengan latar merah atau biru beserta lembar cetaknya, lihat [ukuran dan warna latar pas foto](../pas-foto-latar-merah-biru/pas-foto-latar-merah-biru.md).

## Referensi

- [MediaPipe Selfie Segmentation](https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/selfie_segmentation.md)
