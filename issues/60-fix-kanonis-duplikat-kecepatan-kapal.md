# Story 60: Artikel Kecepatan Kapal Dianggap Duplikat oleh Google

**Status:** Done (konten). Tinggal langkah manual setelah merge: update di CMS, minta pengindeksan, validasi perbaikan.

**Apps touched:** tidak ada (konten artikel di `articles/kecepatan-kapal-knot/`)

**Depends on:** Story 20-24 (tools hub dan artikel tools)

## Background

Email Search Console 2026-11-16: alasan baru halaman tidak diindeks,
"Duplikat, Google memilih versi kanonis yang berbeda dengan pengguna".
Hanya 1 halaman yang terkena (pertama terdeteksi 10/11/26):

|                             | URL                                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------- |
| Halaman                     | `https://muzanella.com/blog/kecepatan-kapal-dalam-knot-cara-menghitung-waktu-tempuh-dan-bahan-bakar` |
| Kanonis yang dinyatakan     | URL yang sama (sudah benar)                                                                          |
| Kanonis yang dipilih Google | `https://muzanella.com/blog/cara-mengubah-foto-menjadi-pdf-ukuran-a4-atau-f4`                        |
| Crawl terakhir              | 9 Nov 2026, Smartphone Googlebot, pengambilan berhasil                                               |

Hasil pemeriksaan teknis (2026-11-16):

- Kedua URL mengembalikan 200 dengan `<title>` dan `<link rel="canonical">`
  masing-masing yang benar, tanpa `noindex`. `cf-cache-status: DYNAMIC`,
  jadi Cloudflare tidak menyimpan HTML.
- Halaman blog tidak memakai route cache (`swr`) di
  `apps/enem-landing-web/nuxt.config.ts`, dan `enem-landing-api` tidak
  meng-cache post per slug (`cache.constants.ts` tidak punya key blog).
  Tidak ada jalur di mana slug A bisa menerima isi slug B.
- Isi kedua artikel berbeda total (kapal vs foto ke PDF).

Kesimpulan: bukan bug teknis. Artikel kapal adalah salah satu artikel
terpendek (sekitar 330 kata isi), sedangkan bagian halaman yang sama di
semua artikel (header, ShareBar, BuyMeCoffee, Related Posts, footer) cukup
besar. Untuk halaman setipis ini Google kadang mengelompokkannya dengan
halaman lain di situs yang sama dan memilih salah satu sebagai kanonis,
bahkan bila topiknya tidak berhubungan. Gejala yang sama terlihat di
laporan yang lebih besar: 940 "Ditemukan, saat ini tidak diindeks" dan
115 "Di-crawl, saat ini tidak diindeks", yang umumnya sinyal kualitas
untuk 87 artikel tools yang terbit sekaligus pada 2026-11-07.

## Goal

Artikel kecepatan kapal punya isi yang cukup unik dan bermanfaat sehingga
Google mengindeksnya sebagai halaman sendiri.

## Scope

1. Perluas `articles/kecepatan-kapal-knot/kecepatan-kapal-knot.md`
   dengan isi yang tidak ada di artikel lain:
   - asal satuan knot dan mil laut (1 mil laut = 1 menit busur lintang),
     beda mil laut (1.852 m) dengan mil darat (1.609,344 m);
   - tabel konversi knot ke km/jam dan m/s;
   - pengaruh kecepatan terhadap konsumsi bahan bakar (perkiraan hukum
     pangkat tiga) dengan contoh angka lanjutan dari contoh yang sudah ada;
   - kesalahan umum saat menghitung;
   - FAQ singkat.
2. Perbarui `excerpt`/`metaDescription` bila perlu, tanpa mengubah slug
   CMS (URL tetap sama).
3. Tidak ada perubahan kode aplikasi.

## Di luar scope

- Memperbaiki kualitas 87 artikel tools lainnya secara massal. Dicatat
  sebagai tindak lanjut: prioritaskan artikel dengan isi di bawah sekitar
  400 kata.
- 404, 4xx, dan halaman pengalihan di laporan yang sama.

## Langkah setelah merge (manual)

1. Salin isi artikel baru ke CMS (edit post yang sudah ada, slug tetap).
2. Search Console: Inspeksi URL, lalu "Minta pengindeksan".
3. Di laporan "Duplikat, Google memilih versi kanonis yang berbeda",
   klik "Validasi perbaikan".

## Referensi perhitungan

- 1 knot = 1 mil laut per jam = 1.852 m/jam = 1,852 km/jam
  = 0,5144 m/s (BIPM, satuan non-SI yang diterima).
- Waktu (jam) = jarak (mil laut) / kecepatan (knot).
- Bahan bakar per jam sebanding kira-kira dengan kecepatan pangkat tiga
  (perkiraan "cube law" untuk kapal displacement). Bahan bakar per
  perjalanan (jarak tetap) = per jam x waktu, sehingga sebanding dengan
  kecepatan pangkat dua. Contoh: turun dari 12 ke 10 knot,
  per jam x (10/12)^3 = 0,579, waktu x 1,2, per perjalanan
  x (10/12)^2 = 0,694.

## Acceptance Criteria

- [x] Artikel kapal diperluas dan lolos checklist `write-article`
      (tanpa em dash, tanpa frasa filler).
- [x] Angka di tabel dan contoh sesuai Referensi perhitungan.
- [ ] Artikel diperbarui di CMS (manual, setelah merge).
- [ ] Minta pengindeksan dan validasi perbaikan di Search Console.
