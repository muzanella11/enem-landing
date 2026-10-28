# Story 24: Generator Invoice dan Kwitansi UMKM

**Apps touched:** `enem-landing-tools`

**Depends on:** Story 20 (fondasi tools hub), opsional Story 23 (pola Web
Worker dan unduhan file)

## Background

Banyak pelaku UMKM dan freelancer masih membuat invoice di Word/Excel atau
aplikasi berbayar hanya untuk beberapa tagihan per bulan. Kwitansi
lengkap dengan "terbilang" juga sering dicari. Semua ini bisa dibuat di
browser tanpa akun dan tanpa server.

## Goal

Dua tool: `/buat-invoice` dan `/buat-kwitansi`, menghasilkan PDF yang rapi,
dengan data tersimpan di perangkat pengguna saja.

## Keputusan awal

1. **Tanpa akun dan tanpa backend.** Profil usaha (nama, alamat, logo,
   rekening) dan riwayat dokumen disimpan di `localStorage`/IndexedDB
   perangkat pengguna, dengan fitur ekspor/impor JSON untuk pindah
   perangkat.
2. **PDF dibuat di browser** dengan `pdf-lib` (konsisten dengan Story 23),
   bukan dengan dialog print browser, supaya hasilnya sama di semua
   perangkat.
3. **Utility "terbilang"** (angka ke kata Bahasa Indonesia, mis. "satu juta
   dua ratus ribu rupiah") dibuat sebagai fungsi murni teruji, karena
   akan dipakai ulang tool lain. Bisa juga jadi tool kecil sendiri
   `/terbilang`.
4. **Pajak dibuat fleksibel**: baris PPN dan PPh opsional dengan tarif yang
   bisa diisi, tidak menebak aturan perpajakan pengguna. Tool menjelaskan
   bahwa ini bukan e-Faktur.

## Scope

### Invoice (`/buat-invoice`)

- Profil usaha (sekali isi, tersimpan lokal): nama, alamat, kontak, logo
  (diproses lokal, di-resize), rekening bank/QRIS (gambar).
- Data pelanggan, nomor invoice (auto increment lokal, format bisa diatur),
  tanggal terbit dan jatuh tempo.
- Item: deskripsi, qty, satuan, harga, diskon per item.
- Ringkasan: subtotal, diskon total, baris pajak opsional, ongkir, total,
  terbilang.
- Catatan dan syarat pembayaran.
- 2 sampai 3 template tampilan, preview langsung, unduh PDF.
- Riwayat invoice lokal: duplikat, tandai lunas.

### Kwitansi (`/buat-kwitansi`)

- Telah terima dari, uang sejumlah (otomatis terbilang), untuk pembayaran,
  tempat/tanggal, nama penerima, kolom materai (penanda saja) bila nominal
  di atas batas wajib bea meterai yang berlaku.
- Unduh PDF, bisa beberapa kwitansi per halaman A4.

### Terbilang (`/terbilang`)

- Input angka, output kata, tombol salin.

## Monetisasi

Satu-satunya tool di hub ini dengan pengguna yang memakai berulang untuk
kebutuhan bisnis, jadi kandidat terbaik untuk model freemium. Mengikuti
aturan hub di Story 20.

### Story ini (gratis penuh)

- Semua fitur di Scope gratis, tanpa watermark yang mengganggu. Footer PDF
  berisi teks kecil "Dibuat dengan tools.muzanella.com" yang bisa
  dimatikan (default menyala). Ini jadi kanal promosi gratis karena PDF
  dikirim ke pelanggan pengguna.
- **Affiliate:** payment gateway dan QRIS untuk UMKM, software akuntansi
  (untuk pengguna yang sudah butuh lebih dari invoice), materai
  elektronik. Ditampilkan di dashboard riwayat, bukan di PDF.
- **Iklan display** hanya di halaman form, tidak pernah di dalam PDF atau
  preview.

### Tahap lanjut: paket Pro (story terpisah)

Fitur yang butuh server dan karena itu wajar berbayar, dengan pembayaran
sekali atau bulanan murah lewat QRIS/payment gateway:

- Sinkronisasi cloud antar perangkat dan backup.
- Invoice berulang (recurring) dan pengingat jatuh tempo.
- Kirim invoice lewat email dari sistem dengan link pembayaran.
- Template premium dan beberapa profil usaha.

Paket Pro butuh akun pengguna dan backend, yang berdampak ke
`enem-landing-account-api` (saat ini single-admin) dan resource VPS.
Dievaluasi setelah ada data pemakaian dari versi gratis.

## Out of scope

- e-Faktur, integrasi DJP, atau validasi NPWP/NIK.
- Kirim invoice lewat email/WhatsApp dari server (cukup tombol share dari
  perangkat bila didukung Web Share API).
- Sinkronisasi antar perangkat lewat cloud.
- Pembukuan, laporan keuangan, stok barang.

## Acceptance Criteria

- [ ] Unit test terbilang: 0, satuan, belasan, "seratus"/"seribu",
      jutaan, miliaran, triliunan, dan angka desimal/sen.
- [ ] Unit test perhitungan total invoice (diskon, pajak, pembulatan).
- [ ] PDF yang dihasilkan tampil sama di Chrome, Safari, dan pembaca PDF
      desktop, dengan logo dan karakter Rupiah benar.
- [ ] Data tersimpan setelah reload, bisa diekspor lalu diimpor di browser
      lain dengan hasil identik.
- [ ] Tidak ada request jaringan yang membawa data invoice/kwitansi.
- [ ] Tool muncul di registry, punya meta/JSON-LD, masuk sitemap.
- [ ] `nx lint`, `nx test`, dan e2e dasar lulus.
