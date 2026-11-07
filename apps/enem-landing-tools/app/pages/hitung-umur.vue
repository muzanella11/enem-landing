<script setup lang="ts">
import { hitungUmur, weton } from '~/utils/tanggal';

const SLUG = 'hitung-umur';
const events = useToolEvents(SLUG);
const lahir = ref('');
const pada = ref('');
onMounted(() => (pada.value = new Date().toISOString().slice(0, 10)));
const umur = computed(() =>
  lahir.value && pada.value && lahir.value <= pada.value
    ? hitungUmur(lahir.value, pada.value)
    : null,
);
const wetonLahir = computed(() => (lahir.value ? weton(lahir.value) : null));
watch(lahir, (value, old) => {
  if (value && !old) events.calculate();
});
const tanggal = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', {
    dateStyle: 'long',
  });
const faqs = [
  {
    q: 'Bagaimana umur dihitung?',
    a: 'Dari tanggal lahir ke tanggal acuan (bawaan: hari ini) dalam tahun, bulan, dan hari penuh. Yang lahir 29 Februari berulang tahun pada 28 Februari di tahun bukan kabisat.',
  },
];
const howTo = [
  'Isi tanggal lahir.',
  'Ganti tanggal acuan bila ingin menghitung umur pada tanggal tertentu.',
  'Lihat umur, total hari, ulang tahun berikutnya, dan weton kelahiran.',
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Hitung Umur"
    seo-title="Hitung Umur dari Tanggal Lahir (Tahun, Bulan, Hari)"
    description="Hitung umur dalam tahun, bulan, dan hari dari tanggal lahir, total hari hidup, hari menuju ulang tahun berikutnya, dan weton kelahiran."
    application-category="LifestyleApplication"
    :faqs="faqs"
    :how-to="howTo"
    checked-at="2026-11-06"
  >
    <section class="card space-y-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="tanggal-lahir" class="field-label">Tanggal lahir</label>
          <input
            id="tanggal-lahir"
            v-model="lahir"
            type="date"
            class="field-input"
          />
        </div>
        <div>
          <label for="tanggal-acuan" class="field-label">Pada tanggal</label>
          <input
            id="tanggal-acuan"
            v-model="pada"
            type="date"
            class="field-input"
          />
        </div>
      </div>
      <div v-if="umur" aria-live="polite" class="space-y-1">
        <p class="text-3xl font-bold text-teal-800">
          {{ umur.tahun }} tahun {{ umur.bulan }} bulan {{ umur.hari }} hari
        </p>
        <p class="tabular text-slate-700">
          Total {{ umur.totalHari.toLocaleString('id-ID') }} hari. Ulang tahun
          berikutnya {{ tanggal(umur.ulangTahunBerikutnya) }} ({{
            umur.hariMenujuUlangTahun
          }}
          hari lagi).
        </p>
        <p v-if="wetonLahir" class="text-slate-700">
          Weton kelahiran:
          <NuxtLink to="/hitung-weton" class="btn-link"
            >{{ wetonLahir.hari }} {{ wetonLahir.pasaran }}</NuxtLink
          >
        </p>
      </div>
    </section>
    <AdSlot v-if="umur" placement="result" :slug="SLUG" />
  </ToolShell>
</template>
