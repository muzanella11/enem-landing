import type { ToolsPublicConfig } from '@enem-landing/shared-types';

/**
 * Build-time snapshot of the tool registry (Story 25). The live registry
 * comes from the CMS via `/api/tools/config`; this snapshot is only used
 * when that request fails, so pages never render empty. Keep it in sync
 * with the seed in enem-landing-api's CreateToolsTables migration.
 */
export const TOOLS_SNAPSHOT: ToolsPublicConfig = {
  tools: [
    {
      slug: 'kalkulator-gaji-bersih',
      name: 'Kalkulator Gaji Bersih',
      shortDescription:
        'Hitung take home pay, potongan BPJS, dan PPh 21 skema TER, termasuk rekonsiliasi Desember dan THR.',
      category: 'keuangan',
      badge: 'baru',
    },
    {
      slug: 'simulasi-kpr',
      name: 'Simulasi KPR',
      shortDescription:
        'Cicilan KPR bunga fixed lalu floating, tabel amortisasi, biaya awal, dan pelunasan sebagian.',
      category: 'keuangan',
      badge: null,
    },
    {
      slug: 'kalkulator-zakat',
      name: 'Kalkulator Zakat',
      shortDescription:
        'Zakat penghasilan, zakat maal, dan zakat fitrah dengan nisab dari harga emas terbaru.',
      category: 'ibadah',
      badge: null,
    },
    {
      slug: 'gabung-pdf',
      name: 'Gabung PDF',
      shortDescription:
        'Gabungkan beberapa file PDF jadi satu, langsung di browser.',
      category: 'dokumen',
      badge: null,
    },
    {
      slug: 'pisah-pdf',
      name: 'Pisah PDF',
      shortDescription: 'Ambil halaman atau rentang halaman tertentu dari PDF.',
      category: 'dokumen',
      badge: null,
    },
    {
      slug: 'atur-halaman-pdf',
      name: 'Atur Halaman PDF',
      shortDescription:
        'Urutkan ulang, putar, dan hapus halaman PDF dengan thumbnail.',
      category: 'dokumen',
      badge: null,
    },
    {
      slug: 'gambar-ke-pdf',
      name: 'Gambar ke PDF',
      shortDescription:
        'Ubah foto JPG, PNG, atau HEIC jadi satu PDF ukuran A4 atau F4.',
      category: 'dokumen',
      badge: null,
    },
    {
      slug: 'kompres-gambar',
      name: 'Kompres Gambar',
      shortDescription:
        'Perkecil ukuran foto sampai target, misalnya di bawah 200 KB untuk formulir pendaftaran.',
      category: 'dokumen',
      badge: null,
    },
    {
      slug: 'ubah-ukuran-gambar',
      name: 'Ubah Ukuran Gambar',
      shortDescription: 'Resize foto dan buat pas foto 2x3, 3x4, atau 4x6.',
      category: 'dokumen',
      badge: null,
    },
    {
      slug: 'konversi-gambar',
      name: 'Konversi Gambar',
      shortDescription: 'Ubah format gambar JPG, PNG, WebP, dan HEIC.',
      category: 'dokumen',
      badge: null,
    },
    {
      slug: 'buat-invoice',
      name: 'Buat Invoice',
      shortDescription:
        'Buat invoice PDF untuk UMKM dan freelancer, tanpa akun.',
      category: 'keuangan',
      badge: null,
    },
    {
      slug: 'buat-kwitansi',
      name: 'Buat Kwitansi',
      shortDescription: 'Buat kwitansi PDF lengkap dengan terbilang.',
      category: 'keuangan',
      badge: null,
    },
    {
      slug: 'terbilang',
      name: 'Terbilang',
      shortDescription: 'Ubah angka jadi kata dalam Bahasa Indonesia.',
      category: 'keuangan',
      badge: null,
    },
    {
      slug: 'upah-minimum',
      name: 'UMP 2026 dan 2027',
      shortDescription:
        'Daftar upah minimum provinsi 2026 dan 2027 di 38 provinsi, lengkap dengan kenaikannya.',
      category: 'keuangan',
      badge: 'baru',
    },
    {
      slug: 'kalkulator-lembur',
      name: 'Kalkulator Lembur',
      shortDescription:
        'Hitung upah lembur hari kerja dan hari libur sesuai PP 35/2021.',
      category: 'keuangan',
      badge: 'baru',
    },
    {
      slug: 'kalkulator-thr',
      name: 'Kalkulator THR',
      shortDescription:
        'THR penuh atau proporsional, estimasi pajaknya, dan batas tanggal bayar.',
      category: 'keuangan',
      badge: 'baru',
    },
    {
      slug: 'jadwal-sholat',
      name: 'Jadwal Sholat',
      shortDescription:
        'Jadwal sholat hari ini dan sebulan untuk 500+ kabupaten/kota, kriteria Kemenag RI.',
      category: 'ibadah',
      badge: 'baru',
    },
    {
      slug: 'jadwal-imsakiyah',
      name: 'Jadwal Imsakiyah Ramadan',
      shortDescription:
        'Imsakiyah Ramadan 1448 H / 2027 per kabupaten/kota: imsak, subuh, dan waktu berbuka.',
      category: 'ibadah',
      badge: 'baru',
    },
    {
      slug: 'arah-kiblat',
      name: 'Arah Kiblat',
      shortDescription:
        'Arah kiblat dari kota atau lokasimu, dengan kompas di HP.',
      category: 'ibadah',
      badge: 'baru',
    },
    {
      slug: 'libur-nasional',
      name: 'Libur Nasional dan Cuti Bersama',
      shortDescription:
        'Libur nasional dan cuti bersama dari kalender Bank Indonesia, saran long weekend, dan file .ics.',
      category: 'dokumen',
      badge: 'baru',
    },
    {
      slug: 'hitung-hari-kerja',
      name: 'Hitung Hari Kerja',
      shortDescription:
        'Jumlah hari kerja di antara dua tanggal, termasuk libur nasional dan cuti bersama.',
      category: 'dokumen',
      badge: 'baru',
    },
    {
      slug: 'kalkulator-token-listrik',
      name: 'Kalkulator Token Listrik',
      shortDescription:
        'Token listrik PLN dapat berapa kWh per golongan, termasuk admin dan pajak daerah.',
      category: 'keuangan',
      badge: 'baru',
    },
    {
      slug: 'harga-emas',
      name: 'Harga Emas Hari Ini',
      shortDescription:
        'Harga spot emas per gram dalam rupiah, harga per 1 sampai 100 gram, dan grafik riwayat.',
      category: 'keuangan',
      badge: 'baru',
    },
    {
      slug: 'kalkulator-emas',
      name: 'Kalkulator Emas',
      shortDescription:
        'Nilai perhiasan per karat, gram ke rupiah, dan untung/rugi investasi emas.',
      category: 'keuangan',
      badge: 'baru',
    },
    {
      slug: 'kalkulator-pesangon',
      name: 'Kalkulator Pesangon',
      shortDescription:
        'Pesangon, penghargaan masa kerja, penggantian hak, dan pajaknya sesuai alasan PHK.',
      category: 'keuangan',
      badge: 'baru',
    },
    {
      slug: 'simulasi-kredit-kendaraan',
      name: 'Simulasi Kredit Motor dan Mobil',
      shortDescription:
        'Cicilan kredit kendaraan bunga flat, uang muka yang disiapkan, dan bunga efektif setara.',
      category: 'keuangan',
      badge: 'baru',
    },
    {
      slug: 'simulasi-kta',
      name: 'Simulasi KTA',
      shortDescription:
        'Cicilan KTA, dana yang cair setelah provisi, dan bunga efektif setara.',
      category: 'keuangan',
      badge: 'baru',
    },
    {
      slug: 'hitung-weton',
      name: 'Hitung Weton',
      shortDescription:
        'Weton (hari dan pasaran Jawa) dan neptu dari tanggal lahir.',
      category: 'dokumen',
      badge: 'baru',
    },
    {
      slug: 'konversi-hijriah',
      name: 'Konversi Tanggal Hijriah',
      shortDescription: 'Ubah tanggal Masehi ke Hijriah dan sebaliknya.',
      category: 'dokumen',
      badge: 'baru',
    },
    {
      slug: 'hitung-umur',
      name: 'Hitung Umur',
      shortDescription:
        'Umur dalam tahun, bulan, dan hari, plus ulang tahun berikutnya.',
      category: 'dokumen',
      badge: 'baru',
    },
    {
      slug: 'selisih-tanggal',
      name: 'Selisih Tanggal',
      shortDescription:
        'Jumlah hari di antara dua tanggal, atau tambah/kurangi hari.',
      category: 'dokumen',
      badge: 'baru',
    },
    {
      slug: 'link-whatsapp',
      name: 'Buat Link WhatsApp',
      shortDescription:
        'Link wa.me dengan pesan otomatis dan QR code untuk toko online.',
      category: 'keuangan',
      badge: 'baru',
    },
    {
      slug: 'buat-qr-code',
      name: 'Buat QR Code',
      shortDescription:
        'QR code untuk link, teks, WiFi, dan kontak, unduh PNG atau SVG.',
      category: 'dokumen',
      badge: 'baru',
    },
    {
      slug: 'konversi-luas-tanah',
      name: 'Konversi Luas Tanah',
      shortDescription:
        'Tumbak, bata, ubin, bahu, are, dan hektare ke m², lengkap per daerah.',
      category: 'dokumen',
      badge: 'baru',
    },
    {
      slug: 'konversi-satuan',
      name: 'Konversi Satuan',
      shortDescription:
        'Panjang, berat, volume, luas, kecepatan, dan suhu dalam satu tempat.',
      category: 'dokumen',
      badge: 'baru',
    },
    {
      slug: 'pdf-ke-jpg',
      name: 'PDF ke JPG',
      shortDescription:
        'Ubah halaman PDF jadi gambar JPG/PNG 150 atau 300 dpi.',
      category: 'dokumen',
      badge: 'baru',
    },
    {
      slug: 'kompres-pdf',
      name: 'Kompres PDF',
      shortDescription: 'Kecilkan PDF hasil scan, bisa target di bawah 1 MB.',
      category: 'dokumen',
      badge: 'baru',
    },
    {
      slug: 'watermark-pdf',
      name: 'Watermark PDF',
      shortDescription: 'Tambah teks atau logo transparan ke halaman PDF.',
      category: 'dokumen',
      badge: 'baru',
    },
    {
      slug: 'tanda-tangan-pdf',
      name: 'Tanda Tangan PDF',
      shortDescription:
        'Gambar atau foto tanda tangan, tempel dan geser di PDF.',
      category: 'dokumen',
      badge: 'baru',
    },
    {
      slug: 'buat-surat',
      name: 'Buat Surat Otomatis',
      shortDescription:
        'Surat lamaran kerja, kuasa, pernyataan, izin, resign, dan domisili jadi PDF.',
      category: 'dokumen',
      badge: 'baru',
    },
    {
      slug: 'hitung-hpl',
      name: 'Hitung HPL Kehamilan',
      shortDescription:
        'Hari perkiraan lahir, usia kehamilan, dan trimester dari HPHT.',
      category: 'kesehatan',
      badge: 'baru',
    },
    {
      slug: 'kalkulator-masa-subur',
      name: 'Kalkulator Masa Subur',
      shortDescription:
        'Perkiraan ovulasi dan masa subur tiga siklus ke depan.',
      category: 'kesehatan',
      badge: 'baru',
    },
    {
      slug: 'kalkulator-bmi',
      name: 'Kalkulator BMI',
      shortDescription:
        'Indeks massa tubuh dengan kategori Kemenkes dan WHO Asia.',
      category: 'kesehatan',
      badge: 'baru',
    },
    {
      slug: 'kalkulator-kalori',
      name: 'Kalkulator Kalori',
      shortDescription:
        'Kebutuhan kalori harian (BMR, TDEE) dan target berat aman.',
      category: 'kesehatan',
      badge: 'baru',
    },
    {
      slug: 'kalkulator-ipk',
      name: 'Kalkulator IPK',
      shortDescription:
        'IPS dan IPK dengan skala nilai kampus, plus simulasi target IPK.',
      category: 'pendidikan',
      badge: 'baru',
    },
    {
      slug: 'simulasi-nilai-skd',
      name: 'Simulasi Nilai SKD CPNS',
      shortDescription:
        'Cek skor TWK, TIU, TKP terhadap ambang batas per formasi.',
      category: 'pendidikan',
      badge: 'baru',
    },
    {
      slug: 'kalkulator-deposito',
      name: 'Kalkulator Deposito',
      shortDescription:
        'Bunga deposito bersih setelah pajak 20%, tenor dan ARO.',
      category: 'keuangan',
      badge: 'baru',
    },
    {
      slug: 'kalkulator-tabungan',
      name: 'Kalkulator Target Tabungan',
      shortDescription:
        'Setoran bulanan untuk mencapai target dana tepat waktu.',
      category: 'keuangan',
      badge: 'baru',
    },
    {
      slug: 'kalkulator-investasi',
      name: 'Kalkulator Investasi Rutin',
      shortDescription:
        'Investasi bulanan dengan bunga majemuk, grafik, dan nilai riil.',
      category: 'keuangan',
      badge: 'baru',
    },
    {
      slug: 'kalkulator-dana-darurat',
      name: 'Kalkulator Dana Darurat',
      shortDescription:
        'Dana darurat ideal sesuai status keluarga dan penghasilan.',
      category: 'keuangan',
      badge: 'baru',
    },
    {
      slug: 'kalkulator-dana-pensiun',
      name: 'Kalkulator Dana Pensiun',
      shortDescription:
        'Dana pensiun yang dibutuhkan dengan inflasi dan setoran bulanan.',
      category: 'keuangan',
      badge: 'baru',
    },
    {
      slug: 'biaya-sim',
      name: 'Biaya SIM',
      shortDescription:
        'Tarif resmi buat dan perpanjang SIM semua golongan (PP 76/2020).',
      category: 'keuangan',
      badge: 'baru',
    },
    {
      slug: 'biaya-stnk-bpkb',
      name: 'Biaya STNK dan BPKB',
      shortDescription:
        'Tarif ganti plat, perpanjang STNK, dan BPKB motor/mobil.',
      category: 'keuangan',
      badge: 'baru',
    },
    {
      slug: 'kalkulator-pajak-kendaraan',
      name: 'Kalkulator Pajak Kendaraan',
      shortDescription: 'PKB, opsen 66%, SWDKLLJ, denda, dan biaya ganti plat.',
      category: 'keuangan',
      badge: 'baru',
    },
    {
      slug: 'kalkulator-hpp',
      name: 'Kalkulator HPP',
      shortDescription:
        'Harga pokok produksi per unit dari bahan, tenaga kerja, overhead.',
      category: 'keuangan',
      badge: 'baru',
    },
    {
      slug: 'kalkulator-harga-jual',
      name: 'Kalkulator Harga Jual',
      shortDescription: 'Harga jual dari HPP dengan target margin atau markup.',
      category: 'keuangan',
      badge: 'baru',
    },
    {
      slug: 'kalkulator-bep',
      name: 'Kalkulator BEP',
      shortDescription: 'Titik impas usaha dalam unit dan rupiah.',
      category: 'keuangan',
      badge: 'baru',
    },
    {
      slug: 'kalkulator-fee-marketplace',
      name: 'Kalkulator Fee Marketplace',
      shortDescription:
        'Laba bersih setelah fee marketplace dan harga jual minimal.',
      category: 'keuangan',
      badge: 'baru',
    },
    {
      slug: 'kalkulator-pph-umkm',
      name: 'Kalkulator PPh UMKM 0,5%',
      shortDescription:
        'PPh final UMKM per bulan sesuai PP 55/2022 dan PP 20/2026.',
      category: 'keuangan',
      badge: 'baru',
    },
    {
      slug: 'iuran-bpjs-kesehatan',
      name: 'Iuran BPJS Kesehatan Mandiri',
      shortDescription:
        'Iuran per kelas untuk keluarga, tunggakan, dan denda rawat inap.',
      category: 'kesehatan',
      badge: 'baru',
    },
    {
      slug: 'kalkulator-patungan',
      name: 'Kalkulator Patungan',
      shortDescription:
        'Bagi tagihan per orang dengan pajak, service, diskon, dan ongkir.',
      category: 'keuangan',
      badge: 'baru',
    },
    {
      slug: 'kalkulator-waris',
      name: 'Kalkulator Waris Islam',
      shortDescription:
        'Pembagian waris faraid dengan alasan bagian tiap ahli waris.',
      category: 'ibadah',
      badge: 'baru',
    },
    {
      slug: 'kalkulator-fidyah',
      name: 'Kalkulator Fidyah',
      shortDescription:
        'Fidyah puasa dalam uang atau beras sesuai nilai BAZNAS.',
      category: 'ibadah',
      badge: 'baru',
    },
    {
      slug: 'kalkulator-kafarat',
      name: 'Kalkulator Kafarat',
      shortDescription: 'Kafarat sumpah, zihar, dan batal puasa Ramadan.',
      category: 'ibadah',
      badge: 'baru',
    },
    {
      slug: 'penghitung-kata',
      name: 'Penghitung Kata',
      shortDescription:
        'Jumlah kata, karakter, kalimat, paragraf, dan waktu baca.',
      category: 'pendidikan',
      badge: 'baru',
    },
    {
      slug: 'ubah-huruf',
      name: 'Ubah Huruf Kapital',
      shortDescription:
        'Kapital, kecil, dan judul sesuai EYD dalam sekali klik.',
      category: 'pendidikan',
      badge: 'baru',
    },
    {
      slug: 'buat-daftar-pustaka',
      name: 'Buat Daftar Pustaka',
      shortDescription:
        'Daftar pustaka APA 7 dan Harvard untuk buku, jurnal, web, skripsi.',
      category: 'pendidikan',
      badge: 'baru',
    },
    {
      slug: 'kalkulator-nilai-rapor',
      name: 'Kalkulator Nilai Rapor',
      shortDescription: 'Nilai akhir berbobot dan nilai UAS yang dibutuhkan.',
      category: 'pendidikan',
      badge: 'baru',
    },
    {
      slug: 'biaya-bangun-rumah',
      name: 'Biaya Bangun Rumah',
      shortDescription:
        'Estimasi biaya bangun dari luas, biaya per m², dan cadangan.',
      category: 'keuangan',
      badge: 'baru',
    },
    {
      slug: 'kalkulator-pbb',
      name: 'Kalkulator PBB',
      shortDescription: 'PBB-P2 tahunan dari NJOP, NJOPTKP, dan tarif daerah.',
      category: 'keuangan',
      badge: 'baru',
    },
    {
      slug: 'biaya-balik-nama-rumah',
      name: 'Biaya Balik Nama Rumah',
      shortDescription: 'BPHTB, PPh penjual, honor PPAT, dan biaya BPN.',
      category: 'keuangan',
      badge: 'baru',
    },
    {
      slug: 'hapus-latar-foto',
      name: 'Hapus Latar Foto',
      shortDescription:
        'Latar foto jadi transparan atau warna lain, tanpa upload.',
      category: 'dokumen',
      badge: 'baru',
    },
    {
      slug: 'pas-foto-latar-merah-biru',
      name: 'Pas Foto Latar Merah/Biru',
      shortDescription:
        'Pas foto 2x3, 3x4, 4x6 latar merah/biru plus lembar cetak.',
      category: 'dokumen',
      badge: 'baru',
    },
  ].map((tool, index) => ({
    ...tool,
    category: tool.category as ToolsPublicConfig['tools'][number]['category'],
    badge: tool.badge as ToolsPublicConfig['tools'][number]['badge'],
    sortOrder: index,
    // Story 45: faraid stays off until a qualified reviewer signs it off.
    enabled: tool.slug !== 'kalkulator-waris',
    // Ads stay off in the fallback: if the CMS can't be reached we don't
    // know whether AdSense is approved or switched off.
    adsEnabled: false,
  })),
  donationOptions: [],
  settings: {
    adsEnabled: false,
    adsenseClientId: null,
    adsenseSlotResult: null,
    adsenseSlotSidebar: null,
    donationCtaText: 'Traktir kopi',
  },
};
