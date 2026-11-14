# Story 57: Anti-Spam, Validasi, dan Pencatatan Pengirim Form Contact Me

**Status:** Draft (2026-11-14)

**Apps touched:** `enem-landing-web`, `enem-landing-api`, `enem-landing-account-api`, `enem-landing-cms`, `enem-landing-web-e2e`, `libs/shared`

**Depends on:** Story 58 (IP pengunjung dari `CF-Connecting-IP`, wajib selesai dulu), Story 59 (rate limit global backend, wajib selesai dulu), Story 06 (`enem-landing-api`, rate limit contact), Story 03 (`enem-landing-account-api`, email SMTP), Story 07 (CMS contact submissions), Story 08 (`enem-landing-web`), Story 13 dan 16 (tracker internal dan rekaman sesi)

## Background

Hasil brainstorm 2026-11-14. Sejak form Contact Me di muzanella.com
terhubung ke SMTP, inbox rutin menerima spam yang dikirim lewat form
tersebut.

Alur saat ini:

```
index.vue (form)
  -> POST /api/contact-submissions        (BFF Nuxt, enem-landing-web)
  -> POST /contact-submissions            (enem-landing-api, simpan ke DB)
  -> POST /email/internal/contact-submission (enem-landing-account-api)
       -> email notifikasi ke admin
       -> email konfirmasi (auto-reply) ke alamat yang diisi pengunjung
```

Kondisi yang ditemukan:

- **Validasi frontend** hanya atribut HTML `required` dan `type="email"`
  di `apps/enem-landing-web/app/pages/index.vue`. Tidak ada batas panjang,
  pola, maupun pesan error per field. Error dari server hanya tampil
  sebagai "Error sending message!".
- **Validasi backend** di
  `apps/enem-landing-api/src/app/contact-submissions/dto/create-contact-submission.dto.ts`
  sudah ada tetapi longgar: `fullname` maks 255, `phoneNumber` string apa
  saja maks 32, `message` maks 5000, `email` cukup `@IsEmail()`. Global
  `ValidationPipe` sudah `whitelist` dan `forbidNonWhitelisted`.
- **Rate limit** di `contact-submissions.service.ts`: fixed window
  in-memory, 5 kiriman per menit per IP. Tidak tahan terhadap bot yang
  berganti IP, dan 5 per menit berarti masih 7.200 kiriman per hari per IP.
  IP-nya pun saat ini bisa dipalsukan (lihat Story 58).
- **Tidak ada captcha, honeypot, atau pengecekan waktu pengisian form.**
- **Asal kiriman tidak tercatat.** `contact_submissions` hanya menyimpan
  nama, email, HP, pesan, dan waktu. Tidak ada IP, browser, atau kaitan
  dengan tracker internal, sehingga tidak bisa dilihat apakah beberapa
  spam datang dari sumber yang sama, dan IP tidak bisa diblokir.
- **Auto-reply bisa dipakai sebagai relay spam.**
  `contact-submission-confirmation.template.ts` mengirim email ke alamat
  yang diketik pengunjung dan menampilkan ulang isi `message`. Spammer
  cukup mengisi email korban dan teks iklan/link di pesan, maka SMTP
  muzanella.com yang mengirimkan spam itu ke korban. Ini merusak reputasi
  domain dan akun SMTP, dan kemungkinan juga sumber sebagian spam yang
  masuk (bot menguji celah ini).

### Contoh spam yang masuk (2026-11-14)

Email notifikasi admin yang diterima:

| Field  | Isi                                                                       |
| ------ | ------------------------------------------------------------------------- |
| Nama   | `aiunt`                                                                   |
| Email  | alamat asli milik pihak ketiga (domain sekolah di AS, disamarkan di sini) |
| No. HP | `credo`                                                                   |
| Pesan  | `venia`                                                                   |

Analisis:

