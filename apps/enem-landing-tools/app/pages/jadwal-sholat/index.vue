<script setup lang="ts">
import { KEMENAG_PARAMS } from '~/data/sholat/kemenag';

const SLUG = 'jadwal-sholat';
const faqs = [
  {
    q: 'Jadwal sholat ini memakai metode apa?',
    a: "Kriteria Kemenag RI: sudut Subuh 20 derajat, Isya 18 derajat, Ashar mazhab Syafi'i, ihtiyat (pengaman) sekitar 2 menit, Imsak 10 menit sebelum Subuh, dan koreksi ketinggian tempat untuk terbit dan Maghrib.",
  },
  {
    q: 'Seberapa akurat jadwalnya?',
    a: 'Kami membandingkannya dengan jadwal Kemenag untuk kota di zona WIB, WITA, dan WIT; selisihnya paling banyak 2 menit. Untuk keperluan resmi, rujuk jadwal Kemenag atau masjid setempat.',
  },
  {
    q: 'Apakah lokasi saya dikirim?',
    a: 'Tidak. Bila memakai tombol "Pakai lokasiku", posisi hanya dipakai di browsermu untuk memilih kota terdekat.',
  },
];
const howTo = [
  'Cari kabupaten/kotamu, atau tekan "Pakai lokasiku" untuk memilih kota terdekat.',
  'Lihat jadwal sholat hari ini dan hitung mundur ke waktu sholat berikutnya.',
  'Buka jadwal sebulan untuk dicetak atau disimpan.',
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Jadwal Sholat Hari Ini"
    seo-title="Jadwal Sholat Hari Ini Seluruh Indonesia"
    description="Jadwal sholat hari ini dan sebulan untuk 500+ kabupaten/kota di Indonesia, mengikuti kriteria Kemenag RI."
    application-category="LifestyleApplication"
    :faqs="faqs"
    :how-to="howTo"
    :sources="KEMENAG_PARAMS.sources"
    :checked-at="KEMENAG_PARAMS.checkedAt"
    wide
  >
    <KotaPicker base-path="/jadwal-sholat" />
    <KotaDirectory
      base-path="/jadwal-sholat"
      title="Jadwal sholat per kabupaten/kota"
    />
  </ToolShell>
</template>
