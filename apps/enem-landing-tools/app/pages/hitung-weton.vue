<script setup lang="ts">
import { weton } from '~/utils/tanggal';

const SLUG = 'hitung-weton';
const events = useToolEvents(SLUG);
const lahir = ref('');
const pasangan = ref('');
const hasil = computed(() => (lahir.value ? weton(lahir.value) : null));
const hasilPasangan = computed(() =>
  pasangan.value ? weton(pasangan.value) : null,
);
watch(lahir, (value, old) => {
  if (value && !old) events.calculate('weton');
});
const faqs = [
  {
    q: 'Apa itu weton?',
    a: 'Weton adalah gabungan hari (Minggu sampai Sabtu) dan pasaran Jawa (Legi, Pahing, Pon, Wage, Kliwon) saat seseorang lahir. Siklusnya berulang setiap 35 hari.',
  },
  {
    q: 'Berapa neptu tiap hari dan pasaran?',
    a: 'Hari: Minggu 5, Senin 4, Selasa 3, Rabu 7, Kamis 8, Jumat 6, Sabtu 9. Pasaran: Legi 5, Pahing 9, Pon 7, Wage 4, Kliwon 8. Neptu weton adalah jumlah keduanya.',
  },
  {
    q: 'Apakah hasil weton menentukan jodoh atau nasib?',
    a: 'Perhitungan weton adalah bagian dari tradisi budaya Jawa. Tool ini menampilkan hari, pasaran, dan neptu sebagai informasi kalender, bukan ramalan.',
  },
];
const howTo = [
  'Isi tanggal lahir.',
  'Lihat hari, pasaran, dan neptu weton.',
  'Bila ingin, isi tanggal lahir pasangan untuk melihat jumlah neptu keduanya (tradisi).',
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Hitung Weton"
    seo-title="Hitung Weton Jawa dan Neptu dari Tanggal Lahir"
    description="Cari weton (hari dan pasaran Jawa) serta neptu dari tanggal lahir, termasuk jumlah neptu dua orang menurut tradisi Jawa."
    application-category="LifestyleApplication"
    :faqs="faqs"
    :how-to="howTo"
    checked-at="2026-11-06"
    :caveats="[
      'Acuan: 17 Agustus 1945 jatuh pada Jumat Legi. Perhitungan weton ditampilkan sebagai informasi budaya, bukan ramalan.',
    ]"
  >
    <section class="card space-y-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="lahir" class="field-label">Tanggal lahir</label>
          <input id="lahir" v-model="lahir" type="date" class="field-input" />
        </div>
        <div>
          <label for="pasangan" class="field-label"
            >Tanggal lahir pasangan (opsional)</label
          >
          <input
            id="pasangan"
            v-model="pasangan"
            type="date"
            class="field-input"
          />
        </div>
      </div>
      <div v-if="hasil" aria-live="polite" class="space-y-2">
        <p class="text-sm text-slate-500">Weton</p>
        <p class="text-3xl font-bold text-teal-800">
          {{ hasil.hari }} {{ hasil.pasaran }}
        </p>
        <p class="tabular text-slate-700">
          Neptu {{ hasil.neptuHari }} ({{ hasil.hari }}) +
          {{ hasil.neptuPasaran }} ({{ hasil.pasaran }}) =
          <strong>{{ hasil.neptu }}</strong>
        </p>
        <p v-if="hasilPasangan" class="tabular text-slate-700">
          Pasangan: {{ hasilPasangan.hari }} {{ hasilPasangan.pasaran }} (neptu
          {{ hasilPasangan.neptu }}). Jumlah neptu berdua:
          <strong>{{ hasil.neptu + hasilPasangan.neptu }}</strong>
          <span class="block text-xs text-slate-500"
            >Tafsiran jumlah neptu adalah tradisi, bukan kepastian.</span
          >
        </p>
      </div>
    </section>
    <AdSlot v-if="hasil" placement="result" :slug="SLUG" />
  </ToolShell>
</template>