- Nama, nomor HP, dan pesan berupa **kata Latin acak** satu kata. Ini pola
  bot probing: mengisi semua field dengan teks pendek untuk menguji
  apakah form diterima dan apakah ada email yang terkirim.
- **No. HP berisi huruf.** Backend saat ini menerima karena
  `phoneNumber` cukup `@IsString()`.
- **Pesan hanya 5 karakter.**
- **Email milik orang lain.** Artinya email konfirmasi dari muzanella.com
  ikut terkirim ke pihak ketiga yang tidak pernah mengisi form. Ini bukti
  langsung celah relay di atas sudah dipakai, walaupun isi pesannya belum
  berisi iklan (tahap uji coba).

Aturan di Keputusan awal no. 3 sudah cukup menolak contoh ini: pola
`phoneNumber` gagal dan `message` kurang dari 10 karakter. Honeypot dan
cek waktu pengisian kemungkinan juga menangkapnya lebih awal. Contoh ini
dipakai sebagai kasus uji (unit dan e2e).

### Contoh spam kedua: penawaran jasa (sebelum 2026-11-14)

| Field  | Isi                                               |
| ------ | ------------------------------------------------- |
| Nama   | nama orang yang terlihat wajar (nama Inggris)     |
| Email  | alamat di domain layanan email yang tidak dikenal |
| No. HP | 10 digit angka (format nomor AS)                  |
| Pesan  | lihat di bawah                                    |

> Our system drives targeted traffic to your website within 24 hours of
> setup. You pick the keywords, we do the rest. Is this something you'd
> like to explore?

Analisis:

- Jenisnya berbeda dari contoh pertama: **spam penawaran jasa
  (SEO/traffic)**, biasanya dikirim massal oleh layanan "contact form
  marketing". Pengirimnya bisa bot yang lebih canggih atau manusia
  berbayar.
- **Lolos semua aturan validasi** di Keputusan awal no. 3: nama wajar,
  nomor 10 digit, pesan lebih dari 10 karakter, tanpa URL.
- Honeypot, cek waktu, dan Turnstile **belum tentu** menangkapnya, karena
  layanan seperti ini sering memakai browser asli atau manusia yang bisa
  menyelesaikan captcha.
- Yang bisa menangkapnya adalah **analisis isi pesan** (frasa khas
  penawaran SEO/traffic) dan **sinyal pengirim** (IP data center atau VPN,
  zona waktu tidak cocok dengan negara IP, tidak ada riwayat kunjungan di
  tracker).
- Risiko relay kecil (email konfirmasi kembali ke pengirim sendiri), tapi
  tetap mengganggu inbox.

Contoh ini menjadi dasar aturan skor frasa penawaran di Keputusan awal
no. 4 dan dipakai sebagai kasus uji.

### Batasan pencatatan pengirim

Data teknis tidak bisa menunjukkan **siapa orangnya**. Spammer hampir
selalu memakai VPN, proxy, atau server sewaan, sehingga IP menunjuk ke
penyedia jaringan, bukan ke orang. Yang realistis didapat dari pencatatan
pengirim: (1) bisa memblokir sumbernya di Cloudflare WAF, (2) bisa
mengelompokkan kiriman dari sumber yang sama, dan (3) bisa membedakan bot
dari manusia.

## Goal

1. Menutup celah relay spam lewat email konfirmasi.
2. Menahan sebagian besar bot tanpa menambah friksi bagi pengunjung asli.
3. Validasi input yang jelas di frontend (VeeValidate) dan ketat di
   backend, dengan pesan error per field.
4. Kiriman yang lolos tapi mencurigakan tetap tersimpan dan bisa ditinjau
   di CMS, tetapi tidak memicu email.
5. Setiap kiriman membawa data pengirim yang cukup untuk memblokir,
   mengelompokkan, dan menilai apakah pengirimnya bot, dengan masa simpan
   terbatas.

## Keputusan awal

