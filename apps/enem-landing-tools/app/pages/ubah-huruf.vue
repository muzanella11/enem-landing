<script setup lang="ts">
import { ubahHuruf, type JenisHuruf } from '~/utils/teks';

const SLUG = 'ubah-huruf';
const events = useToolEvents(SLUG);
const teks = ref('');
const disalin = ref(false);
const PILIHAN: { id: JenisHuruf; label: string }[] = [
  { id: 'kapital', label: 'KAPITAL' },
  { id: 'kecil', label: 'kecil' },
  { id: 'judul', label: 'Judul Bahasa Indonesia' },
  { id: 'kalimat', label: 'Huruf awal kalimat' },
  { id: 'awal-kata', label: 'Huruf Awal Tiap Kata' },
];
const ubah = async (jenis: JenisHuruf) => {
  teks.value = ubahHuruf(teks.value, jenis);
  events.calculate(jenis);
};
const salin = async () => {
  await navigator.clipboard.writeText(teks.value);
  disalin.value = true;
  setTimeout(() => (disalin.value = false), 2000);
};
const faqs = [
  {
    q: 'Kata apa saja yang tidak dikapitalkan dalam judul?',
    a: 'Sesuai pedoman ejaan (EYD), kata tugas seperti di, ke, dari, dan, yang, untuk, pada, dengan, dan terhadap tetap huruf kecil kecuali di awal judul.',
  },
  {
    q: 'Bagaimana kata ulang dalam judul?',
    a: 'Kedua unsurnya dikapitalkan, misalnya Anak-Anak dan Sebaik-Baiknya.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Ubah Huruf Kapital"
    seo-title="Ubah Huruf Kapital, Kecil, dan Judul Sesuai EYD"
    description="Ubah teks menjadi huruf kapital, kecil, judul sesuai kaidah EYD (kata tugas tetap kecil), atau huruf awal kalimat, langsung di browser."
    :faqs="faqs"
    application-category="UtilitiesApplication"
    :sources="[
      {
        label:
          'Badan Bahasa: Ejaan Bahasa Indonesia yang Disempurnakan (EYD) Edisi V',
        url: 'https://ejaan.kemdikbud.go.id/',
      },
    ]"
    checked-at="2026-11-06"
  >
    <section class="card space-y-3">
      <label for="huruf-teks" class="field-label">Teks</label>
      <textarea id="huruf-teks" v-model="teks" rows="8" class="field-input" />
      <div class="flex flex-wrap gap-2">
        <button
          v-for="p in PILIHAN"
          :key="p.id"
          type="button"
          class="btn-secondary"
          @click="ubah(p.id)"
        >
          {{ p.label }}
        </button>
        <button
          type="button"
          class="btn-primary"
          :disabled="!teks"
          @click="salin"
        >
          {{ disalin ? 'Tersalin' : 'Salin' }}
        </button>
      </div>
    </section>
    <NuxtLink to="/penghitung-kata" class="btn-link">Penghitung kata</NuxtLink>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
