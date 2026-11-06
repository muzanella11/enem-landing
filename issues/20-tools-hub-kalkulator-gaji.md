# Story 20: Tools Hub + Kalkulator Gaji Bersih (PPh 21 TER + BPJS)

**Status:** Done (2026-11-06). Catatan: batas upah JP 2026 belum terkonfirmasi dari sumber resmi (lihat Catatan implementasi).

**Apps touched:** app baru `enem-landing-tools` (Nuxt 4 + Tailwind), `compose.yml`,
`compose.prod.yml`, `compose.dev.yml`, `scripts/kill-ports.sh`, workflow CI/CD

## Background

VPS `enem-prod` (2 vCPU / 4GB RAM / 60GB SSD) saat ini menjalankan stack
prod dan dev enem-landing. Budget memori prod sudah disiplin (5 app @ 100M,
lihat header `compose.prod.yml`), dan MySQL/Redis ada di Aiven/Upstash, jadi
masih ada ruang untuk satu app ringan lagi. Hasil brainstorming sesi
2026-10-28: proyek berikutnya sebaiknya sesuatu yang berguna untuk banyak
orang, tapi beban komputasinya dikerjakan di browser pengguna supaya tidak
bersaing resource dengan prod.

Pilihan jatuh ke **hub "tools" berbahasa Indonesia**: kumpulan kalkulator
dan alat kecil yang banyak dicari. Story ini adalah fondasi hub-nya plus
tool pertama, yaitu kalkulator gaji bersih.

## Goal

1. Membuat app publik baru `enem-landing-tools` yang menjadi rumah semua
   tool, dengan halaman index tools dan pola halaman tool yang konsisten
   (SEO, layout, share).
2. Merilis tool pertama: **kalkulator gaji bersih karyawan** yang menghitung
   potongan BPJS dan PPh 21 skema TER (PMK 168/2023), termasuk
   rekonsiliasi Desember dan estimasi THR.

## Kenapa

- Kalkulator gaji bersih dicari tiap bulan (dan memuncak menjelang THR),
  sementara banyak kalkulator yang beredar belum mengikuti skema TER atau
  tidak menjelaskan cara hitungnya.
- Semua hitungan murni client-side: tidak ada data gaji pengguna yang
  dikirim ke server. Ini sekaligus nilai jual (privasi) dan menjaga beban
  server mendekati nol.
- Nyambung dengan blog (Story 19) dan skill `write-article`: artikel
  penjelasan PPh 21 TER bisa menautkan ke kalkulator, dan sebaliknya.

## Keputusan awal

> **Catatan (2026-11-06):** sebagian keputusan di bawah diubah oleh
> [Story 25](25-tools-cms-monitoring-registry.md): halaman tools memakai SWR
> cache (bukan prerender penuh), registry tool, status iklan, dan opsi
> donasi dibaca dari CMS (bukan data di app atau runtime config), dan tracking
> memakai tracker bersama dengan site `tools` tanpa session recording.

1. **App terpisah, bukan route di `enem-landing-web`.** Tools punya siklus
   rilis dan dependency sendiri (nanti ada WASM untuk PDF/gambar), dan tidak
   boleh menambah bundle landing page. Dibuat lewat `scripts/create-app.sh`
   mengikuti konvensi app Tailwind publik (port `8xxx`).
2. **Domain: `tools.muzanella.com` (subdomain, diputuskan user
   2026-10-28).** Wildcard cert `*.muzanella.com` sudah diminta oleh router
   `enem-landing-web` (lihat `compose.yml`), jadi cukup tambah router
   Traefik baru. Dev: `dev-tools.muzanella.com`. Alternatif subfolder
   `muzanella.com/tools` sudah dipertimbangkan dan tidak dipakai.
3. **Prerender penuh (SSG).** Semua halaman tool di-prerender saat build.
   Container tetap Nuxt/Nitro seperti app lain demi konsistensi pipeline,
   dengan limit memori prod 100M dan `NODE_OPTIONS: --max-old-space-size=60`
   sama seperti app lain.
4. **Tanpa backend, tanpa database.** Tidak ada endpoint baru di
   `enem-landing-api`. Tarif dan parameter pajak/BPJS disimpan sebagai data
   versioned di dalam app (mis. `app/data/tax/2026.ts`), dengan tahun
   berlaku yang jelas.
