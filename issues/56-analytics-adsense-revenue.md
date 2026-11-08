# Story 56: GA4 untuk SEO dan Pendapatan AdSense (Consent, Event, Iklan Blog)

**Status:** In review (2026-11-08). Catatan implementasi: consent default per region dan `trackGaEvent` ada di `libs/frontend/src/tracking/google-analytics.ts`, helper AdSense generik di `libs/frontend/src/ads` (export `@enem-landing/frontend/ads`); komponen Vue tetap per app (`AdSlot` di tools, `ArticleAd` di web) karena `libs/frontend` hanya berisi TypeScript. Pengaturan iklan blog ditaruh di `tools_settings` (migrasi `1788630000000`), sehingga AdSense tetap diatur dari satu halaman CMS. Blog muzanella.com berbahasa Inggris, jadi halaman privasinya `/privacy` dalam bahasa Inggris. Ditemukan saat implementasi: rekaman sesi rrweb di web belum menyamarkan input form (form kontak ikut terekam); sekarang `maskAllInputs: true`. Langkah manual dan AC yang butuh produksi (CMP, DebugView, Lighthouse) belum dicek.

**Apps touched:** `enem-landing-tools`, `enem-landing-web`, `enem-landing-api`, `enem-landing-cms`, `libs/frontend`

**Depends on:** Story 12-16 (tracker internal), Story 17 (SEO), Story 19 (blog), Story 20 (`AdSlot`, aturan iklan), Story 25 (event standar tools), Story 27 (setup AdSense dari CMS), Story 49 (embed)

## Background

Hasil brainstorm 2026-11-08 soal Google Analytics, dengan tujuan utama
**menaikkan pendapatan AdSense** sekaligus mendukung pertumbuhan SEO.

Kondisi saat ini:

- **GA4 sudah terpasang** di web dan tools lewat
  `libs/frontend/src/tracking/google-analytics.ts`, satu property untuk
  kedua subdomain (prod `G-BTFTCN7Y7D`, dev `G-VV8H6F1QBP`). Yang terkirim
  hanya `page_view` otomatis GA4. Belum ada custom event atau key event.
- **Tracker internal** (Story 12-16, 25) mencatat pageview, durasi, klik,
  event tools (`tool_view`, `tool_calculate`, `tool_share`,
  `tool_download` lewat `use-tool-events.ts`), dan rekaman sesi di web.
  Data ini lewat proxy first-party, jadi lebih akurat daripada GA yang
  sering diblok adblocker.
- **AdSense** (dicek 2026-11-08, akun `pub-8949585919330555`): onboarding
  lengkap (pembayaran, setelan iklan, situs terhubung). Situs
  `muzanella.com` berstatus **Sedang disiapkan** (masih direview), status
  ads.txt **Diotorisasi**. Slot ID, `/ads.txt`, dan meta verifikasi sudah
  dikelola dari CMS (Story 27).
- **Consent dipaksa `granted`** (`use-consent.ts`): banner disembunyikan
  dan semua pengunjung mendapat iklan personal plus GA. Ini belum
  memenuhi AC consent di Story 20, dan AdSense mewajibkan CMP yang
  tersertifikasi Google untuk pengunjung dari EEA, Inggris, dan Swiss.
- **Iklan hanya ada di tools.** Blog di muzanella.com belum punya slot
  iklan dan belum punya halaman privasi sendiri.

## Goal

1. Pembagian peran data yang jelas: **tracker internal adalah sumber utama
   data pemakaian**, sedangkan GA4 dipakai untuk hal yang tidak bisa
   dikerjakan tracker internal, yaitu data SEO (Search Console) dan
   pendapatan AdSense per halaman.
2. Setup consent yang memenuhi syarat AdSense tanpa mengganggu pengunjung
   Indonesia.
3. Iklan juga tampil di artikel blog, dengan aturan penempatan yang sama
   seperti tools.
4. Bisa menjawab "halaman mana yang traffic-nya besar tapi pendapatannya
   kecil" untuk mengarahkan prioritas konten dan penempatan iklan.

## Keputusan awal

1. **Pembagian sumber data**

   | Kebutuhan                                   | Sumber                                   |
   | ------------------------------------------- | ---------------------------------------- |
   | Pemakaian tools, klik, durasi, rekaman sesi | Tracker internal                         |
   | Keyword dan landing page dari pencarian     | GA4 + Search Console                     |
   | Pendapatan, impresi iklan, RPM per halaman  | GA4 yang di-link ke AdSense              |
   | Sumber traffic yang membawa user aktif      | GA4 (`tool_calculate` sebagai key event) |

   Kalau angka GA4 dan tracker internal berbeda, angka tracker internal
   yang dipakai untuk metrik pemakaian.

