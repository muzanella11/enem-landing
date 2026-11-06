# Story 29: Simulasi KTA dan Kredit Kendaraan

**Status:** Done (2026-11-06). Catatan: pencocokan 3 skenario dengan simulasi resmi leasing/bank belum dilakukan; konversi flat ke efektif diuji terhadap fungsi RATE spreadsheet.

**Apps touched:** `enem-landing-tools`, `enem-landing-api` (seed registry)

**Depends on:** Story 21 (`app/utils/loan`), Story 25

## Background

Topik kredit punya nilai iklan tinggi dan volume pencarian besar ("simulasi
kredit motor", "cicilan mobil", "simulasi KTA"). Story 21 sudah membuat
`utils/loan` yang generik untuk anuitas, efektif, dan flat, sehingga dua
tool ini sebagian besar adalah UI baru.

## Goal

Dua tool: `/simulasi-kredit-kendaraan` (motor dan mobil) dan
`/simulasi-kta`, dengan perbandingan bunga flat vs efektif yang sering
membingungkan orang.

## Keputusan awal

1. Memakai ulang `calculateLoan` tanpa mengubah perilakunya; bila butuh
   fitur baru (mis. konversi bunga flat ke efektif), ditambahkan sebagai
   fungsi terpisah dengan test.
2. **Konversi bunga flat ke efektif** (setara anuitas) dihitung dengan
   mencari rate yang menghasilkan cicilan sama (metode numerik), dan
   ditampilkan karena leasing umumnya mengiklankan bunga flat.
3. Biaya kendaraan (DP, administrasi, asuransi all risk/TLO, provisi)
   adalah input dengan nilai bawaan yang dijelaskan, bukan data per leasing.

## Scope

### Kredit kendaraan (`/simulasi-kredit-kendaraan`)

- Input: jenis (motor/mobil), harga OTR, DP (persen atau nominal), tenor,
  bunga flat per tahun, biaya admin, asuransi (persen per tahun atau
  nominal), opsi asuransi dibayar di muka atau masuk cicilan.
- Output: cicilan per bulan, total bayar, total bunga, bunga efektif
  setara per tahun, total uang muka yang disiapkan (DP + biaya), tabel per
  bulan, unduh CSV.
- Perbandingan beberapa tenor sekaligus (mis. 12, 24, 36, 48 bulan) dalam
  satu tabel.

### KTA (`/simulasi-kta`)

- Input: plafon, tenor, bunga (flat atau efektif per bulan/tahun), provisi,
  biaya admin, penghasilan (opsional).
- Output: cicilan, total bunga, dana yang benar-benar diterima setelah
  potongan provisi/admin, APR/bunga efektif setara, rasio cicilan terhadap
  penghasilan dengan penanda di atas acuan umum.

### Umum

- Cara hitung, FAQ ("bunga flat vs efektif", "berapa DP minimal"),
  JSON-LD, link berbagi, event standar, cross-link ke simulasi KPR.

## Monetisasi

AdSense dan donasi. **Daftar blokir pinjol dan pinjaman ilegal wajib aktif**
sebelum iklan dinyalakan; halaman kredit paling rawan memancing iklan
pinjol. Affiliate leasing/bank tetap ditunda (Story 20).

## Out of scope

- Data bunga riil per leasing/bank.
- Pengajuan kredit atau integrasi ke lembaga mana pun.
- Kredit syariah (murabahah), kandidat story lanjutan bersama KPR syariah.

## Acceptance Criteria

- [ ] Unit test konversi flat ke efektif (cocok dengan RATE spreadsheet),
      dana diterima KTA setelah potongan, dan asuransi di muka vs dalam
      cicilan.
- [ ] 3 skenario dicocokkan dengan simulasi resmi leasing/bank, dicatat di PR.
- [ ] Total pokok di tabel sama persis dengan plafon.
- [ ] Muncul di registry, meta/JSON-LD, sitemap; lint, test, e2e lulus.

## Referensi perhitungan

Dasar perhitungan dan data yang dipakai tool ini (dicek 2026-11-06):

- Rumus anuitas (PMT) untuk bunga efektif dan rumus bunga flat (bunga dari pokok awal x tenor), serta konversi bunga flat ke efektif setara (dicari dengan pencarian biner atas rumus anuitas, `bungaEfektifDariFlat`).
- Tidak ada regulasi tarif; bunga dan biaya adalah input pengguna.
- Kode: `apps/enem-landing-tools/app/utils/loan/index.ts`.