5. **Logika hitung dipisah dari UI** sebagai fungsi murni (mis.
   `app/utils/payroll/`) supaya bisa diuji unit secara menyeluruh dan dipakai
   ulang oleh tool lain (THR, pesangon, dll).
6. **Analytics** memakai mekanisme tracking yang sudah ada (Story 12-16)
   kalau memungkinkan, hanya event agregat (tool dibuka, tombol hitung
   ditekan). Nilai input gaji **tidak pernah** dikirim.

## Aturan hitung (wajib diverifikasi ulang saat implementasi)

Aturan di bawah adalah rangkuman per PMK 168/2023 dan regulasi BPJS yang
berlaku saat brainstorming. Angka yang berubah tiap tahun (terutama batas
upah Jaminan Pensiun) harus dicek ke sumber resmi sebelum rilis, dan sumber
beserta tanggal pengecekannya dicantumkan di halaman tool.

### BPJS

| Program | Ditanggung karyawan | Ditanggung pemberi kerja | Catatan |
|---|---|---|---|
| Kesehatan | 1% | 4% | Batas atas upah Rp12.000.000 |
| JHT | 2% | 3,7% | Tanpa batas upah |
| JP | 1% | 2% | Batas atas upah disesuaikan tiap tahun, cek nilai terbaru |
| JKK | - | 0,24% s.d. 1,74% | Tergantung tingkat risiko, input pengguna |
| JKM | - | 0,3% | |

### PPh 21 skema TER

- **Januari s.d. November:** PPh 21 = penghasilan bruto bulan itu x tarif
  TER bulanan. Kategori TER (A, B, C) ditentukan dari status PTKP
  (TK/0 s.d. K/3).
- **Penghasilan bruto** untuk TER mencakup gaji, tunjangan, serta premi yang
  dibayar pemberi kerja (BPJS Kesehatan 4%, JKK, JKM).
- **Desember (rekonsiliasi):** PPh 21 setahun dihitung dengan tarif Pasal 17
  atas penghasilan kena pajak (bruto setahun dikurangi biaya jabatan 5%
  maks Rp6.000.000/tahun, iuran JHT dan JP karyawan, dan PTKP), lalu
  dikurangi PPh 21 yang sudah dipotong Januari s.d. November.
- **PTKP:** TK/0 Rp54.000.000, tambahan kawin Rp4.500.000, tambahan
  Rp4.500.000 per tanggungan (maks 3).
- **Tarif Pasal 17:** 5% (s.d. Rp60 jt), 15% (Rp60 jt s.d. Rp250 jt),
  25% (Rp250 jt s.d. Rp500 jt), 30% (Rp500 jt s.d. Rp5 M), 35% (di atas Rp5 M).
- **THR/bonus** dipotong dengan TER di bulan dibayarkan (bruto bulan itu
  naik, sehingga tarif TER-nya ikut naik).
- **Tanpa NPWP:** tidak ada lagi tarif lebih tinggi 20% bila NIK sudah
  dipadankan; tool cukup memberi catatan, tidak perlu opsi khusus.

Tabel tarif TER kategori A, B, C ditulis lengkap sebagai data, bukan
diketik ulang di beberapa tempat.

## Scope

### Infra dan workspace

- Generate app `enem-landing-tools` via `scripts/create-app.sh`, port dev
  berikutnya di rentang `8xxx`, daftarkan ke `scripts/kill-ports.sh`.
- Service baru di `compose.yml` (router `Host(\`tools.muzanella.com\`)`,
  entrypoint `websecure`, certresolver `cloudflare`), override di
  `compose.prod.yml` (limit 100M + node tuning) dan `compose.dev.yml`
  (`dev-tools.muzanella.com`).
- Tambah image ke workflow CI/CD prod dan dev yang sudah ada, ikut alur
  `release`.
- Record DNS `tools` dan `dev-tools` di Cloudflare (dicatat di sini, dikerjakan
  manual oleh user).

### App `enem-landing-tools`

- `pages/index.vue`: daftar tool (kartu berisi nama, deskripsi singkat,
  link). Untuk saat ini isinya satu tool, tapi strukturnya sudah berbasis
  data (registry tool) supaya tool berikutnya cukup menambah satu entry.