2. **Event GA4 dibuat minimal.** `useToolEvents` meneruskan
   `tool_calculate`, `tool_share`, dan `tool_download` ke `gtag('event')`
   dengan payload yang sama (hanya `toolId`, `mode`, `action`; tidak
   pernah input user). `tool_view` tidak diteruskan karena sudah tercakup
   `page_view`. `tool_calculate` ditandai sebagai **key event** di GA4, dan
   `tool_id` didaftarkan sebagai custom dimension (event-scoped). Di blog
   cukup satu event: `blog_to_tools` (klik link dari artikel ke
   tools.muzanella.com, parameter `tool_id` bila ada).

3. **Consent memakai CMP bawaan Google** (AdSense > Privasi & pesan),
   bukan banner buatan sendiri:
   - Pesan GDPR (TCF) untuk EEA, Inggris, dan Swiss. Di luar region itu
     tidak ada banner, sesuai keputusan saat ini.
   - Consent Mode v2 di `loadGoogleAnalytics`: consent default dengan
     `ad_storage`, `ad_user_data`, `ad_personalization`, dan
     `analytics_storage` bernilai `denied` hanya untuk kode region
     EEA/UK/CH (plus `wait_for_update: 500`), dipanggil sebelum `config`.
     Region lain tetap `granted`.
   - Script CMP harus sudah jalan sebelum slot iklan pertama terisi.
     **Diputuskan:** di halaman yang punya slot iklan aktif,
     `adsbygoogle.js` dimuat saat browser idle (bukan menunggu slot
     terlihat), karena tag AdSense itulah yang menampilkan pesan CMP.
     Slot tetap baru diisi saat mendekati viewport. Tanpa tag Funding
     Choices terpisah.
   - `use-consent.ts` dan logika `requestNonPersonalizedAds` di `AdSlot`
     disesuaikan supaya tidak bertabrakan dengan sinyal TCF dari CMP.

4. **Logika iklan dibagi lewat `libs/frontend/ads`** (validasi ID, muat
   script, push slot) supaya dipakai web dan tools; komponen Vue tetap di
   tiap app. Konfigurasi (client ID, slot ID, saklar) tetap dari CMS.
   Untuk blog ditambah `blogAdsEnabled` dan `adsenseSlotArticle` di
   `tools_settings`, dan BFF web `/api/adsense-account` hanya
   mengembalikan `articleSlot` bila saklar global dan saklar blog aktif,
   publisher ID valid, dan slot terisi.

5. **Penempatan iklan blog:** satu unit in-article setelah sekitar
   sepertiga artikel dan satu di akhir artikel sebelum artikel terkait.
   Aturan Story 20 tetap berlaku: tinggi tetap tanpa CLS, lazy saat
   terlihat, tidak mirip tombol, kategori pinjol/judi/investasi
   bodong/kripto berisiko diblokir. Tidak ada Auto ads (konsisten dengan
   Story 27).

6. **Halaman privasi untuk muzanella.com** (`/privacy` di web, bahasa
   Inggris mengikuti bahasa blog) yang
   menjelaskan GA, cookie AdSense dan iklan berbasis minat, tracker
   internal termasuk rekaman sesi, serta cara opt-out. Link di footer web.
   `privasi.vue` di tools diperbarui bila ada perubahan (CMP, region).

7. **Performa:** `loadGoogleAnalytics` menunda pemuatan `gtag.js` sampai
   browser idle (`requestIdleCallback` dengan fallback timeout), di web
   dan tools. Antrian `dataLayer` dibuat langsung supaya event awal tidak
   hilang.

8. **Setelan GA4 dan AdSense yang dikerjakan manual** (didokumentasikan
   sebagai checklist di story ini, bukan kode):
   - Retensi data GA4 diubah dari 2 bulan ke 14 bulan.
   - Link Search Console memakai domain property `muzanella.com` supaya
     web dan tools tercakup.
   - Link AdSense ke GA4 supaya pendapatan muncul per halaman.
   - Filter internal traffic (IP rumah/kantor sendiri).
   - BigQuery export harian (gratis) untuk analisis gabungan nanti.
   - Google signals dibiarkan mati.
   - Blokir kategori iklan sensitif di AdSense > Keamanan merek.

## Scope

- `libs/frontend/tracking`: consent default region, `trackGaEvent`
  helper, pemuatan idle, unit test.
- Tools: `useToolEvents` meneruskan event ke GA; penyesuaian
  `use-consent.ts`, `AdSlot`, plugin GA, dan `privasi.vue`.
