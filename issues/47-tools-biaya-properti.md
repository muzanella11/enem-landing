# Story 47: Biaya Properti (Bangun Rumah, PBB, BPHTB, AJB)

**Status:** Done (2026-11-06). Catatan: rumus BPHTB Story 21 diekstrak menjadi `hitungBphtb` di `utils/loan` dan dipakai kedua tool. Biaya bangun per m² berupa input tanpa rentang harga bawaan (belum ada sumber rentang per tipe/daerah yang bisa dipertanggungjawabkan), dan rincian per pekerjaan belum dibuat. Tarif PBB/BPHTB, NJOPTKP, dan NPOPTKP bawaan adalah batas UU 1/2022; contoh Bapenda per daerah belum dicocokkan. Angka PNBP BPN (PP 128/2015) dan honor PPAT 1% (PP 24/2016) ditulis dari pengetahuan peraturan, belum dibuka dokumennya saat implementasi.

**Apps touched:** `enem-landing-tools`, `enem-landing-api` (seed registry)

**Depends on:** Story 21 (biaya awal KPR), Story 25

## Background

Orang yang mencari simulasi KPR juga mencari "biaya bangun rumah per meter",
"cara hitung PBB", dan "biaya AJB". Topik properti bernilai iklan tinggi,
dan sebagian rumus sudah ada di biaya awal KPR (Story 21).

## Goal

Tiga tool: `/biaya-bangun-rumah`, `/kalkulator-pbb`,
`/biaya-balik-nama-rumah` (BPHTB, AJB/PPAT, balik nama sertifikat).

## Keputusan awal

1. **Biaya bangun per m² adalah input** dengan rentang indikatif per tipe
   bangunan dan daerah yang diberi sumber dan tanggal cek; tool tidak
   mengklaim harga pasti.
2. **PBB (UU 1/2022):** NJOP tanah dan bangunan, NJOPTKP daerah, dan tarif
   daerah (maksimal sesuai UU) sebagai input dengan nilai bawaan yang
   dijelaskan.
3. **BPHTB** memakai ulang rumus Story 21 (5% x (NPOP - NPOPTKP)). **Honor
   PPAT** mengikuti batas maksimal di peraturan yang berlaku (dicek ulang),
   ditambah biaya cek sertifikat, PNBP BPN, dan PPh penjual 2,5% sebagai
   informasi siapa yang menanggung.

## Scope

- Bangun rumah: luas per lantai, tipe (sederhana/menengah/mewah), daerah,
  persentase biaya tak terduga; rincian kasar per pekerjaan.
- PBB: luas tanah/bangunan, NJOP per m², NJOPTKP, tarif; PBB per tahun.
- Balik nama: harga transaksi, NJOP, NPOPTKP; BPHTB (pembeli), PPh
  (penjual), honor PPAT, biaya BPN.
- FAQ, JSON-LD, cross-link ke simulasi KPR dan konversi luas tanah.

## Monetisasi

AdSense dan donasi.

## Out of scope

- RAB detail per material, cek NJOP otomatis.

## Acceptance Criteria

- [ ] Unit test PBB, BPHTB, dan PPh penjual dengan contoh dari Bapenda dan
      peraturan yang dicantumkan.
- [x] Rumus BPHTB memakai fungsi yang sama dengan Story 21 (tidak ditulis
      ulang).
- [x] Muncul di registry (Story 25), punya meta/JSON-LD, masuk sitemap.
- [x] Tidak ada request jaringan yang membawa nilai input pengguna.
- [x] `nx lint`, `nx test`, dan e2e dasar (buka halaman, isi input, hasil muncul) lulus.

## Referensi perhitungan

Dasar perhitungan dan data yang dipakai tool ini (dicek 2026-11-06):

- PBB-P2 dan BPHTB: UU 1/2022 (HKPD). PBB: tarif maks 0,5%, NJOPTKP min Rp10 juta, NJOP yang dipakai 20-100% setelah NJOPTKP. BPHTB: tarif maks 5%, NPOPTKP min Rp80 juta (Rp300 juta untuk waris/hibah wasiat keluarga), NPOP = harga transaksi atau NJOP bila lebih tinggi. https://peraturan.bpk.go.id/Details/195682/uu-no-1-tahun-2022
- PPh final 2,5% atas pengalihan hak tanah/bangunan dibayar penjual: PP 34/2016. https://peraturan.bpk.go.id/Details/5770/pp-no-34-tahun-2016
- Honor PPAT maksimal 1% dari harga transaksi: PP 24/2016. https://peraturan.bpk.go.id/Details/5764/pp-no-24-tahun-2016
- PNBP pendaftaran peralihan hak = nilai tanah/1000 + Rp50.000, pengecekan sertifikat Rp50.000: PP 128/2015. https://peraturan.bpk.go.id/Details/5682/pp-no-128-tahun-2015
- Biaya bangun: luas x biaya per m² input pengguna + cadangan persen.
- Kode: `app/data/properti.ts`, `app/utils/properti.ts`, `hitungBphtb` di `app/utils/loan/index.ts`.
