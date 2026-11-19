<script setup lang="ts">
usePageSeo({
  title: 'Syarat dan ketentuan',
  description:
    'Syarat penggunaan kalkulator dan alat di tools.muzanella.com, termasuk batasan hasil hitung.',
  path: '/syarat-ketentuan',
});
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-4 px-4 py-10 text-slate-700">
    <h1 class="text-3xl font-bold text-slate-900">Syarat dan ketentuan</h1>
    <p>
      Dengan memakai tools.muzanella.com, kamu menyetujui syarat berikut. Situs
      ini dikelola perorangan oleh Nurfirliana Muzanella dan bagian dari
      <a href="https://muzanella.com" class="btn-link">muzanella.com</a>.
    </p>

    <h2 class="text-xl font-semibold text-slate-900">
      Hasil hitung adalah estimasi
    </h2>
    <p>
      Kalkulator yang menghitung berdasarkan aturan mencantumkan sumbernya di
      halaman tool (peraturan pemerintah, OJK, Kemenag, PLN, dan lainnya).
      Hasilnya tetap estimasi dan bisa berbeda dari kasusmu, misalnya karena
      aturan perusahaan, kebijakan daerah, atau perubahan aturan yang belum kami
      perbarui. Hasil hitung bukan nasihat pajak, keuangan, hukum, kesehatan,
      atau keagamaan resmi. Cek kembali ke instansi atau ahli terkait sebelum
      mengambil keputusan.
    </p>

    <h2 class="text-xl font-semibold text-slate-900">Pembaruan aturan</h2>
    <p>
      Rumus dan tarif kami perbarui saat aturannya berubah. Tool yang bergantung
      pada aturan resmi mencantumkan tanggal pengecekan terakhirnya. Kalau
      menemukan angka yang keliru, kirim email ke
      <a href="mailto:muzanella11@gmail.com" class="btn-link"
        >muzanella11@gmail.com</a
      >
      agar segera kami perbaiki.
    </p>

    <h2 class="text-xl font-semibold text-slate-900">Pemakaian yang wajar</h2>
    <ul class="list-disc space-y-1 pl-5">
      <li>
        Kamu bebas memakai hasil hitung dan dokumen buatanmu (invoice, kwitansi,
        surat, PDF) untuk keperluan pribadi maupun usaha.
      </li>
      <li>
        Kamu bertanggung jawab atas isi dokumen yang kamu buat dan file yang
        kamu proses.
      </li>
      <li>
        Widget boleh dipasang lewat halaman
        <NuxtLink to="/pasang-widget" class="btn-link">Pasang widget</NuxtLink>.
        Menyalin kode, tampilan, atau isi halaman ke situs lain tanpa izin tidak
        diperbolehkan.
      </li>
      <li>
        Jangan memakai situs dengan cara yang mengganggu pengunjung lain,
        misalnya permintaan otomatis dalam jumlah besar.
      </li>
    </ul>

    <h2 class="text-xl font-semibold text-slate-900">Tautan dan iklan</h2>
    <p>
      Halaman bisa memuat tautan ke situs lain dan iklan dari Google AdSense.
      Kami tidak mengendalikan isi situs atau iklan tersebut, dan iklan bukan
      rekomendasi dari kami. Cara kerja iklan dan cookie dijelaskan di halaman
      <NuxtLink to="/privasi" class="btn-link">Privasi dan cookie</NuxtLink>.
    </p>

    <h2 class="text-xl font-semibold text-slate-900">Batas tanggung jawab</h2>
    <p>
      Situs disediakan apa adanya. Kami tidak bertanggung jawab atas kerugian
      yang timbul karena mengandalkan hasil hitung, dokumen yang dibuat, atau
      tautan ke situs lain.
    </p>

    <h2 class="text-xl font-semibold text-slate-900">Perubahan</h2>
    <p>
      Syarat ini bisa diperbarui sewaktu-waktu. Versi terbaru selalu ada di
      halaman ini.
    </p>

    <h2 class="text-xl font-semibold text-slate-900">Kontak</h2>
    <p>
      Pertanyaan soal syarat ini bisa dikirim ke
      <a href="mailto:muzanella11@gmail.com" class="btn-link"
        >muzanella11@gmail.com</a
      >
      atau lewat
      <a href="https://muzanella.com/#contact" class="btn-link"
        >formulir kontak</a
      >.
    </p>
  </div>
</template>
