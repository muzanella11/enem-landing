<script setup lang="ts">
usePageSeo({
  title: 'Privasi dan cookie',
  description:
    'Bagaimana tools.muzanella.com memperlakukan data, cookie, dan iklan.',
  path: '/privasi',
});

const { state, set } = useConsent();
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
      Kalau kamu memilih "Setuju", kami juga memakai Google Analytics untuk
      statistik kunjungan (halaman yang dibuka, perangkat, sumber kunjungan).
      Google Analytics memasang cookie dan tidak pernah menerima angka atau
      file yang kamu isi. Kalau kamu menolak, atau belum memilih, Google
      Analytics tidak dimuat sama sekali.
    </p>
    <h2 class="text-xl font-semibold text-slate-900">Iklan</h2>
    <p>
      Situs ini dapat menampilkan iklan Google AdSense. Kalau kamu menolak iklan
      personal, yang tampil hanya iklan non-personal. Link berbagi hasil
      menyimpan data di bagian setelah tanda # pada alamat, yang tidak pernah
      dikirim browser ke server mana pun, dan bagian itu dihapus dari address
      bar sebelum iklan dimuat.
    </p>
    <h2 class="text-xl font-semibold text-slate-900">Pilihanmu</h2>
    <p>
      Status saat ini:
      <strong>{{
        state === 'granted'
          ? 'iklan personal dan Google Analytics diizinkan'
          : state === 'denied'
            ? 'hanya iklan non-personal, tanpa Google Analytics'
            : 'belum memilih'
      }}</strong>
    </p>
    <ClientOnly>
      <div class="flex gap-2">
        <button type="button" class="btn-secondary" @click="set('denied')">
          Tolak iklan personal
        </button>
        <button type="button" class="btn-primary" @click="set('granted')">
          Izinkan
        </button>
      </div>
    </ClientOnly>
  </div>
</template>
