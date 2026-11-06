# Story 34: Tools Kesehatan (HPL Kehamilan, Masa Subur, BMI, Kebutuhan Kalori)

**Apps touched:** `enem-landing-tools`, `enem-landing-api` (seed registry)

**Depends on:** Story 20, Story 25

## Background

"Hitung HPL", "kalkulator masa subur", dan "kalkulator BMI" punya volume
pencarian sangat besar dan konsisten. Topik kesehatan termasuk kategori
yang dinilai ketat oleh Google (menyangkut keselamatan pengguna), jadi
akurasi, sumber, dan disclaimer wajib sekuat tool keuangan.

## Goal

Empat tool: `/hitung-hpl`, `/kalkulator-masa-subur`, `/kalkulator-bmi`,
`/kalkulator-kalori`.

## Keputusan awal

1. **Rumus dan ambang batas sebagai data dengan sumber**
   (`app/data/kesehatan/`), dicek ulang saat implementasi:
   - HPL: aturan Naegele, HPHT + 280 hari, dengan usia kehamilan (minggu
     dan hari) dan trimester saat ini; opsi siklus haid tidak 28 hari
     (koreksi panjang siklus).
   - Masa subur: perkiraan ovulasi = panjang siklus - 14 hari, jendela subur
     sekitar 5 hari sebelum sampai 1 hari setelah ovulasi, untuk beberapa
     siklus ke depan.
   - BMI: kategori Kemenkes untuk dewasa Indonesia (dan kategori WHO Asia
     Pasifik sebagai pembanding), dengan penjelasan bahwa BMI tidak berlaku
     untuk ibu hamil, atlet, dan anak.
   - Kalori: rumus Mifflin-St Jeor untuk BMR, dikali faktor aktivitas,
     dengan target turun/naik berat badan yang aman.
2. **Disclaimer jelas di setiap halaman:** hasil adalah perkiraan, bukan
   diagnosis; konsultasikan ke tenaga kesehatan. Masa subur **tidak boleh**
   dipromosikan sebagai metode kontrasepsi.
3. **Data kesehatan sangat sensitif:** tidak ada yang dikirim ke server,
   tidak disimpan di localStorage secara default, dan link berbagi hanya
   dibuat saat pengguna menekan tombol (pola Story 20).
4. BMI anak (z-score kurva pertumbuhan WHO) tidak masuk rilis pertama.

## Scope

- Empat halaman dengan input sederhana, hasil, penjelasan cara hitung, FAQ,
  sumber (Kemenkes/WHO/jurnal), dan JSON-LD yang sesuai (`MedicalWebPage`
  bila tepat).
- HPL: hasil tanggal perkiraan lahir, usia kehamilan, trimester, dan
  tonggak penting kehamilan per trimester (informasi umum, bersumber).
- Cross-link antar tool kesehatan.

## Monetisasi

AdSense dengan filter ketat: selain daftar blokir Story 20, blokir juga
kategori obat/suplemen tanpa izin, pelangsing, dan klinik yang tidak jelas.
Bila filter tidak cukup bisa diandalkan, iklan dimatikan per tool dari CMS.

## Out of scope

- BMI anak dan kurva pertumbuhan.
- Konsultasi, rekomendasi obat, atau diet spesifik.
- Pelacak siklus jangka panjang (butuh penyimpanan data sensitif).

## Acceptance Criteria

- [ ] Unit test tiap rumus dengan contoh dari sumber yang dicantumkan,
      termasuk batas kategori BMI dan siklus haid tidak 28 hari.
- [ ] Disclaimer tampil di atas hasil, bukan hanya di footer.
- [ ] Tidak ada request jaringan yang membawa data pengguna dan tidak ada
      penyimpanan lokal tanpa aksi pengguna.
- [ ] Sumber dan tanggal pengecekan tampil di halaman.
- [ ] Muncul di registry, meta/JSON-LD, sitemap; lint, test, e2e lulus.
