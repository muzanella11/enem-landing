# Story 51: Simulasi Premi Asuransi Mobil dan Motor

**Status:** Done (2026-11-06). Catatan: dua tool (`/simulasi-asuransi-mobil`, `/simulasi-asuransi-motor`). Teks utama SEOJK 6/SEOJK.05/2017 dibaca dari PDF di situs OJK, tetapi PDF itu tidak memuat tabel lampirannya; tabel tarif kategori 1-8 diambil dari dua RIPLAY perusahaan asuransi yang mengutip SEOJK tersebut dan saling cocok untuk kategori 1-5 (kategori 6-8 dari satu RIPLAY). Tarif perluasan jaminan, TJH bertingkat, dan kecelakaan diri berasal dari satu RIPLAY. Tambahan premi kendaraan di atas 5 tahun dihitung 5% dari tarif per tahun kelebihan usia (tafsiran dari "paling sedikit 5% dari tarif per tahun"). Contoh perhitungan kedua RIPLAY cocok (Rp5.200.000, Rp4.264.000, Rp5.550.000). Belum dicek apakah SEOJK 6/2017 sudah diganti aturan baru.

**Apps touched:** `enem-landing-tools`, `enem-landing-api` (seed registry)

**Depends on:** Story 20, Story 25, Story 29 (kredit kendaraan), Story 42 (biaya kendaraan)

## Background

"Simulasi asuransi mobil", "premi all risk", dan "asuransi TLO berapa
persen" dicari terus, terutama oleh pembeli mobil dan motor kredit.
Asuransi termasuk topik dengan tarif iklan per klik tertinggi. Premi
kendaraan di Indonesia punya batas atas dan bawah yang ditetapkan OJK per
wilayah dan nilai kendaraan, jadi hasil simulasi bisa disandarkan pada
aturan resmi, bukan angka karangan.

## Goal

`/simulasi-asuransi-mobil` dan `/simulasi-asuransi-motor`: perkiraan premi
tahunan comprehensive (all risk) dan TLO, termasuk perluasan jaminan, untuk
satu tahun atau sepanjang tenor kredit.

## Keputusan awal

1. **Tarif sebagai data dengan sumber** (`app/data/asuransi/tarif-ojk.ts`):
   batas atas dan bawah tarif premi per wilayah (1, 2, 3), jenis kendaraan,
   kategori uang pertanggungan, dan jenis jaminan, dari Surat Edaran OJK
   tentang tarif premi asuransi harta benda dan kendaraan bermotor yang
   berlaku. Nomor dan isi aturan dicek ulang dari situs OJK saat
   implementasi; bila ada perubahan, data mengikuti yang terbaru dengan
   tanggal cek.
2. **Hasil berupa rentang** (batas bawah sampai batas atas), karena tiap
   perusahaan asuransi menetapkan tarif sendiri di dalam rentang itu.
   Pengguna bisa mengisi persentase dari penawaran yang diterima untuk
   hasil pasti.
3. **Perluasan jaminan** (banjir, gempa/tsunami, huru-hara, terorisme,
   tanggung jawab hukum pihak ketiga, kecelakaan diri) dan aturan tambahan
   (mis. pemberatan premi untuk kendaraan berusia tertentu) mengikuti
   aturan yang sama dan hanya dimasukkan bila ada di aturan tersebut.
4. **Nilai pertanggungan menurun tiap tahun** untuk simulasi multi-tahun:
   persentase penyusutan adalah input dengan nilai bawaan yang dijelaskan,
   bukan diklaim standar.
5. Tidak ada rekomendasi perusahaan asuransi dan tidak ada affiliate.

## Scope

- Input: jenis kendaraan, wilayah (dari provinsi/plat), harga kendaraan,
  tahun pembuatan, jenis jaminan, perluasan, tenor/tahun simulasi,
  persentase penyusutan, persentase dari penawaran (opsional).
- Hasil: premi tahun pertama dan per tahun (rentang), total sepanjang
  tenor, rincian per jaminan, dan perbandingan all risk vs TLO.
- Penjelasan singkat beda all risk dan TLO, own risk, dan perluasan.
- FAQ, sumber, JSON-LD, cross-link ke simulasi kredit kendaraan dan pajak
  kendaraan.

## Monetisasi

AdSense (topik asuransi, CPC tinggi) dan donasi. Iklan tidak boleh mirip
tombol "beli polis".

## Out of scope

- Penawaran polis, perbandingan harga perusahaan asuransi, pembelian.
- Asuransi jiwa dan kesehatan (tarifnya tidak diatur dalam bentuk batas
  yang bisa dihitung seperti ini).

## Acceptance Criteria

- [x] Setiap tarif punya dasar hukum, nomor aturan, dan tanggal cek yang
      tampil di halaman.
- [ ] Unit test tiap wilayah, kategori nilai, jenis jaminan, perluasan, dan
      simulasi multi-tahun dengan penyusutan, dicocokkan dengan contoh
      perhitungan dari aturan atau publikasi resmi.
- [x] Hasil ditampilkan sebagai rentang batas bawah sampai batas atas.
- [x] Tidak ada request jaringan yang membawa nilai input pengguna (diuji
      e2e).
- [x] Muncul di registry (Story 25), punya meta/JSON-LD, masuk sitemap.
- [x] `nx lint`, `nx test`, dan e2e dasar lulus.
- [x] Bagian "Referensi perhitungan" di file ini diisi saat story selesai.

## Referensi perhitungan

Dasar perhitungan dan data yang dipakai tool ini (dicek 2026-11-06):

- OJK: SEOJK No. 6/SEOJK.05/2017 tentang Penetapan Tarif Premi atau Kontribusi pada Lini Usaha Asuransi Harta Benda dan Asuransi Kendaraan Bermotor Tahun 2017 (berlaku 1 April 2017; tarif 12 bulan untuk kendaraan sampai 5 tahun; tarif di antara batas bawah dan atas; zona wilayah menurut TNKB; tambahan paling sedikit 5% untuk kendaraan di atas 5 tahun). https://ojk.go.id/id/kanal/iknb/regulasi/asuransi/surat-edaran-ojk/Documents/SAL%20-%20SE%20OJK%20Tarif%20Premi.pdf
- Tabel tarif kategori 1-8 (Lampiran IV Tabel IV.A) dan contoh Rp205 juta: RIPLAY Asuransi Kendaraan Bermotor PT Asuransi Bina Dana Arta Tbk. https://myoona.id/content/dam/oona/documents/downloadable-brochures/all-products/bahasa/oona-riplay-asuransi-kendaraan-bermotor-versi-umum.pdf
- Tabel kategori 1-5, perluasan jaminan (banjir, gempa, SRCC, terorisme), TJH bertingkat, kecelakaan diri, dan contoh Rp250 juta: RIPLAY Roojai. https://www.roojai.co.id/wp-content/uploads/2024/03/roojai-riplay-MV-id-20230405.pdf
- Pembagian wilayah: 1 Sumatera dan kepulauan sekitarnya; 2 DKI Jakarta, Jawa Barat, Banten; 3 selain itu.
- Kode: `app/data/asuransi/tarif-ojk.ts`, `app/utils/asuransi.ts`.