- Web: `ArticleAd` di halaman artikel, event `blog_to_tools`, halaman
  `/privacy`, link footer, sitemap, plugin GA dengan consent default
  yang sama.
- API + CMS: kolom slot artikel dan saklar iklan blog, ikut config publik
  web.
- Pemuatan CMP Google sesuai keputusan 3.
- Checklist manual di bagian "Langkah manual" di bawah.

## Langkah manual (oleh user)

- [ ] Tunggu status situs `muzanella.com` di AdSense menjadi **Siap**.
- [ ] Buat pesan GDPR di AdSense > Privasi & pesan, lalu publikasikan.
- [ ] Buat ad unit untuk artikel blog, isi slot ID di CMS.
- [ ] Blokir kategori sensitif di AdSense > Keamanan merek.
- [ ] Setelan GA4 pada keputusan 8.
- [ ] Tandai `tool_calculate` sebagai key event dan daftarkan custom
      dimension `tool_id` di GA4.

## Monetisasi

Story ini langsung untuk pendapatan iklan. Setelah data AdSense masuk ke
GA4 (minimal 4 minggu), review bulanan RPM per halaman dipakai untuk:

- memprioritaskan topik ber-CPC tinggi (pajak, KPR, asuransi, gaji,
  investasi) di `articles/SEO-PLAN.md`;
- mencari halaman dengan traffic tinggi dan RPM rendah untuk dievaluasi
  penempatan iklan atau kontennya.

## Out of scope

- Auto ads dan format anchor/vignette.
- Laporan pendapatan AdSense di CMS (sama dengan Story 27).
- Analisis gabungan GA4 (BigQuery) dengan data tracker internal; cukup
  export diaktifkan dulu.
- A/B test penempatan iklan.
- Iklan di `/embed`, CMS, dan account-web.
- Consent eksplisit untuk rekaman sesi tracker internal (lihat
  Pertanyaan terbuka). Story ini hanya menyamarkan semua input dan
  menjelaskannya di halaman privasi.

## Pertanyaan terbuka

1. Apakah rekaman sesi (rrweb) di web perlu persetujuan eksplisit menurut
   UU PDP, atau cukup dijelaskan di halaman privasi dengan opsi opt-out?
2. ~~Cara memuat CMP lebih awal tanpa merusak LCP~~ Terjawab di
   keputusan 3.
3. ~~Lokasi pengaturan slot dan saklar iklan blog di CMS~~ Terjawab di
   keputusan 4.

## Acceptance Criteria

- [ ] Menekan hitung di tool mengirim `tool_calculate` ke tracker internal
      dan ke GA4 (terlihat di DebugView property dev) dengan parameter
      `tool_id`, tanpa input user di payload.
- [x] Tidak ada request GA atau AdSense dari halaman `/embed/*`.
- [ ] Pengunjung dari region EEA/UK/CH (dites lewat VPN atau parameter
      debug CMP) melihat pesan consent Google sebelum iklan dimuat;
      menolak tidak memasang cookie iklan personal.
- [ ] Pengunjung dari Indonesia tidak melihat banner, iklan dan GA jalan
      seperti sekarang.
- [ ] Artikel blog menampilkan dua slot iklan saat saklar iklan blog
      menyala dan slot ID terisi, tanpa deploy ulang; tidak ada slot saat
      saklar mati.
- [ ] CLS di halaman artikel dan tool dengan iklan di bawah 0,1, dan skor
      Lighthouse mobile Performance tidak turun lebih dari 3 poin
      dibanding sebelum story ini.
- [x] `/privacy` di muzanella.com ada, tertaut di footer, dan menyebut GA,
      AdSense, tracker internal, rekaman sesi, serta cara opt-out.
- [x] Unit test untuk consent default dan helper event GA; e2e untuk slot
      blog dan tidak adanya GA di embed.
- [ ] Checklist langkah manual selesai dan dicatat tanggalnya di story.

## Referensi perhitungan

Story ini tidak menghitung nilai untuk user. Sumber aturan yang dipakai
(status akun dicek 2026-11-08; dokumentasi Google dicek ulang saat
implementasi):

- Google AdSense: syarat CMP tersertifikasi Google untuk EEA, Inggris, dan
  Swiss. https://support.google.com/adsense/answer/13554116
- Google Tag Platform: Consent Mode v2 dan default per region.
  https://developers.google.com/tag-platform/security/guides/consent
- Google Analytics: retensi data. https://support.google.com/analytics/answer/7667196
- Google AdSense: format ads.txt dan meta verifikasi (sudah dipakai Story
  27). https://support.google.com/adsense/answer/12171612
