<script setup lang="ts">
import { KEMENAG_PARAMS } from '~/data/sholat/kemenag';
import { tanggalRamadan } from '~/utils/sholat';

const SLUG = 'jadwal-imsakiyah';
const ramadan = tanggalRamadan(1448);
const awal = ramadan[0]?.tanggal;
const awalLabel = awal
  ? new Date(`${awal}T00:00:00`).toLocaleDateString('id-ID', {
      dateStyle: 'long',
    })
  : '';
const faqs = [
  {
    q: 'Kapan 1 Ramadan 1448 H?',
    a: `Menurut kalender Umm al-Qura, 1 Ramadan 1448 H jatuh sekitar ${awalLabel}. Di Indonesia, awal Ramadan ditetapkan lewat sidang isbat Kemenag, jadi tanggalnya bisa berbeda satu hari.`,
  },
  {
    q: 'Kapan waktu imsak?',
    a: 'Imsak 10 menit sebelum Subuh, sesuai kebiasaan jadwal Kemenag. Batas akhir sahur sebenarnya adalah waktu Subuh.',
  },
];
const howTo = [
  'Cari kabupaten/kotamu atau pakai lokasi perangkat.',
  'Lihat jadwal imsak, subuh, dan maghrib (buka puasa) selama Ramadan.',
  'Cetak atau simpan jadwal imsakiyah.',
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Jadwal Imsakiyah Ramadan 1448 H"
    seo-title="Jadwal Imsakiyah Ramadan 2027 (1448 H)"
    description="Jadwal imsakiyah Ramadan 1448 H / 2027 untuk 500+ kabupaten/kota: imsak, subuh, dan waktu berbuka, mengikuti kriteria Kemenag RI."
    application-category="LifestyleApplication"
    :faqs="faqs"
    :how-to="howTo"
    :sources="KEMENAG_PARAMS.sources"
    :checked-at="KEMENAG_PARAMS.checkedAt"
    :caveats="[
      'Awal Ramadan mengikuti kalender Umm al-Qura sebagai perkiraan sampai ditetapkan sidang isbat Kemenag.',
    ]"
    wide
  >
    <KotaPicker base-path="/jadwal-imsakiyah" />
    <LazyKotaDirectory
      hydrate-never
      base-path="/jadwal-imsakiyah"
      title="Imsakiyah per kabupaten/kota"
    />
  </ToolShell>
</template>
