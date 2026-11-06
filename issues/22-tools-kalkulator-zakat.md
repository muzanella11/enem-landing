# Story 22: Tool Kalkulator Zakat

**Status:** Done (2026-11-06). Catatan: ketentuan pemakaian sumber harga emas belum dicek.

**Apps touched:** `enem-landing-tools`

**Depends on:** Story 20 (fondasi tools hub)

## Background

Kalkulator zakat dicari sepanjang tahun dan melonjak besar saat Ramadan.
Hitungannya sederhana (2,5%), tapi yang membingungkan orang adalah
nisab: nisab mengikuti harga emas yang berubah setiap hari, dan ketentuan
zakat penghasilan punya beberapa pendapat (dihitung dari bruto atau
neto). Tool yang jelas sumber acuannya akan berguna.

## Goal

Tool `/kalkulator-zakat` dengan tiga mode: zakat penghasilan, zakat maal
(harta simpanan), dan zakat fitrah. Nisab dihitung dari harga emas
terbaru, dengan acuan ketentuan BAZNAS.

## Keputusan awal

1. **Acuan utama ketentuan BAZNAS** (nisab 85 gram emas, kadar 2,5%).
   Ketentuan dan angka (termasuk nilai zakat fitrah per daerah) harus
   dicek ulang ke sumber resmi saat implementasi dan dicantumkan beserta
   tanggal pengecekan.
2. **Harga emas** diambil oleh Nitro server route di `enem-landing-tools`
   (mis. `GET /api/harga-emas`), di-cache harian (memory atau Redis
   Upstash yang sudah ada), supaya browser pengguna tidak memanggil sumber
   pihak ketiga langsung. Bila gagal, pakai harga terakhir yang tersimpan
   dan tampilkan tanggalnya. Pengguna selalu bisa menimpa harga emas
   manual.
3. **Zakat penghasilan menampilkan dua cara**, bruto dan neto (setelah
   kebutuhan pokok), dengan penjelasan singkat bahwa keduanya ada dasarnya.
   Default mengikuti BAZNAS.
4. Tidak ada input yang dikirim ke server; server route hanya melayani
   harga emas.

## Scope

- **Zakat penghasilan:** penghasilan per bulan, penghasilan lain,
  pengeluaran pokok (untuk mode neto). Output: wajib/tidak (dibanding nisab
  bulanan), nominal zakat per bulan dan per tahun.
- **Zakat maal:** tabungan, deposito, emas/perak (gram), investasi, piutang
  yang dapat ditagih, dikurangi utang jatuh tempo. Output: total harta,
  status nisab, nominal zakat, dengan catatan soal haul satu tahun.
- **Zakat fitrah:** jumlah jiwa dan pilihan beras (kg/liter) atau uang
  sesuai nilai yang ditetapkan BAZNAS daerah (data per tahun, bisa diubah
  manual).
- Halaman menampilkan sumber harga emas, waktu update, dan acuan
  ketentuan.
- Penjelasan, FAQ, dan JSON-LD sesuai pola Story 20.

## Monetisasi

Topik ibadah, jadi monetisasinya sengaja paling konservatif di hub ini.
Kepercayaan pengguna lebih penting daripada pendapatan dari halaman ini;
nilainya terutama sebagai magnet trafik musiman (Ramadan) ke tool lain.

- **Iklan display dengan filter ketat:** selain daftar blokir Story 20,
  blokir juga kategori yang tidak pantas di konteks ini (alkohol, kencan,
  produk ribawi yang mencolok seperti kartu kredit dan pinjaman). Bila
  filter tidak cukup bisa diandalkan, iklan untuk halaman ini dimatikan
  lewat toggle iklan per tool di CMS (Story 25).
- **CTA donasi tidak ditampilkan di dekat hasil hitungan zakat**, hanya di
  footer, supaya tidak tertukar dengan pembayaran zakat.
- Tautan ke lembaga amil resmi (BAZNAS dan LAZ berizin) ditampilkan sebagai
  informasi, tanpa komisi.
- **Cross-link ke tool lain** (kalkulator gaji, simulasi KPR) untuk
  mengalirkan trafik musiman ke halaman lain.

## Out of scope

- Pembayaran zakat atau tautan afiliasi ke lembaga amil.
- Zakat pertanian, peternakan, perdagangan, dan rikaz (kandidat story
  lanjutan).
- Fatwa atau pendapat mazhab di luar yang dijelaskan di atas.

## Pertanyaan terbuka

1. **Sumber harga emas** yang stabil dan boleh dipakai (mis. harga Antam
   harian). Perlu dicek ketentuan pemakaian dan format datanya sebelum
   implementasi.

## Acceptance Criteria

- [ ] Unit test untuk tiap mode, termasuk tepat di batas nisab, di bawah
      nisab, dan perhitungan bruto vs neto.
- [ ] Server route harga emas punya cache, fallback ke nilai terakhir, dan
      timeout; kegagalan sumber tidak membuat halaman error.
- [ ] Memori container tetap di bawah limit 100M dengan server route aktif.
- [ ] Tidak ada request jaringan yang membawa nilai input pengguna.
- [ ] Sumber ketentuan, sumber harga emas, dan tanggal update tampil di
      halaman.
- [ ] CTA donasi tidak muncul di area hasil hitungan zakat.
- [ ] Tool muncul di registry, punya meta/JSON-LD, masuk sitemap.
- [ ] `nx lint`, `nx test`, dan e2e dasar lulus.

## Catatan implementasi (2026-11-06)

- **Pertanyaan terbuka 1 (sumber harga emas):** dipakai harga spot internasional
  dari `api.gold-api.com` dikali kurs USD/IDR dari `open.er-api.com`, diambil di
  server route `/api/harga-emas`, di-cache 6 jam, dengan fallback ke harga terakhir.
  Harga emas batangan (mis. Antam) biasanya lebih tinggi; pengguna bisa mengisi harga
  sendiri. Ketentuan pemakaian kedua sumber perlu dicek ulang sebelum rilis.
- Nilai zakat fitrah uang memakai acuan BAZNAS RI 2025 Jabodetabek (Rp47.000) dan
  bisa diubah pengguna.
- Iklan halaman zakat default mati (seed registry `adsEnabled = 0`).

## Referensi perhitungan

Dasar perhitungan dan data yang dipakai tool ini (dicek 2026-11-06):

- BAZNAS: ketentuan zakat penghasilan dan maal (nisab 85 gram emas, tarif 2,5%). https://baznas.go.id/zakat
- BAZNAS: zakat fitrah (2,5 kg / 3,5 liter beras per jiwa). https://baznas.go.id/zakatfitrah
- Nilai uang zakat fitrah Rp50.000 per jiwa: SK Ketua BAZNAS RI No. 14 Tahun 2026 (diperbarui 2026-11-06 dari Rp47.000 tahun 2025), dikutip Jawapos. https://www.jawapos.com/nasional/2602100086/baznas-tetapkan-zakat-fitrah-2026-sebesar-rp-50000-dan-fidyah-rp-65000-per-jiwa
- Harga emas untuk nisab: harga spot gold-api.com dikonversi dengan kurs exchangerate-api.com (lihat Story 38).
- Data di kode: `apps/enem-landing-tools/app/data/zakat/rules.ts`.
