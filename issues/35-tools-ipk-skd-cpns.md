# Story 35: Kalkulator IPK dan Simulasi Nilai SKD CPNS

**Status:** Done (2026-11-06). Catatan: kategori registry baru `pendidikan`. SKD memakai aturan seleksi 2024 (KepmenPANRB 321/2024) dengan label tahun yang jelas; angka diambil dari detikEdu dan Okezone yang saling cocok, dokumen KepmenPANRB-nya belum dibaca langsung. Aturan seleksi berikutnya belum terbit per tanggal ini. Batas predikat IPK (2,76 / 3,01 / 3,51) adalah aturan umum dan belum dicocokkan ke peraturan resmi. IPK tersimpan di localStorage dengan tombol hapus dan ekspor/impor JSON; SKD tidak disimpan.

**Apps touched:** `enem-landing-tools`, `enem-landing-api` (seed registry)

**Depends on:** Story 20, Story 25

## Background

Mahasiswa mencari "hitung IPK" sepanjang semester, dan pelamar CPNS mencari
"passing grade SKD" serta "simulasi nilai SKD" setiap musim seleksi. Tool
kompres foto dan pas foto (Story 23) sudah membawa trafik pelamar CPNS;
tool ini melengkapi kebutuhan mereka.

## Goal

1. `/kalkulator-ipk`: IPS per semester dan IPK kumulatif.
2. `/simulasi-nilai-skd`: hitung skor TWK, TIU, TKP dan cek terhadap
   nilai ambang batas (passing grade).

## Keputusan awal

1. **Skala nilai IPK bisa diatur:** bawaan skala umum (A = 4, AB/A- dst.
   sesuai pilihan), dengan preset beberapa skala yang lazim dan opsi
   kustom, karena tiap kampus berbeda.
2. **Aturan SKD sebagai data per tahun seleksi** (`app/data/cpns/`): bobot
   soal (TWK dan TIU benar = 5, salah/kosong = 0; TKP 1 sampai 5 per soal),
   jumlah soal, dan nilai ambang batas per formasi dari PermenPANRB yang
   berlaku. Nilai untuk seleksi 2027 dicek begitu aturannya terbit; sebelum
   itu ditampilkan aturan tahun sebelumnya dengan label jelas.
3. Riwayat mata kuliah IPK boleh disimpan lokal (localStorage) dengan
   tombol hapus, karena berguna lintas semester; SKD tidak disimpan.

## Scope

- IPK: daftar mata kuliah (nama, SKS, nilai) per semester, IPS dan IPK,
  simulasi "nilai yang dibutuhkan semester depan untuk mencapai IPK X",
  predikat kelulusan (cum laude dll) mengikuti aturan umum dengan catatan
  bahwa tiap kampus bisa berbeda. Impor/ekspor JSON.
- SKD: input jumlah benar TWK/TIU dan total skor TKP (atau skor per
  subtes), formasi (umum, cumlaude, disabilitas, dan formasi khusus lain
  sesuai aturan), hasil lulus/tidak per subtes dan total, selisih ke
  ambang batas.
- FAQ, sumber, JSON-LD, event standar, cross-link ke kompres gambar dan pas
  foto (Story 23).

## Monetisasi

AdSense dan donasi. Blokir kategori "joki" dan bimbel dengan klaim jaminan
lulus bila filter AdSense memungkinkan.

## Out of scope

- Bank soal atau tryout CPNS.
- Perhitungan nilai SKB dan integrasi nilai akhir per instansi.

## Acceptance Criteria

- [x] Unit test IPK (SKS berbeda, nilai kustom, mata kuliah diulang dengan
      nilai terbaik) dan simulasi target IPK.
- [x] Unit test SKD: tepat di ambang batas, di bawah satu subtes, dan tiap
      jenis formasi pada data aturan yang dipakai.
- [x] Sumber aturan SKD dan tahun berlakunya tampil di halaman.
- [x] Muncul di registry, meta/JSON-LD, sitemap; lint, test, e2e lulus.

## Referensi perhitungan

Dasar perhitungan dan data yang dipakai tool ini (dicek 2026-11-06):

- SKD: KepmenPANRB 321/2024 tentang Nilai Ambang Batas SKD Pengadaan PNS 2024 (umum TWK 65, TIU 80, TKP 166; cumlaude/diaspora total 311 dan TIU 85; disabilitas, Papua, daerah tertinggal total 286 dan TIU 60), dikutip dari detikEdu (18 Okt 2024) dan Okezone (5 Agu 2024). https://www.detik.com/edu/detikpedia/d-7594594/nilai-ambang-batas-skd-cpns-2024-cek-skormu dan https://economy.okezone.com/read/2024/08/05/320/3044349/nilai-ambang-batas-skd-cpns-2024-ini-rincian-lengkapnya?page=all
- Jumlah soal dan penilaian (TWK 30, TIU 35 benar = 5; TKP 45 soal nilai 1-5): detikEdu, sumber yang sama.
- IPK: rata-rata tertimbang SKS; batas predikat 2,76 / 3,01 / 3,51 adalah aturan umum yang belum dicocokkan ke peraturan resmi.
- Data di kode: `app/data/cpns/skd.ts`, `app/data/ipk.ts`.
