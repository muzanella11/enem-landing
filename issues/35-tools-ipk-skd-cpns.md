# Story 35: Kalkulator IPK dan Simulasi Nilai SKD CPNS

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

- [ ] Unit test IPK (SKS berbeda, nilai kustom, mata kuliah diulang dengan
      nilai terbaik) dan simulasi target IPK.
- [ ] Unit test SKD: tepat di ambang batas, di bawah satu subtes, dan tiap
      jenis formasi pada data aturan yang dipakai.
- [ ] Sumber aturan SKD dan tahun berlakunya tampil di halaman.
- [ ] Muncul di registry, meta/JSON-LD, sitemap; lint, test, e2e lulus.