- Layout bersama: header (link ke muzanella.com dan blog), footer dengan
  disclaimer "hasil estimasi, bukan nasihat pajak resmi".
- SEO per tool: `useSeoMeta`, canonical, JSON-LD `WebApplication` (atau
  `SoftwareApplication`) dan `FAQPage` untuk bagian tanya-jawab, sitemap
  dan `robots.txt`. Ikuti pola Story 17.

### Tool: kalkulator gaji bersih (`/kalkulator-gaji-bersih`)

- **Input:** gaji pokok, tunjangan tetap, tunjangan tidak tetap (opsional),
  status PTKP, tingkat risiko JKK, toggle ikut BPJS Kesehatan dan
  Ketenagakerjaan, bulan (Januari s.d. Desember), opsional THR/bonus di
  bulan tersebut.
- **Output:**
  - Ringkasan: gaji bersih yang diterima (take home pay).
  - Rincian potongan karyawan (BPJS per program, PPh 21).
  - Rincian iuran yang dibayar pemberi kerja (total biaya perusahaan).
  - Kategori dan tarif TER yang dipakai.
  - Mode "setahun": simulasi 12 bulan termasuk rekonsiliasi Desember,
    menunjukkan kenapa potongan Desember bisa jauh berbeda.
- **Penjelasan:** bagian "cara hitung" yang menampilkan langkah hitungan
  dengan angka pengguna sendiri, plus FAQ singkat.
- **Link berbagi dibuat hanya saat tombol "Bagikan" ditekan**, bukan
  sinkron otomatis ke query string. Alasannya: script iklan (lihat
  Monetisasi) membaca URL halaman, jadi nilai gaji di query string sama
  saja dengan mengirimnya ke pihak ketiga. Link berbagi menaruh state di
  fragment (`#...`), dan saat dibuka state dibaca lalu fragment dihapus
  dari address bar sebelum slot iklan dimuat. Nilai default kosong; tidak
  ada yang disimpan ke server.
- Input angka dengan format Rupiah (pemisah ribuan) dan aman untuk mobile.

## Monetisasi

### Strategi tingkat hub (berlaku untuk semua tool, dibangun di story ini)

**Affiliate ditunda** (keputusan user 2026-11-06). Pendapatan hub untuk
saat ini hanya dari dua sumber:

1. **Iklan display (Google AdSense)** setelah situs punya cukup konten dan
   lolos review. RPM iklan untuk trafik Indonesia rendah, jadi iklan baru
   berarti di trafik besar; karena itu tool dengan volume tinggi dan
   musiman (THR, Ramadan) diprioritaskan. Iklan ditaruh di bawah hasil dan
   di sidebar desktop, tidak pernah di antara input dan tombol hitung.
2. **Donasi "traktir kopi"** lewat platform donasi, tanpa popup.
3. **Fitur Pro berbayar** hanya untuk tool yang memang punya nilai tambah
   berkelanjutan (lihat Story 24). Tidak untuk kalkulator.

Affiliate bisa dibuka lagi sebagai story terpisah setelah ada data trafik.

#### Platform donasi

Hasil cek 2026-11-06 (wajib dicek ulang ke halaman resmi saat
implementasi):

| Platform | Potongan per donasi | Catatan |
|---|---|---|
| Saweria | sekitar 5% | Biaya pencairan sekitar Rp5.000; beberapa sumber menyebut biaya layanan tambahan |
| Trakteer | 5% | Plus biaya metode bayar (QRIS sekitar 0,77%, e-wallet sekitar 2%, VA sekitar Rp4.000), pencairan sekitar Rp5.000 |
| SociaBuzz | 5% | Biaya penarikan lebih rendah menurut halaman resmi (bank Rp4.500, GoPay Rp1.000) |
| QRIS statis milik sendiri | Hanya MDR QRIS, jauh di bawah 5% | Tanpa halaman profil/notifikasi; butuh akun merchant QRIS. Cek ketentuan MDR BI terbaru |

Keputusan:

- **Komponen donasi tidak terikat satu platform.** Daftar opsi donasi
  (label, URL, gambar QRIS opsional) dikonfigurasi dari CMS (Story 25),
  sehingga platform bisa diganti atau ditambah tanpa deploy.
