# Story 47: Biaya Properti (Bangun Rumah, PBB, BPHTB, AJB)

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
- [ ] Rumus BPHTB memakai fungsi yang sama dengan Story 21 (tidak ditulis
      ulang).
- [ ] Muncul di registry (Story 25), punya meta/JSON-LD, masuk sitemap.
- [ ] Tidak ada request jaringan yang membawa nilai input pengguna.
- [ ] `nx lint`, `nx test`, dan e2e dasar (buka halaman, isi input, hasil muncul) lulus.