1. **Email konfirmasi tetap dikirim, tanpa isi pesan.** Template hanya
   berisi sapaan dan "pesan Anda sudah kami terima". Nama pengunjung
   tetap ditampilkan tetapi dipotong (maks 50 karakter) dan tidak boleh
   berisi URL, supaya nama tidak bisa dipakai sebagai tempat link. Email
   konfirmasi juga tidak dikirim untuk kiriman yang ditandai spam.
2. **Honeypot dan cek waktu pengisian** sebagai lapisan pertama:
   - Field tersembunyi (misalnya `website`), disembunyikan lewat CSS dan
     `tabindex="-1"`, `autocomplete="off"`, `aria-hidden="true"`. Manusia
     tidak mengisinya, bot biasanya mengisi semua field.
   - Frontend mengirim waktu form mulai ditampilkan. Kiriman yang terjadi
     kurang dari 3 detik setelah form tampil dianggap bot.
   - Kalau terdeteksi, server **membalas sukses palsu** (bentuk respons
     sama dengan sukses asli) tanpa menyimpan dan tanpa mengirim email,
     supaya bot tidak belajar bahwa ia tertolak.
   - Pengecekan dilakukan di BFF Nuxt (`server/api/contact-submissions`),
     dan field honeypot/waktu tidak diteruskan ke `enem-landing-api`.
3. **Aturan validasi** (sama di frontend dan backend):

   | Field         | Aturan                                                                            |
   | ------------- | --------------------------------------------------------------------------------- |
   | `fullname`    | wajib, di-trim, 2 sampai 100 karakter, tidak boleh berisi URL                     |
   | `email`       | wajib, di-trim dan lowercase, format email valid, maks 254 karakter               |
   | `phoneNumber` | wajib, di-trim, pola `^\+?[0-9\s-]{8,20}$`                                        |
   | `message`     | wajib, di-trim, 10 sampai 2000 karakter, maks 2 URL, tanpa `<a href` atau `[url=` |

   **Frontend memakai VeeValidate** (v4):
   - modul `@vee-validate/nuxt` di `enem-landing-web`, dengan
     `useForm` + `useField` (atau komponen `Form`/`Field`/`ErrorMessage`)
     di form contact;
   - skema validasi memakai Zod lewat `@vee-validate/zod`
     (`toTypedSchema`);
   - batas angka dan pola (panjang min/maks, regex telepon, regex URL,
     jumlah URL maks) ditaruh sebagai **konstanta bersama** di
     `libs/shared` dan dipakai oleh skema Zod di frontend maupun DTO
     class-validator di backend, supaya kedua sisi tidak berbeda aturan;
   - error tampil per field di bawah input saat blur dan saat submit
     (`validateOnBlur`, tidak validasi di setiap ketikan sebelum field
     pertama kali di-blur);
   - error 400 dari server dipetakan ke field yang sesuai dengan
     `setErrors`; respons 429 menampilkan pesan "terlalu banyak percobaan,
     coba lagi nanti";
   - input diberi `aria-invalid` dan `aria-describedby` yang menunjuk ke
     pesan error.

