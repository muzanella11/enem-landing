# Story 34: Tools Kesehatan (HPL Kehamilan, Masa Subur, BMI, Kebutuhan Kalori)

**Status:** Done (2026-11-06). Catatan: kategori registry baru `kesehatan` (types, definitions, hub, CMS). Iklan keempat tool dimatikan lewat seed (`adsEnabled` false) karena filter kategori AdSense belum diatur; nyalakan dari CMS setelah filter siap. JSON-LD `MedicalWebPage` ditambahkan lewat prop `medical` di ToolShell. Ambang IMT dari Permenkes 41/2014 (dikutip lewat sumber sekunder; dokumen resmi belum dibaca langsung) dan WHO WPRO 2000. Tidak ada localStorage untuk input; e2e memeriksa hal ini.

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

- [x] Unit test tiap rumus dengan contoh dari sumber yang dicantumkan,
      termasuk batas kategori BMI dan siklus haid tidak 28 hari.
- [x] Disclaimer tampil di atas hasil, bukan hanya di footer.
- [x] Tidak ada request jaringan yang membawa data pengguna dan tidak ada
      penyimpanan lokal tanpa aksi pengguna.
- [x] Sumber dan tanggal pengecekan tampil di halaman.
- [x] Muncul di registry, meta/JSON-LD, sitemap; lint, test, e2e lulus.

## Referensi perhitungan

Dasar perhitungan dan data yang dipakai tool ini (dicek 2026-11-06):

- IMT Kemenkes: Permenkes 41/2014 tentang Pedoman Gizi Seimbang (kurus < 17,0; 17,0-18,4; normal 18,5-25,0; gemuk 25,1-27,0; > 27,0). Angka dicek lewat sumber sekunder. https://peraturan.bpk.go.id/Details/119080/permenkes-no-41-tahun-2014
- IMT WHO Asia-Pasifik: WHO WPRO (2000), The Asia-Pacific perspective: redefining obesity and its treatment. https://iris.who.int/handle/10665/206936
- Kalori: Mifflin MD dkk. (1990), Am J Clin Nutr 51(2):241-247 (BMR), faktor aktivitas 1,2 sampai 1,9; 7.700 kkal per kg; batas minimum 1.200/1.500 kkal dari NHLBI. https://pubmed.ncbi.nlm.nih.gov/2305711/ dan https://www.nhlbi.nih.gov/health/educational/lose_wt/index.htm
- HPL: aturan Naegele (HPHT + 280 hari, koreksi panjang siklus) dan pembagian trimester, ACOG Committee Opinion 700. https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date
- Buku KIA Kemenkes untuk tonggak kunjungan antenatal. https://kesga.kemkes.go.id/
- Masa subur: Wilcox AJ dkk. (1995), NEJM 333:1517-1521 (jendela 5 hari sebelum sampai 1 hari setelah ovulasi); ACOG FAQ metode kesadaran kesuburan. https://www.nejm.org/doi/full/10.1056/NEJM199512073332301 dan https://www.acog.org/womens-health/faqs/fertility-awareness-based-methods-of-family-planning
- Data di kode: `app/data/kesehatan/index.ts`.
