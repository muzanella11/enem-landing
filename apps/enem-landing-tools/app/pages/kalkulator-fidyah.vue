<script setup lang="ts">
import { CHECKED_AT, FIDYAH, SUMBER_FIDYAH } from '~/data/fidyah';
import { formatRupiah } from '~/utils/format';

const SLUG = 'kalkulator-fidyah';
const events = useToolEvents(SLUG);
const form = reactive({
  hari: 0,
  uangPerHari: FIDYAH.uangPerHari,
  berasKg: FIDYAH.berasKgPerHari,
});
const hasil = ref<{ uang: number; beras: number } | null>(null);
const hitung = () => {
  const hari = Math.max(0, Math.round(Number(form.hari)));
  hasil.value = {
    uang: hari * form.uangPerHari,
    beras: hari * Number(form.berasKg),
  };
  events.calculate();
};
const faqs = [
  {
    q: 'Siapa yang membayar fidyah?',
    a: 'Orang yang tidak mampu berpuasa dan tidak bisa menggantinya, seperti lansia yang lemah dan orang sakit menahun. Ibu hamil dan menyusui diperinci oleh ulama: sebagian mewajibkan qadha saja, sebagian qadha dan fidyah.',
  },
  {
    q: 'Berapa fidyah per hari tahun 2026?',
    a: `BAZNAS RI menetapkan Rp${FIDYAH.uangPerHari.toLocaleString('id-ID')} per hari per jiwa untuk pembayaran melalui BAZNAS (SK Ketua BAZNAS RI No. 14 Tahun 2026). BAZNAS daerah bisa menetapkan nilai berbeda.`,
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator Fidyah"
    seo-title="Kalkulator Fidyah Puasa 2026: Uang atau Beras per Hari"
    description="Hitung fidyah puasa Ramadan dalam uang atau beras berdasarkan jumlah hari, dengan nilai BAZNAS 2026 yang bisa diubah sesuai daerah."
    :faqs="faqs"
    application-category="LifestyleApplication"
    :sources="SUMBER_FIDYAH"
    :checked-at="CHECKED_AT"
    :caveats="[
      'Nilai uang fidyah berbeda per BAZNAS daerah; ubah bila daerah Anda menetapkan lain.',
    ]"
  >
    <form class="card grid gap-3 sm:grid-cols-3" @submit.prevent="hitung">
      <div>
        <label for="fid-hari" class="field-label"
          >Jumlah hari tidak berpuasa</label
        >
        <input
          id="fid-hari"
          v-model.number="form.hari"
          type="number"
          min="0"
          max="400"
          class="field-input"
        />
      </div>
      <RupiahInput
        id="fid-uang"
        v-model="form.uangPerHari"
        label="Fidyah uang per hari"
      />
      <div>
        <label for="fid-beras" class="field-label">Beras per hari (kg)</label>
        <input
          id="fid-beras"
          v-model.number="form.berasKg"
          type="number"
          min="0"
          step="0.05"
          class="field-input"
        />
      </div>
      <button type="submit" class="btn-primary sm:col-span-3">
        Hitung fidyah
      </button>
    </form>
    <section v-if="hasil" class="card space-y-2" aria-live="polite">
      <p class="text-sm text-slate-600">Fidyah dalam uang</p>
      <p class="tabular text-3xl font-bold text-primary">
        {{ formatRupiah(hasil.uang) }}
      </p>
      <p class="tabular text-sm">
        Atau beras sekitar
        {{ hasil.beras.toLocaleString('id-ID', { maximumFractionDigits: 2 }) }}
        kg.
      </p>
    </section>
    <nav class="flex flex-wrap gap-4">
      <NuxtLink to="/kalkulator-kafarat" class="btn-link"
        >Kalkulator kafarat</NuxtLink
      ><NuxtLink to="/kalkulator-zakat" class="btn-link"
        >Kalkulator zakat</NuxtLink
      >
    </nav>
  </ToolShell>
</template>