4. **Penandaan spam berbasis aturan sederhana** di `enem-landing-api`.
   Kiriman yang lolos validasi tetapi cocok dengan salah satu aturan
   berikut disimpan dengan `isSpam = true` dan tidak memicu email apa pun:
   - pesan berisi URL dengan TLD atau domain yang sering dipakai spam,
     atau berisi kata kunci di daftar blokir (daftar awal di konstanta,
     bisa diperluas);
   - sebagian besar teks berisi aksara di luar Latin (misalnya Cyrillic
     atau CJK), karena situs berbahasa Indonesia dan Inggris;
   - `fullname` sama dengan `message` atau berisi pola acak (huruf tanpa
     vokal yang panjang);
   - **skor frasa penawaran jasa** (lihat contoh spam kedua) mencapai
     ambang batas;
   - **kombinasi sinyal pengirim** (lihat no. 8): IP dari Tor atau data
     center **dan** tidak ada `visitorId`/riwayat kunjungan **atau** tidak
     ada interaksi pointer sama sekali;
   - email memakai domain email sekali pakai, atau domain email tidak
     punya MX record.

   **Skor frasa penawaran jasa.** Satu kata kunci saja tidak cukup,
   karena calon klien asli bisa saja menulis "saya butuh bantuan SEO
   untuk website saya". Karena itu dipakai skor:
   - daftar frasa di konstanta (bahasa Inggris dan Indonesia), misalnya
     `targeted traffic`, `drive traffic`, `within 24 hours`,
     `pick the keywords`, `first page of google`, `backlinks`,
     `guest post`, `link building`, `domain authority`, `lead generation`,
     `something you'd like to explore`, `are you interested`,
     `unsubscribe`, `opt out`;
   - tiap frasa yang cocok (case-insensitive) menambah 1 poin;
   - kiriman ditandai spam bila skor **2 atau lebih**. Contoh spam kedua
     mendapat skor 3 (`targeted traffic`, `within 24 hours`,
     `something you'd like to explore`).

   Daftar frasa dan ambang batas mudah diubah tanpa mengubah logika, dan
   setiap kiriman spam menyimpan alasan penandaannya (`spamReason`,
   misalnya `phrases:targeted traffic,within 24 hours` atau
   `sender:hosting+no-visitor`) supaya aturan bisa dievaluasi dari CMS.

   Aturan sengaja dibuat konservatif: lebih baik spam lolos ke CMS
   daripada pesan asli hilang. Kiriman yang ditandai spam tetap tersimpan
   dan bisa dikembalikan dengan aksi "Bukan spam".