- **Platform utama: SociaBuzz** (keputusan user 2026-11-06), karena
  mendukung donasi dalam mata uang asing selain Rupiah, sehingga pengunjung
  luar negeri juga bisa berdonasi. QRIS statis bisa ditambahkan belakangan
  sebagai opsi kedua lewat CMS.

#### Aturan yang berlaku di semua tool

- **Daftar kategori iklan yang diblokir:** pinjol, judi/slot, investasi
  bodong, dan produk kripto berisiko tinggi (pakai fitur blocking kategori
  AdSense). Audiens tool keuangan rentan, dan satu iklan pinjol cukup
  merusak kepercayaan.
- **Tidak ada iklan yang mirip tombol aksi** (unduh, hitung, bagikan).
- **State tool tidak pernah ada di URL saat slot iklan dimuat** (lihat pola
  link berbagi di atas).
- **Core Web Vitals tetap prioritas:** slot iklan punya tinggi tetap
  (tanpa CLS), dimuat lazy setelah interaksi atau saat terlihat.
- **Consent:** banner persetujuan cookie untuk iklan/analytics sesuai
  UU PDP, iklan non-personal bila pengguna menolak.

Infrastruktur yang dibuat di story ini (dipakai ulang tool berikutnya):

- Komponen `AdSlot` (lazy, ukuran tetap, bisa dimatikan tanpa rebuild;
  sumber status iklan lihat Story 25).
- Komponen `DonationCta`: tautan di footer, plus varian teks kecil yang
  bisa ditaruh setelah hasil/unduhan. Bukan popup, bukan overlay.
- Event klik donasi ke tracking yang sudah ada (Story 12-16), hanya nama
  tool dan posisi CTA.

### Monetisasi kalkulator gaji bersih

- **Iklan:** trafik musiman tinggi menjelang THR, rekonsiliasi Desember,
  dan saat pengumuman kenaikan UMP, cocok untuk AdSense.
- **Donasi:** teks kecil setelah hasil hitung tampil.
- **Lisensi widget (tahap lanjut):** versi embed kalkulator untuk situs
  HR, portal lowongan, dan blog keuangan, gratis dengan tautan balik
  (backlink, bagus untuk SEO) atau berbayar tanpa branding.
- **Konten pendukung di blog** (Story 19) dengan internal link ke
  kalkulator untuk menaikkan trafik organik.

## Out of scope

- Tool lain, masing-masing jadi story sendiri setelah fondasi ini ada:
  Story 21 (simulasi KPR), 22 (kalkulator zakat), 23 (alat PDF dan gambar),
  24 (invoice dan kwitansi UMKM).
- Akun pengguna, simpan riwayat hitungan, atau backend apa pun.
- Perhitungan PPh 21 untuk bukan pegawai, pegawai tidak tetap harian,
  pensiunan, atau pesangon.
- Skema pajak di luar TER (mis. tahun pajak sebelum 2024).
- Multi-bahasa; konten hanya Bahasa Indonesia.

## Pertanyaan terbuka

1. **Batas upah JP tahun berjalan** dan apakah ada perubahan aturan PPh 21
   atau tarif BPJS setelah brainstorming. Wajib dicek ke sumber resmi.

## Acceptance Criteria

- [ ] App `enem-landing-tools` jalan lokal lewat `nx`, terdaftar di
      `kill-ports.sh`, dan bisa di-build jadi image Docker seperti app lain.
- [ ] Stack dev dan prod menyajikan tools hub di domain masing-masing dengan
      HTTPS, tanpa menaikkan limit memori app lain.
- [ ] Halaman index tools menampilkan kalkulator gaji bersih dari registry
      tool.
- [ ] Unit test fungsi hitung mencakup minimal: tiap kategori TER (A, B, C),
      batas atas upah BPJS Kesehatan dan JP, rekonsiliasi Desember (kurang
      bayar dan lebih bayar), bulan dengan THR, dan kasus gaji di bawah
      PTKP. Angka acuan test dicocokkan dengan contoh hitungan resmi DJP
      bila tersedia.
- [ ] Hasil kalkulator untuk minimal 3 skenario dicocokkan manual dengan
      kalkulator atau contoh resmi, dan hasil pencocokannya dicatat di PR.
