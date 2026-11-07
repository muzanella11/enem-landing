# Story 46: Tools Teks dan Akademik (Penghitung Kata, Ubah Huruf, Daftar Pustaka, Nilai Rapor)

**Status:** Done (2026-11-06). Catatan: daftar pustaka dicek terhadap pola contoh APA edisi 7 dan Cite Them Right (Harvard) dengan adaptasi Indonesia ("dkk.", "t.t.", "dan", "[Skripsi, ...]", "Tersedia di/Diakses"); belum dicocokkan ke satu pedoman kampus tertentu. Nama dengan satu kata (mis. Sugiyono) ditulis utuh; penulis lembaga lewat centang. Daftar pustaka hanya disimpan di localStorage bila pengguna mencentang "Simpan".

**Apps touched:** `enem-landing-tools`, `enem-landing-api` (seed registry)

**Depends on:** Story 20, Story 25, Story 35 (pola tool akademik)

## Background

Mahasiswa dan pelajar mencari penghitung kata, generator daftar pustaka,
dan kalkulator nilai terutama saat musim tugas dan skripsi. Volume tinggi,
tool ringan, dan cocok dengan kalkulator IPK (Story 35).

## Goal

Empat tool: `/penghitung-kata`, `/ubah-huruf` (kapital/kecil/judul),
`/buat-daftar-pustaka`, `/kalkulator-nilai-rapor`.

## Keputusan awal

1. **Teks pengguna tidak pernah meninggalkan browser**, termasuk untuk
   penghitung kata (tugas dan skripsi bisa bersifat pribadi).
2. **Daftar pustaka:** gaya APA edisi 7 dan Harvard dulu, untuk buku,
   artikel jurnal, situs web, dan skripsi/tesis; penulisan Indonesia
   ("dkk.", "t.t." untuk tanpa tahun) mengikuti pedoman yang dicantumkan.
   Hasil bisa disalin dan diurutkan alfabetis.
3. **Nilai rapor/akhir:** bobot komponen (tugas, UTS, UAS, praktik) bisa
   diatur; rata-rata, nilai yang dibutuhkan agar mencapai target.

## Scope

- Penghitung kata: kata, karakter (dengan/tanpa spasi), kalimat, paragraf,
  perkiraan waktu baca, kata paling sering.
- Ubah huruf: KAPITAL, kecil, Judul Kalimat, Huruf Awal Kata, dengan
  pengecualian kata sambung untuk judul Bahasa Indonesia.
- Daftar pustaka: form per jenis sumber, pratinjau, daftar yang bisa
  ditambah dan diurutkan, salin semua; simpan lokal opsional.
- Nilai rapor: komponen dan bobot, target nilai, hasil.
- FAQ, JSON-LD, cross-link ke IPK dan generator surat.

## Monetisasi

AdSense dan donasi. Blokir kategori joki tugas/skripsi bila filter
AdSense memungkinkan.

## Out of scope

- Cek plagiarisme, parafrase, atau pembuatan teks otomatis.
- Gaya sitasi selain APA dan Harvard di rilis pertama.

## Acceptance Criteria

- [x] Unit test penghitung kata untuk teks Indonesia (tanda baca, angka,
      kata berulang dengan tanda hubung).
- [x] Unit test format daftar pustaka per jenis sumber dicocokkan dengan
      contoh dari pedoman yang dicantumkan.
- [x] Muncul di registry (Story 25), punya meta/JSON-LD, masuk sitemap.
- [x] Tidak ada request jaringan yang membawa nilai input pengguna.
- [x] `nx lint`, `nx test`, dan e2e dasar (buka halaman, isi input, hasil muncul) lulus.

## Referensi perhitungan

Dasar perhitungan dan data yang dipakai tool ini (dicek 2026-11-06):

- APA Style edisi 7: contoh referensi buku, artikel jurnal, halaman web, dan skripsi/tesis (urutan penulis, tahun dalam kurung, judul miring, volume miring, DOI sebagai URL, sampai 20 penulis). https://apastyle.apa.org/style-grammar-guidelines/references/examples
- Harvard (Cite Them Right): format penulis (tahun) judul, "et al." (di sini "dkk.") untuk 4 penulis atau lebih, "Available at ... (Accessed: ...)" (di sini "Tersedia di ... (Diakses: ...)"). https://www.citethemrightonline.com/
- Ejaan Bahasa Indonesia yang Disempurnakan (EYD) Edisi V, Badan Bahasa: huruf kapital pada judul, kata tugas tetap kecil, kedua unsur kata ulang dikapitalkan. https://ejaan.kemdikbud.go.id/
- Waktu baca: 200 kata per menit (angka umum membaca dalam hati), hanya perkiraan.
- Nilai rapor: rata-rata tertimbang dengan bobot dinormalkan; nilai yang dibutuhkan = (target x total bobot - nilai tertimbang yang ada) / bobot komponen kosong.
- Kode: `app/utils/teks/index.ts`, `app/utils/teks/pustaka.ts`.
