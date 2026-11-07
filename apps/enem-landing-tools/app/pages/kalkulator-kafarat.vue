<script setup lang="ts">
import {
  CHECKED_AT,
  FIDYAH,
  KAFARAT,
  SUMBER_KAFARAT,
  type JenisKafarat,
} from '~/data/fidyah';
import { formatRupiah } from '~/utils/format';

const SLUG = 'kalkulator-kafarat';
const events = useToolEvents(SLUG);
const form = reactive({
  jenis: 'sumpah' as JenisKafarat,
  perOrang: FIDYAH.uangPerHari,
});
const kafarat = computed(() => KAFARAT.find((k) => k.id === form.jenis)!);
const total = computed(() => kafarat.value.miskin * form.perOrang);
watch(
  () => form.jenis,
  (jenis) => events.calculate(jenis),
);
const faqs = [
  {
    q: 'Berapa kafarat melanggar sumpah?',
    a: 'Memberi makan atau pakaian kepada 10 orang miskin, atau memerdekakan budak; bila tidak mampu, berpuasa 3 hari (QS Al-Maidah 89).',
  },
  {
    q: 'Apakah kafarat boleh dibayar dengan uang?',
    a: 'Ulama berbeda pendapat. Banyak lembaga zakat menyalurkan dalam bentuk makanan atau uang senilai makanan. Tanyakan ke lembaga atau ulama setempat.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator Kafarat"
    seo-title="Kalkulator Kafarat: Sumpah, Zihar, dan Batal Puasa Ramadan"
    description="Jenis kafarat, urutan bentuknya, dan perkiraan nominal memberi makan orang miskin untuk kafarat sumpah, zihar, dan berhubungan di siang Ramadan."
    :faqs="faqs"
    application-category="LifestyleApplication"
    :sources="SUMBER_KAFARAT"
    :checked-at="CHECKED_AT"
    :caveats="[
      'Nilai makanan per orang memakai nilai fidyah per hari sebagai acuan; sesuaikan dengan harga setempat.',
    ]"
  >
    <section class="card grid gap-3 sm:grid-cols-2">
      <div>
        <label for="kaf-jenis" class="field-label">Jenis kafarat</label>
        <select id="kaf-jenis" v-model="form.jenis" class="field-input">
          <option v-for="k in KAFARAT" :key="k.id" :value="k.id">
            {{ k.label }}
          </option>
        </select>
      </div>
      <RupiahInput
        id="kaf-per-orang"
        v-model="form.perOrang"
        label="Nilai makanan per orang miskin"
      />
    </section>
    <ResultNote
      text="Informasi umum, bukan fatwa. Tanyakan ke ulama atau lembaga zakat setempat."
    />
    <section class="card space-y-2" aria-live="polite">
      <p class="text-sm text-slate-600">
        Bila memberi makan {{ kafarat.miskin }} orang miskin
      </p>
      <p class="tabular text-3xl font-bold text-teal-800">
        {{ formatRupiah(total) }}
      </p>
      <p class="text-sm font-medium">Urutan bentuk kafarat:</p>
      <ol class="ml-5 list-decimal text-sm">
        <li v-for="u in kafarat.urutan" :key="u">{{ u }}</li>
      </ol>
      <p class="text-xs text-slate-500">Dalil: {{ kafarat.dalil }}</p>
    </section>
    <NuxtLink to="/kalkulator-fidyah" class="btn-link"
      >Kalkulator fidyah</NuxtLink
    >
  </ToolShell>
</template>
