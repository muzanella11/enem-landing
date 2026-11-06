<script setup lang="ts">
import { formatRupiah } from '~/utils/format';
import { biayaBangun } from '~/utils/properti';

const SLUG = 'biaya-bangun-rumah';
const events = useToolEvents(SLUG);
const form = reactive({
  lantai: [36] as number[],
  biayaPerM2: 0,
  takTerduga: 10,
});
const hasil = ref<ReturnType<typeof biayaBangun> | null>(null);
const hitung = () => {
  if (!(form.biayaPerM2 > 0)) return;
  hasil.value = biayaBangun(
    form.lantai.map(Number),
    form.biayaPerM2,
    Number(form.takTerduga),
  );
  events.calculate(String(form.lantai.length));
};
const faqs = [
  {
    q: 'Berapa biaya bangun rumah per meter persegi?',
    a: 'Sangat bergantung pada daerah, spesifikasi material, dan kondisi lahan. Minta penawaran dari kontraktor atau lihat Harga Satuan Pokok Kegiatan (HSPK) daerah Anda, lalu masukkan angkanya di sini.',
  },
  {
    q: 'Kenapa perlu dana tak terduga?',
    a: 'Harga material bisa naik dan pekerjaan tambahan sering muncul. Cadangan 10% sampai 20% umum dipakai dalam perencanaan.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator Biaya Bangun Rumah"
    seo-title="Kalkulator Biaya Bangun Rumah per Meter Persegi"
    description="Estimasi biaya bangun rumah dari luas tiap lantai, biaya per m² dari kontraktor atau HSPK daerah, dan cadangan dana tak terduga."
    :faqs="faqs"
    application-category="BusinessApplication"
    checked-at="2026-11-06"
    :caveats="[
      'Biaya per m² adalah input Anda; tool tidak menyimpan harga pasaran karena sangat bervariasi per daerah dan spesifikasi.',
    ]"
  >
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent="hitung">
      <div v-for="(_, i) in form.lantai" :key="i">
        <label :for="`bangun-lantai-${i}`" class="field-label"
          >Luas lantai {{ i + 1 }} (m²)</label
        >
        <input
          :id="`bangun-lantai-${i}`"
          v-model.number="form.lantai[i]"
          type="number"
          min="0"
          class="field-input"
        />
      </div>
      <div class="flex items-end gap-2">
        <button
          type="button"
          class="btn-secondary"
          @click="form.lantai.push(0)"
        >
          + Lantai
        </button>
        <button
          v-if="form.lantai.length > 1"
          type="button"
          class="text-sm text-rose-700"
          @click="form.lantai.pop()"
        >
          Hapus lantai
        </button>
      </div>
      <RupiahInput
        id="bangun-per-m2"
        v-model="form.biayaPerM2"
        label="Biaya per m²"
      />
      <div>
        <label for="bangun-cadangan" class="field-label"
          >Dana tak terduga (%)</label
        >
        <input
          id="bangun-cadangan"
          v-model.number="form.takTerduga"
          type="number"
          min="0"
          max="50"
          class="field-input"
        />
      </div>
      <button type="submit" class="btn-primary sm:col-span-2">
        Hitung biaya
      </button>
    </form>
    <section v-if="hasil" class="card space-y-2" aria-live="polite">
      <p class="text-sm text-slate-600">
        Perkiraan total ({{ hasil.luas }} m²)
      </p>
      <p class="tabular text-3xl font-bold text-teal-800">
        {{ formatRupiah(hasil.total) }}
      </p>
      <p class="tabular text-sm">
        Biaya dasar {{ formatRupiah(hasil.dasar) }} + cadangan
        {{ formatRupiah(hasil.cadangan) }}
      </p>
    </section>
    <nav class="flex flex-wrap gap-4">
      <NuxtLink to="/simulasi-kpr" class="btn-link">Simulasi KPR</NuxtLink
      ><NuxtLink to="/konversi-luas-tanah" class="btn-link"
        >Konversi luas tanah</NuxtLink
      >
    </nav>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