- [ ] Tidak ada request jaringan yang membawa nilai input gaji (diverifikasi
      lewat tab Network).
- [ ] Hasil bisa dibagikan via link dan terisi ulang dengan benar saat
      dibuka; fragment sudah terhapus dari address bar sebelum slot iklan
      dimuat.
- [ ] Komponen `AdSlot` dan `DonationCta` tersedia dan dipakai di
      kalkulator gaji; slot iklan bisa dimatikan tanpa rebuild.
- [ ] Tidak ada CLS dari slot iklan (CLS di bawah 0,1 di Lighthouse).
- [ ] Banner consent berfungsi; menolak consent menghasilkan iklan
      non-personal dan tidak ada cookie iklan personal.
- [ ] Halaman tool punya meta tag, canonical, JSON-LD, masuk sitemap, dan
      skor Lighthouse mobile (Performance, SEO, Accessibility) minimal 90.
- [ ] Sumber aturan dan tanggal pengecekannya tampil di halaman tool.
- [ ] `nx lint` dan `nx test` lulus untuk app baru; e2e dasar (buka halaman,
      isi input, hasil muncul) ditambahkan sesuai konvensi per-app.

## Catatan implementasi (2026-11-06)

- App `apps/enem-landing-tools` (port 8002), dibuat lewat `scripts/create-app.sh`.
  Service baru di `compose.yml`, `compose.prod.yml` (limit 100M), `compose.dev.yml`
  (`dev-tools.muzanella.com`), `compose.local.yml`, target `enem-landing-tools` di
  `Dockerfile`, dan masuk `build-push.yml` serta `e2e.yml`.
- Aturan pajak/BPJS ada di `app/data/tax/2026.ts`, logika di `app/utils/payroll/`.
  Kategori dan batas TER A/B/C sudah dicocokkan dengan sumber per 2026-11-06.
- **Pertanyaan terbuka 1 belum tuntas:** batas upah JP memakai angka resmi Maret
  2025 (Rp10.547.400). Penyesuaian 2026 belum ditemukan di sumber resmi; catatan ini
  tampil di halaman tool.
- Link berbagi: fragment dihapus dari address bar oleh plugin
  `01.share-fragment.client.ts`, termasuk setelah navigasi awal vue-router (yang
  sempat menulis ulang hash). Slot iklan menunggu sampai fragment benar-benar hilang.
- Donasi: komponen `DonationCta`, opsi dikelola dari CMS. Baris SociaBuzz sudah
  di-seed tanpa URL; isi URL halaman SociaBuzz di CMS supaya CTA tampil.
- **DNS selesai (2026-11-06):** record `tools` dan `dev-tools` sudah ditambahkan
  user di Cloudflare dan terverifikasi resolve lewat proxy Cloudflare, sama
  seperti subdomain lain. Router Traefik dan wildcard cert sudah disiapkan di
  compose, jadi tidak ada langkah DNS/TLS tambahan; situs live setelah deploy
  pertama yang menyertakan image `enem-landing-tools`.
- Masih manual oleh user: ID slot AdSense setelah AdSense disetujui (akan
  dipindah ke CMS di Story 27), dan URL SociaBuzz di CMS.

## Referensi perhitungan

Dasar perhitungan dan data yang dipakai tool ini (dicek 2026-11-06):

- PP 58/2023: tarif efektif rata-rata (TER) PPh 21 kategori A/B/C. https://jdih.kemenkeu.go.id/
- PMK 168/2023: tata cara pemotongan PPh 21 (TER Januari-November, hitung ulang Desember, biaya jabatan 5% maks Rp6 juta/tahun, PTKP). https://jdih.kemenkeu.go.id/
- BPJS Ketenagakerjaan: iuran JHT, JP, JKK, JKM dan batas upah Jaminan Pensiun (angka Maret 2025, Rp10.547.400). https://www.bpjsketenagakerjaan.go.id/
- Perpres 64/2020: iuran BPJS Kesehatan 5% (1% pekerja, 4% pemberi kerja), batas upah Rp12 juta. https://www.bpjs-kesehatan.go.id/
- Data di kode: `apps/enem-landing-tools/app/data/tax/2026.ts`.
