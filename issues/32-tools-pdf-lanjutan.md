# Story 32: Alat PDF Lanjutan (PDF ke JPG, Kompres PDF, Watermark, Tanda Tangan)

**Apps touched:** `enem-landing-tools`, `enem-landing-api` (seed registry)

**Depends on:** Story 23 (worker PDF, `pdf-lib`, `pdfjs-dist`, dropzone)

## Background

Story 23 sudah memuat `pdf-lib` dan `pdf.js` secara lazy. Empat tool berikut
termasuk yang paling banyak dicari setelah gabung/pisah PDF, dan sebagian
besar memakai ulang infrastruktur yang sama. Kompres PDF sebelumnya sengaja
ditunda (out of scope Story 23).

## Goal

Empat tool berbasis browser: `/pdf-ke-jpg`, `/kompres-pdf`,
`/watermark-pdf`, `/tanda-tangan-pdf`. Semua tanpa upload.

## Keputusan awal

1. **PDF ke JPG:** render halaman dengan `pdf.js` ke canvas di resolusi yang
   dipilih (mis. 150 atau 300 dpi), hasil JPG/PNG, unduh ZIP.
2. **Kompres PDF dua mode:**
   - *Ringan:* simpan ulang dengan object streams dan hapus metadata
     (`pdf-lib`), teks tetap bisa dipilih.
   - *Kuat:* render ulang tiap halaman jadi gambar JPEG berkualitas
     tertentu lalu susun jadi PDF baru. Ukuran turun jauh, tapi teks tidak
     bisa dipilih lagi; ini dijelaskan jelas sebelum memproses.
   - Mode target ukuran (mis. "di bawah 1 MB") mencoba kualitas dan resolusi
     bertahap seperti kompres gambar.
3. **Watermark:** teks (ukuran, opasitas, rotasi, posisi) atau gambar, di
   semua halaman atau halaman tertentu, memakai `pdf-lib`.
4. **Tanda tangan:** gambar tanda tangan digambar di canvas atau diunggah
   (diproses lokal, latar dibuat transparan), lalu diletakkan dan
   di-resize di atas pratinjau halaman. Ini **bukan tanda tangan elektronik
   tersertifikasi**; halaman menjelaskannya.

## Scope

- Empat halaman dengan komponen dropzone, pratinjau `pdf.js`, worker, dan
  unduhan yang sudah ada.
- Peringatan ukuran file mengikuti batas lunak Story 23.
- FAQ ("apakah tanda tangan ini sah", "kenapa teks tidak bisa dipilih
  setelah kompres kuat"), JSON-LD, event standar.

## Monetisasi

Seperti Story 23: iklan di area tunggu dan di bawah tombol unduh (tidak
pernah mirip tombol unduh), donasi setelah unduhan berhasil, tanpa fitur
berbayar.

## Out of scope

- Tanda tangan elektronik tersertifikasi (PSrE) dan e-meterai.
- OCR, edit teks PDF, PDF ke Word.

## Acceptance Criteria

- [ ] Tidak ada request jaringan yang membawa isi file (diuji e2e seperti
      Story 23).
- [ ] Kompres kuat menghasilkan file lebih kecil untuk PDF hasil scan;
      kompres ringan tidak merusak teks yang bisa dipilih.
- [ ] Watermark dan tanda tangan tampil di posisi yang sama di pratinjau dan
      di PDF hasil, termasuk halaman yang diputar.
- [ ] Diuji di Chrome Android dan Safari iOS dengan PDF sekitar 10 halaman.
- [ ] Muncul di registry, meta/JSON-LD, sitemap; lint, test, e2e lulus.
