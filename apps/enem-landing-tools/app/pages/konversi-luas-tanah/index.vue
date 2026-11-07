<script setup lang="ts">
import { SATUAN_LOKAL } from '~/data/satuan';

const SLUG = 'konversi-luas-tanah';
const events = useToolEvents(SLUG);
let dicatat = false;
const onHitung = () => {
  if (dicatat) return;
  dicatat = true;
  events.calculate('luas');
};
const sources = [
  ...new Map(
    SATUAN_LOKAL.flatMap((s) => s.varian.map((v) => v.sumber)).map((s) => [
      s.url,
      s,
    ]),
  ).values(),
];
const faqs = [
  {
    q: '1 tumbak berapa meter persegi?',
    a: 'Di Jawa Barat umumnya 1 tumbak = 14 m². Sebagian sumber menyebut 1 tumbak = 4 bata = 56 m². Tanyakan nilai yang dipakai di desa setempat sebelum transaksi.',
  },
  {
    q: '1 bata dan 1 ubin berapa meter persegi?',
    a: 'Keduanya umumnya 14 m². Bata lebih sering dipakai di Jawa Barat, ubin di Jawa Tengah, DI Yogyakarta, dan Jawa Timur.',
  },
  {
    q: 'Satuan mana yang dipakai di sertifikat?',
    a: 'Sertifikat tanah dari BPN selalu memakai meter persegi. Satuan lokal hanya kebiasaan dalam jual beli, jadi pastikan angka m² tertulis di perjanjian.',
  },
];
const howTo = [
  'Isi luas dan pilih satuannya, termasuk satuan lokal per daerah.',
  'Atau isi panjang dan lebar tanah dalam meter lalu klik Hitung luas.',
  'Lihat hasil dalam semua satuan, lalu salin bila perlu.',
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Konversi Luas Tanah"
    seo-title="Konversi Luas Tanah: Tumbak, Bata, Ubin, Are, Hektare ke m²"
    description="Ubah luas tanah antara m², are, hektare, dan satuan lokal seperti tumbak, bata, ubin, dan bahu. Semua variasi nilai per daerah ditampilkan beserta sumbernya."
    application-category="UtilitiesApplication"
    :faqs="faqs"
    :how-to="howTo"
    :sources="sources"
    checked-at="2026-11-06"
    :caveats="[
      'Nilai satuan lokal berbeda antar daerah dan antar sumber. Untuk transaksi, pakai luas m² di sertifikat atau hasil ukur BPN.',
    ]"
  >
    <LuasTanahCalculator @hitung="onHitung" />
    <section class="card">
      <h2 class="font-semibold">Satuan lokal</h2>
      <ul class="mt-2 grid gap-2 sm:grid-cols-3">
        <li v-for="s in SATUAN_LOKAL" :key="s.slug">
          <NuxtLink :to="`/konversi-luas-tanah/${s.slug}`" class="btn-link"
            >1 {{ s.nama.toLowerCase() }} berapa m²?</NuxtLink
          >
        </li>
      </ul>
    </section>
    <NuxtLink to="/simulasi-kpr" class="btn-link">Simulasi KPR</NuxtLink>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
