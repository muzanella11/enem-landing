# Story 54: Kalkulator Saham dan Reksa Dana

**Apps touched:** `enem-landing-tools`, `enem-landing-api` (seed registry)

**Depends on:** Story 20, Story 25, Story 41 (fungsi keuangan)

## Background

Investor ritel di Indonesia terus bertambah. "Hitung lot saham", "fee
beli jual saham", "average down", "pajak dividen", dan "simulasi reksa
dana" dicari terus. Topik investasi punya tarif iklan tinggi, dan semua
hitungannya bisa dijelaskan dengan aturan bursa dan pajak yang jelas.

## Goal

1. `/kalkulator-saham`: lot dan lembar, modal, fee beli/jual, pajak
   penjualan, untung/rugi bersih, harga impas, dan target harga jual.
2. `/kalkulator-average-saham`: harga rata-rata setelah average down/up
   dan jumlah lot yang dibutuhkan untuk mencapai harga rata-rata tertentu.
3. `/kalkulator-dividen`: dividen bersih setelah pajak dan dividend yield.
4. `/simulasi-reksa-dana`: unit yang didapat dari NAB, biaya pembelian dan
   penjualan, serta simulasi investasi rutin dengan imbal hasil yang diisi
   pengguna.

## Keputusan awal

1. **Aturan sebagai data dengan sumber** (`app/data/investasi/`): 1 lot =
   100 lembar dan fraksi harga sesuai ketentuan Bursa Efek Indonesia;
   pajak final atas penjualan saham; pajak dividen orang pribadi dalam
   negeri dan ketentuan pembebasannya bila diinvestasikan kembali; biaya
   transaksi bursa (levy, KPEI, KSEI) bila dipisahkan dari fee broker.
   Semua dicek dari situs BEI, DJP, dan peraturan terkait saat
   implementasi, dengan tanggal cek.
2. **Fee broker adalah input** dengan nilai bawaan yang dijelaskan, karena
   tiap sekuritas berbeda; tidak ada nama sekuritas.
3. **Imbal hasil reksa dana adalah input** dan memakai ulang fungsi
   investasi rutin Story 41; tidak ada data kinerja produk.
4. **Bukan rekomendasi investasi:** tidak ada nama saham, sinyal beli/jual,
   atau target harga dari kami. Disclaimer tampil di dekat hasil.

## Scope

- Saham: harga beli, jumlah lot atau modal, fee beli/jual, harga jual;
  hasil lembar, modal termasuk fee, pajak penjualan, untung/rugi bersih
  (rupiah dan persen), harga impas, dan harga jual untuk target persen.
- Average: daftar pembelian (harga, lot) atau target rata-rata; hasil
  rata-rata baru dan lot yang dibutuhkan, dengan fraksi harga yang valid.
- Dividen: dividen per lembar, jumlah lot, status pajak; hasil bruto,
  pajak, bersih, dan yield terhadap harga beli.
- Reksa dana: nominal, NAB per unit, biaya beli/jual; hasil unit dan
  nilai; simulasi rutin dengan grafik (komponen Story 41).
- FAQ, sumber, JSON-LD, cross-link ke kalkulator investasi rutin dan
  deposito.

## Monetisasi

AdSense (investasi, CPC tinggi) dan donasi. Filter iklan memblokir
investasi bodong, robot trading, dan iklan "pasti untung".

## Out of scope

- Data harga saham real-time, rekomendasi, portofolio tersimpan di server.
- Kripto, forex, dan derivatif.

## Acceptance Criteria

- [ ] Setiap aturan bursa dan pajak punya sumber dan tanggal cek di
      halaman.
- [ ] Unit test lot/lembar, fee dan pajak beli/jual, harga impas, target
      harga dengan fraksi harga yang valid, average down/up, dividen, dan
      unit reksa dana.
- [ ] Disclaimer "bukan rekomendasi investasi" tampil di dekat hasil.
- [ ] Tidak ada request jaringan yang membawa nilai input pengguna (diuji
      e2e).
- [ ] Muncul di registry (Story 25), punya meta/JSON-LD, masuk sitemap.
- [ ] `nx lint`, `nx test`, dan e2e dasar lulus.
- [ ] Bagian "Referensi perhitungan" di file ini diisi saat story selesai.
