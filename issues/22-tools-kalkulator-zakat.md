# Story 22: Tool Kalkulator Zakat

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
  filter tidak cukup bisa diandalkan, halaman ini dibiarkan tanpa iklan.
- **Tidak ada affiliate di hasil hitungan zakat.** Tautan ke lembaga amil
  resmi (BAZNAS dan LAZ berizin) ditampilkan sebagai informasi, tanpa
  komisi, kecuali ada kerja sama resmi yang transparan.
- **Affiliate tidak langsung (opsional):** tabungan emas atau reksa dana
  syariah di bagian edukasi zakat maal, terpisah jelas dari hasil hitung.
- **Cross-link ke tool lain** (kalkulator gaji, simulasi KPR syariah bila
  nanti ada) untuk mengalirkan trafik musiman ke halaman yang lebih bisa
  dimonetisasi.

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
- [ ] Tool muncul di registry, punya meta/JSON-LD, masuk sitemap.
- [ ] `nx lint`, `nx test`, dan e2e dasar lulus.
