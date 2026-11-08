<script setup lang="ts">
usePageSeo({
  title: 'Privasi dan cookie',
  description:
    'Bagaimana tools.muzanella.com memperlakukan data, cookie, dan iklan.',
  path: '/privasi',
});
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-4 px-4 py-10 text-slate-700">
    <h1 class="text-3xl font-bold text-slate-900">Privasi dan cookie</h1>
    <p>
      Semua kalkulator dan alat di situs ini berjalan di browsermu. Angka yang
      kamu isi (gaji, harga rumah, harta, isi invoice) dan file yang kamu pilih
      (PDF, foto) diproses di perangkatmu sendiri dan tidak dikirim ke server
      kami.
    </p>
    <h2 class="text-xl font-semibold text-slate-900">Yang kami catat</h2>
    <ul class="list-disc space-y-1 pl-5">
      <li>
        Statistik kunjungan anonim: halaman yang dibuka, perangkat, perkiraan
        lokasi dari alamat IP, dan sumber kunjungan.
      </li>
      <li>
        Kejadian umum seperti "tool dibuka" atau "tombol hitung ditekan", tanpa
        angka atau isi yang kamu masukkan.
      </li>
      <li>Titik klik (koordinat) untuk heatmap, tanpa teks halaman.</li>
    </ul>
    <p>Kami tidak merekam sesi atau layar pengunjung.</p>
    <h2 class="text-xl font-semibold text-slate-900">Google Analytics</h2>
    <p>
      Kami memakai Google Analytics untuk statistik kunjungan (halaman yang
      dibuka, perangkat, sumber kunjungan) dan untuk mengetahui halaman mana
      yang menghasilkan pendapatan iklan. Selain kunjungan, Google Analytics
      hanya menerima nama tool dan kejadian umum seperti "tombol hitung
      ditekan", "hasil dibagikan", atau "file diunduh". Google Analytics
      memasang cookie dan tidak pernah menerima angka atau file yang kamu isi.
      Kamu bisa menolaknya lewat
      <a
        href="https://tools.google.com/dlpage/gaoptout"
        class="btn-link"
        target="_blank"
        rel="noopener"
        >add-on penonaktifan Google Analytics</a
      >.
    </p>
    <h2 class="text-xl font-semibold text-slate-900">Iklan</h2>
    <p>
      Situs ini menampilkan iklan Google AdSense. Google, sebagai vendor pihak
      ketiga, memakai cookie untuk menayangkan iklan berdasarkan kunjunganmu ke
      situs ini dan situs lain. Kamu bisa menonaktifkan iklan personal lewat
      <a
        href="https://adssettings.google.com"
        class="btn-link"
        target="_blank"
        rel="noopener"
        >Setelan Iklan Google</a
      >.
    </p>
    <p>
      Pengunjung dari Wilayah Ekonomi Eropa, Inggris, dan Swiss akan melihat
      pesan persetujuan dari Google sebelum cookie iklan atau statistik
      dipasang, dan bisa mengubah pilihannya kapan saja lewat tautan yang
      disediakan pesan tersebut.
    </p>
    <p>
      Link berbagi hasil menyimpan data di bagian setelah tanda # pada alamat,
      yang tidak pernah dikirim browser ke server mana pun, dan bagian itu
      dihapus dari address bar sebelum iklan dan statistik dimuat.
    </p>
  </div>
</template>
