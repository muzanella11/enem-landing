<script setup lang="ts">
import { KATEGORI, type Kategori } from '~/data/satuan';
import {
  bulatkan,
  konversi,
  konversiSuhu,
  type SatuanSuhu,
} from '~/utils/satuan';

const SLUG = 'konversi-satuan';
const events = useToolEvents(SLUG);
const SUHU: { id: SatuanSuhu; label: string }[] = [
  { id: 'C', label: 'Celsius (°C)' },
  { id: 'F', label: 'Fahrenheit (°F)' },
  { id: 'K', label: 'Kelvin (K)' },
  { id: 'R', label: 'Reamur (°R)' },
];
type Tab = Kategori['id'] | 'suhu';
const tabs: { id: Tab; label: string }[] = [
  ...KATEGORI.map((k) => ({ id: k.id, label: k.label })),
  { id: 'suhu', label: 'Suhu' },
];
const tab = ref<Tab>('panjang');
const nilai = ref<number | null>(1);
const dari = ref('m');
const satuanTab = computed(() =>
  tab.value === 'suhu'
    ? SUHU
    : KATEGORI.find((k) => k.id === tab.value)!.satuan,
);
watch(tab, () => {
  dari.value = satuanTab.value[0]!.id;
});
const hasil = computed(() => {
  if (nilai.value === null) return [];
  const v = Number(nilai.value);
  return satuanTab.value
    .filter((s) => s.id !== dari.value)
    .map((s) => ({
      id: s.id,
      label: s.label,
      nilai:
        tab.value === 'suhu'
          ? konversiSuhu(v, dari.value as SatuanSuhu, s.id as SatuanSuhu)
          : (konversi(v, dari.value, s.id, tab.value as Kategori['id']) ?? NaN),
    }));
});
let dicatat = false;
watch([nilai, dari], () => {
  if (dicatat) return;
  dicatat = true;
  events.calculate(tab.value);
});
const faqs = [
  {
    q: '1 ons berapa gram?',
    a: 'Di Indonesia 1 ons = 100 gram. Ounce (oz) internasional berbeda, sekitar 28,35 gram.',
  },
  { q: '1 kuintal berapa kg?', a: '1 kuintal = 100 kg, dan 1 ton = 1.000 kg.' },
  {
    q: 'Bagaimana rumus Celsius ke Fahrenheit?',
    a: '°F = °C x 9/5 + 32. Contoh: 30 °C = 86 °F.',
  },
];
const howTo = [
  'Pilih jenis satuan: panjang, berat, volume, luas, kecepatan, atau suhu.',
  'Isi angka dan pilih satuan asal.',
  'Hasil dalam semua satuan lain langsung muncul.',
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Konversi Satuan"
    seo-title="Konversi Satuan Panjang, Berat, Volume, Suhu, Kecepatan"
    description="Ubah satuan panjang, berat (ons, kuintal, ton), volume, luas, kecepatan, dan suhu (Celsius, Fahrenheit, Kelvin, Reamur) secara instan."
    application-category="UtilitiesApplication"
    :faqs="faqs"
    :how-to="howTo"
    :sources="[
      {
        label: 'BIPM: Sistem Satuan Internasional (SI)',
        url: 'https://www.bipm.org/en/measurement-units',
      },
    ]"
    checked-at="2026-11-06"
  >
    <section class="card space-y-3">
      <div class="flex flex-wrap gap-2" role="group" aria-label="Jenis satuan">
        <button
          v-for="t in tabs"
          :key="t.id"
          type="button"
          class="btn-secondary"
          :aria-pressed="tab === t.id"
          @click="tab = t.id"
        >
          {{ t.label }}
        </button>
      </div>
      <label for="satuan-nilai" class="field-label">Nilai</label>
      <input
        id="satuan-nilai"
        v-model.number="nilai"
        type="number"
        step="any"
        inputmode="decimal"
        class="field-input"
      />
      <label for="satuan-dari" class="field-label">Dari satuan</label>
      <select id="satuan-dari" v-model="dari" class="field-input">
        <option v-for="s in satuanTab" :key="s.id" :value="s.id">
          {{ s.label }}
        </option>
      </select>
    </section>
    <section v-if="hasil.length" class="card" aria-live="polite">
      <table class="tabular w-full text-sm">
        <tbody>
          <tr
            v-for="row in hasil"
            :key="row.id"
            class="border-t border-slate-100"
          >
            <td class="py-2">{{ row.label }}</td>
            <td class="py-2 text-right font-semibold">
              {{ bulatkan(row.nilai) }}
            </td>
          </tr>
        </tbody>
      </table>
    </section>
    <NuxtLink to="/konversi-luas-tanah" class="btn-link"
      >Konversi luas tanah (tumbak, bata, ubin)</NuxtLink
    >
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
