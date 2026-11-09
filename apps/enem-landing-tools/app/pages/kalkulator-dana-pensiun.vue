<script setup lang="ts">
import { CHECKED_AT, DISCLAIMER_INVESTASI } from '~/data/keuangan';
import { hitungPensiun } from '~/utils/finance';
import { formatRupiah } from '~/utils/format';

const SLUG = 'kalkulator-dana-pensiun';
const events = useToolEvents(SLUG);
const form = reactive({
  usia: 30,
  usiaPensiun: 56,
  lamaPensiun: 20,
  pengeluaran: 0,
  inflasi: 3.5,
  imbalSebelum: 7,
  imbalPensiun: 5,
  danaSekarang: 0,
});
const hasil = ref<ReturnType<typeof hitungPensiun> | null>(null);
onMounted(() => {
  const shared = useSharedState<typeof form>(SLUG);
  if (shared) {
    Object.assign(form, shared);
    hitung();
  }
});
const hitung = () => {
  if (!(form.pengeluaran > 0 && form.usiaPensiun > form.usia)) return;
  hasil.value = hitungPensiun({
    usia: Number(form.usia),
    usiaPensiun: Number(form.usiaPensiun),
    lamaPensiun: Number(form.lamaPensiun),
    pengeluaranBulanan: form.pengeluaran,
    inflasi: Number(form.inflasi) / 100,
    imbalSebelum: Number(form.imbalSebelum) / 100,
    imbalPensiun: Number(form.imbalPensiun) / 100,
    danaSekarang: form.danaSekarang,
  });
  events.calculate();
};
const persen = [
  ['inflasi', 'Inflasi per tahun (%)'],
  ['imbalSebelum', 'Imbal hasil sebelum pensiun (%)'],
  ['imbalPensiun', 'Imbal hasil saat pensiun (%)'],
] as const;
const faqs = [
  {
    q: 'Bagaimana dana pensiun dihitung?',
    a: 'Pengeluaran bulanan hari ini dinaikkan dengan inflasi sampai usia pensiun. Dana yang dibutuhkan adalah nilai sekarang dari pengeluaran itu selama masa pensiun (ikut naik dengan inflasi), dengan dana tetap diinvestasikan. Setoran bulanan dihitung dengan rumus anuitas.',
  },
  {
    q: 'Apakah JHT dan JP BPJS sudah dihitung?',
    a: 'Belum, kecuali Anda memasukkannya sebagai dana yang sudah terkumpul. Manfaat BPJS bisa mengurangi kebutuhan dana pribadi.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator Dana Pensiun"
    seo-title="Kalkulator Dana Pensiun: Dana yang Dibutuhkan dan Setoran Bulanan"
    description="Hitung dana pensiun yang dibutuhkan dengan memperhitungkan inflasi dan lama masa pensiun, serta setoran bulanan untuk mencapainya."
    :faqs="faqs"
    :how-to="[
      'Isi usia sekarang, usia pensiun, dan lama masa pensiun.',
      'Isi pengeluaran bulanan dengan nilai hari ini.',
      'Atur asumsi inflasi dan imbal hasil, lalu Hitung.',
    ]"
    :checked-at="CHECKED_AT"
  >
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent="hitung">
      <div>
        <label for="pen-usia" class="field-label">Usia sekarang</label>
        <input
          id="pen-usia"
          v-model.number="form.usia"
          type="number"
          min="15"
          max="80"
          class="field-input"
        />
      </div>
      <div>
        <label for="pen-usia-pensiun" class="field-label">Usia pensiun</label>
        <input
          id="pen-usia-pensiun"
          v-model.number="form.usiaPensiun"
          type="number"
          min="30"
          max="80"
          class="field-input"
        />
      </div>
      <div>
        <label for="pen-lama" class="field-label"
          >Lama masa pensiun (tahun)</label
        >
        <input
          id="pen-lama"
          v-model.number="form.lamaPensiun"
          type="number"
          min="1"
          max="50"
          class="field-input"
        />
      </div>
      <RupiahInput
        id="pen-pengeluaran"
        v-model="form.pengeluaran"
        label="Pengeluaran bulanan (nilai hari ini)"
      />
      <RupiahInput
        id="pen-dana"
        v-model="form.danaSekarang"
        label="Dana pensiun yang sudah ada"
      />
      <div v-for="[key, label] in persen" :key="key">
        <label :for="`pen-${key}`" class="field-label">{{ label }}</label>
        <input
          :id="`pen-${key}`"
          v-model.number="form[key]"
          type="number"
          min="0"
          max="30"
          step="0.1"
          class="field-input"
        />
      </div>
      <button type="submit" class="btn-primary sm:col-span-2">
        Hitung dana pensiun
      </button>
    </form>
    <template v-if="hasil">
      <ResultNote :text="DISCLAIMER_INVESTASI" />
      <section class="card space-y-2" aria-live="polite">
        <p class="text-sm text-slate-600">Dana dibutuhkan saat pensiun</p>
        <p class="tabular text-3xl font-bold text-primary">
          {{ formatRupiah(hasil.danaDibutuhkan) }}
        </p>
        <p class="tabular text-sm">
          Pengeluaran di usia {{ form.usiaPensiun }}:
          {{ formatRupiah(hasil.pengeluaranSaatPensiun) }} per bulan. Setoran
          yang dibutuhkan:
          <strong>{{ formatRupiah(hasil.setoranBulanan) }}</strong> per bulan
          selama {{ hasil.tahunMenabung }} tahun.
        </p>
        <ShareButton
          :tool-id="SLUG"
          :state="form"
          title="Kebutuhan dana pensiun"
        />
      </section>
    </template>
    <NuxtLink to="/kalkulator-investasi" class="btn-link"
      >Simulasi investasi rutin</NuxtLink
    >
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