5. **Rate limit contact memakai mekanisme global Story 59** (throttler
   Redis untuk semua endpoint backend). Yang diatur di story ini:
   - per IP: tier `contact` di Story 59 (3 kiriman per 10 menit, 10 per
     hari);
   - per email: 3 kiriman per hari, dicek di service contact (Redis);
   - global: maks 50 email konfirmasi per hari. Lewat dari itu kiriman
     tetap disimpan, notifikasi admin tetap dikirim, tetapi auto-reply
     dilewati dan ada log warning.

   Key Redis memakai prefix environment yang sudah ada (lihat PR #20). IP
   berasal dari `CF-Connecting-IP` (Story 58).

6. **Cloudflare Turnstile ditunda ke fase 2.** Dipasang hanya kalau
   setelah fase 1 berjalan sekitar 1 minggu spam masih masuk ke inbox.
   Mode invisible/managed, token diverifikasi di BFF ke
   `https://challenges.cloudflare.com/turnstile/v0/siteverify`, site key
   dan secret key disimpan di system settings CMS atau env.
7. **CMS** menampilkan kiriman spam terpisah (tab atau filter "Spam"),
   dengan aksi "Bukan spam" yang menghapus tanda dan **tidak** mengirim
   ulang email apa pun.
8. **Catat data pengirim di setiap kiriman** (menggantikan rencana awal
   menyimpan hash IP). IP disimpan apa adanya karena hanya IP asli yang
   bisa dimasukkan ke blocklist Cloudflare WAF.

   **Data yang dicatat:**

   | Kelompok          | Data                                                                                                        | Sumber                                                                                                  |
   | ----------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
   | Jaringan          | IP                                                                                                          | `CF-Connecting-IP` (Story 58)                                                                           |
   |                   | negara, region, kota                                                                                        | `CF-IPCountry`; `CF-IPCity`/`CF-Region` bila visitor location headers aktif, selain itu dari ip-api.com |
   |                   | `cfRay`                                                                                                     | header `CF-Ray`, untuk dicocokkan dengan log Cloudflare                                                 |
   |                   | ASN, ISP, organisasi                                                                                        | ip-api.com lewat `lookupGeo` yang sudah ada (`tracking/geo-lookup.ts`)                                  |
   |                   | `isProxy`, `isHosting`                                                                                      | ip-api.com (field `proxy`, `hosting`, ditambahkan ke `FIELDS`)                                          |
   |                   | `isTor`                                                                                                     | daftar exit node Tor resmi, diunduh harian dan di-cache di Redis                                        |
   | Browser           | user agent, `Accept-Language`, `Referer`                                                                    | header asli pengunjung, diteruskan BFF                                                                  |
   |                   | zona waktu, bahasa, ukuran layar                                                                            | JavaScript (`Intl.DateTimeFormat().resolvedOptions().timeZone`, `navigator.language`, `screen`)         |
   | Perilaku form     | lama pengisian (ms), jumlah tombol ditekan, field yang di-paste, ada/tidaknya gerakan pointer atau sentuhan | event listener di form                                                                                  |
   | Tracker internal  | `visitorId`, `sessionId`                                                                                    | `use-tracker.ts` yang sudah ada                                                                         |
   | Email dan telepon | domain email punya MX record, domain email sekali pakai, negara dan validitas nomor telepon                 | `dns.resolveMx` Node, paket daftar domain sekali pakai, `libphonenumber-js`                             |

   **Aturan penyimpanan dan pemrosesan:**
   - Data disimpan di tabel terpisah `contact_submission_senders` (relasi
     1:1 ke `contact_submissions`), supaya entity utama tetap ringkas dan
     retensi cukup dengan menghapus baris.
   - **Sinyal dari browser dianggap petunjuk, bukan bukti**, karena bisa
     dipalsukan. Nilainya divalidasi (tipe, panjang, rentang angka) di BFF
     dan DTO, lalu dipakai hanya sebagai salah satu sinyal.
   - Frontend mengirim sinyal browser, perilaku, dan ID tracker dalam
     objek `client` di body. BFF memindahkannya ke DTO bersarang
     (`ClientSignalsDto`, semua opsional) dan meneruskan header jaringan
     dan browser (`CF-Connecting-IP` lewat `x-forwarded-for`,
     `CF-IPCountry`, `CF-Ray`, `user-agent`, `accept-language`,
     `referer`).
   - **Lookup eksternal dilakukan setelah kiriman tersimpan**: respons ke
     pengunjung tetap cepat. Urutannya: simpan kiriman, lalu secara async
     lookup IP (ip-api.com, timeout 3 detik yang sudah ada), cek Tor, cek
     MX, validasi telepon, simpan data pengirim, evaluasi aturan spam,
     baru kirim email bila tidak spam. Kalau lookup gagal, kolomnya
     `null` dan evaluasi tetap jalan dengan data yang ada.
   - Tidak memakai fingerprinting browser yang agresif (canvas, WebGL,
     font) dan tidak meminta izin lokasi (Geolocation API).
   - **Retensi 90 hari**: job terjadwal harian (`libs/backend/scheduler`)
     menghapus baris `contact_submission_senders` yang lebih tua dari 90
     hari. Isi kiriman (nama, email, HP, pesan) tidak diubah.
   - Data pengirim hanya bisa dilihat admin (endpoint dengan
     `SsoAuthGuard` + `assertAdminRole`), tidak pernah ikut di email
     notifikasi, dan IP tidak ditulis ke log aplikasi.

   **Tampilan di CMS** (halaman contact submissions):
   - detail kiriman menampilkan semua data di atas, dikelompokkan seperti
     tabel;
   - badge peringatan: Tor, data center, proxy/VPN, zona waktu tidak cocok
     dengan negara IP, tanpa riwayat kunjungan, semua field di-paste,
     email sekali pakai;
   - jumlah kiriman lain dari IP yang sama dan dari `visitorId` yang sama,
     plus filter "dari sumber yang sama";
   - tautan ke detail sesi tracker
     (`/activity-tracking/sessions/[id]`) untuk melihat halaman yang
     dikunjungi sebelum mengirim dan rekaman sesinya;
   - tombol salin IP, untuk dimasukkan manual ke Cloudflare WAF.

   **Halaman privasi** (`/privacy`, bahasa Inggris) ditambah paragraf
   tentang form kontak: data yang dicatat (IP, perkiraan lokasi, info
   browser dan perangkat, cara pengisian form, ID kunjungan), tujuannya
   (mencegah spam dan penyalahgunaan), masa simpan 90 hari, dan hanya bisa
   diakses admin. Ini memenuhi kewajiban transparansi UU PDP (UU No.
   27/2022) dan GDPR (dasar kepentingan sah untuk keamanan).

## Scope

### Fase 1

- `libs/shared`: konstanta aturan validasi contact (panjang, regex, jumlah
  URL maks) dan tipe `ContactClientSignals`.
- `enem-landing-account-api`: template konfirmasi tanpa isi pesan, nama
  dipotong dan disaring URL-nya.
- `enem-landing-web`:
  - pasang `vee-validate`, `@vee-validate/nuxt`, `@vee-validate/zod`,
    dan `zod`; form contact memakai VeeValidate dengan skema Zod dari
    konstanta bersama;
  - error per field, pemetaan error 400 server ke field, pesan 429;
  - field honeypot dan `startedAt`, pengecekan di BFF, sukses palsu untuk
    bot;
  - pengumpulan sinyal browser, perilaku form, dan ID tracker ke objek
    `client`;
  - BFF meneruskan header jaringan dan browser asli pengunjung;
  - paragraf tambahan di halaman `/privacy`.
- `enem-landing-api`:
  - DTO diperketat sesuai tabel (dengan `@Transform` untuk
    trim/lowercase) dan DTO bersarang `ClientSignalsDto`;
  - kolom `isSpam` (boolean, default `false`) dan `spamReason`
    (nullable) di `contact_submissions`;
  - tabel baru `contact_submission_senders` (migrasi TypeORM);
  - enrichment async: ip-api.com (tambah field `proxy`, `hosting`), cek
    Tor (cache Redis harian), cek MX, `libphonenumber-js`, daftar domain
    email sekali pakai;
  - modul deteksi spam berbasis aturan (isi pesan dan sinyal pengirim),
    email hanya dikirim jika `isSpam = false`;
  - rate limit per email dan kuota global auto-reply di Redis (per IP
    sudah dari tier `contact` Story 59);
  - job terjadwal harian untuk retensi 90 hari;
  - endpoint admin: detail data pengirim, filter spam, filter sumber yang
    sama, tandai/batalkan spam.
- `enem-landing-cms`: filter Spam, aksi "Bukan spam", detail data
  pengirim dengan badge peringatan, jumlah kiriman dari sumber yang sama,
  tautan ke sesi tracker, tombol salin IP.
- Tes unit untuk konstanta/skema validasi, DTO, deteksi spam, rate limit,
  enrichment (dengan mock lookup), dan job retensi; tes e2e form.

### Fase 2 (opsional)

- Cloudflare Turnstile di form dan verifikasi di BFF.
- Tombol "Blokir IP di Cloudflare" dari CMS lewat Cloudflare API
  (sementara di fase 1 cukup salin IP lalu blokir manual).

### Di luar scope

- Layanan anti-spam berbayar (Akismet, OOPSpam) dan layanan reputasi IP
  berbayar.
- Fingerprinting browser (canvas, WebGL, font) dan Geolocation API.
- Verifikasi email lewat double opt-in.
- Membersihkan spam lama yang sudah ada di database (bisa dilakukan
  manual dari CMS setelah fitur penandaan ada). Kiriman lama tidak punya
  data pengirim.

## Acceptance criteria

### Celah relay

- [ ] Email konfirmasi tidak lagi memuat isi `message`.
- [ ] Nama di email konfirmasi dipotong maks 50 karakter dan kiriman
      dengan URL di `fullname` ditolak validasi.
- [ ] Kiriman yang ditandai spam tidak memicu email notifikasi maupun
      email konfirmasi.

### Honeypot dan waktu pengisian

- [ ] Field honeypot tidak terlihat dan tidak bisa difokus dengan Tab,
      serta tidak terbaca screen reader.
- [ ] Kiriman dengan honeypot terisi atau dikirim kurang dari 3 detik
      setelah form tampil mendapat respons sukses yang sama bentuknya,
      tetapi tidak tersimpan dan tidak memicu email.
- [ ] Field honeypot dan `startedAt` tidak diteruskan ke
      `enem-landing-api`.

### Validasi

- [ ] Form contact memakai VeeValidate dengan skema Zod
      (`@vee-validate/zod`).
- [ ] Batas dan pola validasi berasal dari konstanta bersama di
      `libs/shared` yang juga dipakai DTO backend.
- [ ] Backend menolak (400) input yang melanggar aturan di tabel, dengan
      pesan per field.
- [ ] Frontend menampilkan error per field saat blur dan saat submit, dan
      error 400 dari server tampil di field yang sesuai.
- [ ] Input yang error punya `aria-invalid="true"` dan `aria-describedby`
      ke pesan error.
- [ ] Respons 429 menampilkan pesan khusus rate limit.
- [ ] Nilai di-trim (dan email di-lowercase) sebelum disimpan.

### Deteksi spam dan rate limit

- [ ] Kiriman yang cocok aturan spam tersimpan dengan `isSpam = true`
      dan `spamReason` terisi.
- [ ] Contoh spam kedua (penawaran traffic) ditandai spam lewat skor
      frasa, sedangkan pesan wajar seperti "Saya butuh bantuan SEO untuk
      website toko saya" **tidak** ditandai spam.
- [ ] Kiriman dari IP data center/Tor tanpa `visitorId` ditandai spam
      dengan `spamReason` berawalan `sender:`.
- [ ] Kiriman dengan domain email sekali pakai atau tanpa MX record
      ditandai spam.
- [ ] Endpoint contact memakai tier `contact` dari Story 59, dan batas
      per email serta kuota global auto-reply berjalan di Redis dengan
      prefix environment.

### Data pengirim

- [ ] Setiap kiriman yang tersimpan punya baris
      `contact_submission_senders` dengan IP asli, negara, `cfRay`, user
      agent, `Accept-Language`, `Referer`, dan sinyal dari browser yang
      dikirim.
- [ ] User agent dan `Accept-Language` yang tercatat adalah milik
      pengunjung, bukan milik BFF.
- [ ] ASN/ISP/organisasi, `isProxy`, `isHosting`, `isTor`, hasil cek MX,
      domain sekali pakai, dan negara/validitas telepon terisi setelah
      enrichment async (atau `null` bila lookup gagal).
- [ ] Respons ke pengunjung tidak menunggu lookup eksternal.
- [ ] Sinyal browser yang tidak valid (tipe salah, terlalu panjang, angka
      di luar rentang) ditolak atau diabaikan tanpa menggagalkan kiriman.
- [ ] Baris data pengirim yang lebih tua dari 90 hari dihapus oleh job
      terjadwal, sedangkan kirimannya tetap.
- [ ] Data pengirim tidak muncul di email notifikasi dan IP tidak ditulis
      ke log aplikasi.
- [ ] Halaman `/privacy` menjelaskan data yang dicatat, tujuan, masa
      simpan 90 hari, dan akses khusus admin.

### CMS

- [ ] Halaman contact submissions bisa memfilter kiriman spam.
- [ ] Aksi "Bukan spam" menghapus tanda tanpa mengirim email.
- [ ] CMS menampilkan `spamReason` di detail kiriman spam.
- [ ] Detail kiriman menampilkan data pengirim, badge peringatan, jumlah
      kiriman lain dari IP dan `visitorId` yang sama, dan filter sumber
      yang sama.
- [ ] Bila `sessionId` ada, tersedia tautan ke detail sesi tracker.
- [ ] Ada tombol salin IP.
- [ ] Endpoint data pengirim hanya bisa diakses admin.

### Kualitas

- [ ] Tes unit untuk skema/konstanta validasi, DTO, deteksi spam, rate
      limit, enrichment, dan job retensi.
- [ ] Contoh spam 2026-11-14 (`aiunt` / `credo` / `venia`) dipakai
      sebagai kasus uji dan ditolak validasi backend.
- [ ] Tes e2e: kiriman valid sukses, kiriman tidak valid menampilkan
      error per field, kiriman dengan honeypot terisi tidak muncul di CMS.
- [ ] Lint, format, test, build, dan e2e lulus lokal sebelum PR.

## Catatan terbuka

- **Lisensi ip-api.com** (ditunda, 2026-11-14): paket gratis ip-api.com
  hanya untuk penggunaan non-komersial, sedangkan situs memasang AdSense.
  Layanan ini sudah dipakai di tracking (`tracking/geo-lookup.ts`) sejak
  sebelum story ini. Untuk sementara story ini tetap memakai ip-api.com.
  Alternatif bila diputuskan pindah: database lokal (MaxMind GeoLite2,
  IPinfo Lite) atau hanya header Cloudflare untuk negara/kota.

## Langkah manual setelah deploy

1. Pastikan Story 58 sudah live (IP dari `CF-Connecting-IP`, origin hanya
   menerima traffic Cloudflare).
2. Opsional: aktifkan **Add visitor location headers** (Managed
   Transforms) di Cloudflare supaya `CF-IPCity` dan `CF-Region` tersedia
   tanpa lookup ke ip-api.com.
3. Pantau inbox dan CMS sekitar 1 minggu. Catat berapa kiriman yang
   ditandai spam, berapa yang lolos ke inbox, dan apakah ada pesan asli
   yang salah tertandai (cek `spamReason`).
4. Kalau spam masih lolos ke inbox, lanjut ke fase 2 (Turnstile).
5. Kalau ada spam beruntun dari IP atau `visitorId` yang sama, blokir IP
   tersebut di Cloudflare WAF.
6. Cek reputasi domain pengirim (misalnya Google Postmaster Tools) untuk
   memastikan tidak ada dampak dari periode auto-reply sebelumnya.

## Referensi

- OWASP, "Abuse of Functionality" dan pola contact form sebagai email
  relay: https://owasp.org/www-community/attacks/Abuse_of_Functionality
- VeeValidate, integrasi Nuxt dan Zod:
  https://vee-validate.logaretm.com/v4/integrations/nuxt/ dan
  https://vee-validate.logaretm.com/v4/integrations/zod-schema-validation/
- class-validator: https://github.com/typestack/class-validator
- Cloudflare, HTTP request headers (`CF-Connecting-IP`, `CF-IPCountry`,
  `CF-Ray`): https://developers.cloudflare.com/fundamentals/reference/http-headers/
- Cloudflare, Managed Transforms (visitor location headers):
  https://developers.cloudflare.com/rules/transform/managed-transforms/reference/
- Cloudflare Turnstile, verifikasi server-side:
  https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- ip-api.com, field `proxy` dan `hosting`: https://ip-api.com/docs/api:json
- Daftar exit node Tor: https://check.torproject.org/torbulkexitlist
- libphonenumber-js: https://github.com/catamphetamine/libphonenumber-js
- UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.
- GDPR Recital 49 (pengolahan data untuk keamanan jaringan sebagai
  kepentingan sah): https://gdpr-info.eu/recitals/no-49/
