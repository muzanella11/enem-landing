---
title: "Simulasi KTA: Cicilan, Total Bunga, dan Biaya Provisi"
slug: "simulasi-kta"
excerpt: "Cara menghitung cicilan kredit tanpa agunan dengan bunga efektif, total bunga yang dibayar, dan pengaruh biaya provisi yang dipotong saat pencairan."
metaTitle: "Simulasi KTA: Cicilan dan Biaya Provisi"
metaDescription: "Simulasi KTA: cicilan anuitas pinjaman Rp50 juta bunga 12% efektif 24 bulan Rp2.353.674, total bunga Rp6,49 juta, dan dana yang diterima setelah provisi."
categories:
  - "Keuangan"
tags:
  - "KTA"
  - "Pinjaman"
keywords:
  - "simulasi kta"
  - "cicilan kta"
  - "biaya provisi kta"
  - "kredit tanpa agunan"
featuredImage: "./images/hero.png"
imageAlt: "Diagram KTA: plafon dikurangi biaya provisi menjadi dana diterima, sementara plafon dengan bunga efektif dan tenor menghasilkan cicilan tetap dan total bunga"
status: "draft"
author: "Nurfirliana Muzanella"
date: "2026-11-07"
---

# Simulasi KTA: Cicilan, Total Bunga, dan Biaya Provisi

Kredit tanpa agunan (KTA) dicairkan tanpa jaminan, sehingga bunganya lebih tinggi daripada kredit beragunan. Sebelum mengajukan, ada tiga angka yang perlu dihitung: cicilan per bulan, total bunga, dan dana bersih yang diterima.

## Cicilan

Bank biasanya memakai bunga efektif dengan metode anuitas, sehingga cicilan tetap setiap bulan. Rumusnya sama dengan fungsi PMT di spreadsheet.

Contoh pinjaman Rp50.000.000, bunga 12% efektif per tahun, tenor 24 bulan:

- Cicilan: **Rp2.353.674 per bulan**
- Total dibayar: sekitar Rp56.488.000
- Total bunga: sekitar **Rp6.488.000**

Kalau penawaran memakai bunga flat, ubah dulu ke bunga efektif supaya bisa dibandingkan. Penjelasannya ada di [simulasi kredit motor: bunga flat vs efektif](../simulasi-kredit-motor/simulasi-kredit-motor.md).

## Biaya Provisi dan Administrasi

Provisi biasanya dinyatakan dalam persen dari plafon dan dipotong saat pencairan. Dengan provisi 3%, pinjaman Rp50.000.000 hanya cair Rp48.500.000, padahal cicilan tetap dihitung dari Rp50.000.000. Biaya administrasi dan asuransi jiwa kredit juga bisa ikut dipotong.

## Rasio Cicilan

Bank umumnya membatasi total cicilan sekitar 30% sampai 40% dari penghasilan. Ini acuan perbankan, bukan aturan baku. Kalau cicilan baru membuat total cicilan melewati batas itu, pengajuan bisa ditolak.

## Kesalahan yang Sering Terjadi

- Hanya membandingkan bunga tanpa melihat provisi.
- Memilih tenor paling panjang supaya cicilan kecil, padahal total bunga membengkak.
- Tidak mengecek denda pelunasan lebih awal.

Hitung cicilan, total bunga, dan dana bersih setelah biaya di [simulasi KTA](https://tools.muzanella.com/simulasi-kta).

## Referensi

- [Simulasi KTA](https://tools.muzanella.com/simulasi-kta)
