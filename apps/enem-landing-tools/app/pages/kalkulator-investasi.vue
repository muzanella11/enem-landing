<script setup lang="ts">
import { CHECKED_AT, DISCLAIMER_INVESTASI } from '~/data/keuangan';
import { nilaiRiil, pertumbuhanInvestasi } from '~/utils/finance';
import { formatRupiah } from '~/utils/format';

const SLUG = 'kalkulator-investasi';
const events = useToolEvents(SLUG);
const form = reactive({ awal: 0, bulanan: 0, tahun: 10, imbal: 6, inflasi: 3 });
const points = ref<ReturnType<typeof pertumbuhanInvestasi>>([]);
onMounted(() => {
  const shared = useSharedState<typeof form>(SLUG);
  if (shared) {
    Object.assign(form, shared);
    hitung();
  }
});
const hitung = () => {
  const tahun = Math.min(50, Math.max(1, Math.round(Number(form.tahun))));
  if (!(form.awal > 0 || form.bulanan > 0)) return;
  points.value = pertumbuhanInvestasi(
    form.awal,
    form.bulanan,
    Number(form.imbal) / 100,
    tahun,
  );
  events.calculate();
};
const akhir = computed(() => points.value[points.value.length - 1]);
const faqs = [
  {
    q: 'Berapa imbal hasil yang realistis?',
    a: 'Tergantung instrumen dan risikonya. Isi beberapa skenario (mis. konservatif, moderat, agresif) untuk melihat rentangnya. Kalkulator ini tidak merekomendasikan produk apa pun.',
  },
  {
    q: 'Apa itu nilai riil?',
    a: 'Nilai akhir yang disesuaikan dengan inflasi, yaitu daya belinya dalam uang hari ini.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator Investasi Rutin"
    seo-title="Kalkulator Investasi Bulanan (DCA) dan Bunga Majemuk"
    description="Simulasi investasi rutin bulanan dengan bunga majemuk: nilai akhir, total setoran, keuntungan, dan nilai riil setelah inflasi, lengkap dengan grafik."
    :faqs="faqs"
    :how-to="[
      'Isi modal awal dan setoran bulanan.',
      'Isi lama investasi, perkiraan imbal hasil, dan inflasi.',
      'Tekan Simulasikan.',
    ]"
    :checked-at="CHECKED_AT"
  >
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent="hitung">
      <RupiahInput id="inv-awal" v-model="form.awal" label="Modal awal" />
      <RupiahInput
        id="inv-bulanan"
        v-model="form.bulanan"
        label="Setoran per bulan"
      />
      <div>
        <label for="inv-tahun" class="field-label"
          >Lama investasi (tahun)</label
        >
        <input
          id="inv-tahun"
          v-model.number="form.tahun"
          type="number"
          min="1"
          max="50"
          class="field-input"
        />
      </div>
      <div>
        <label for="inv-imbal" class="field-label"
          >Imbal hasil per tahun (%)</label
        >
        <input
          id="inv-imbal"
          v-model.number="form.imbal"
          type="number"
          min="0"
          max="30"
          step="0.1"
          class="field-input"
        />
      </div>
      <div>
        <label for="inv-inflasi" class="field-label"
          >Inflasi per tahun (%)</label
        >
        <input
          id="inv-inflasi"
          v-model.number="form.inflasi"
          type="number"
          min="0"
          max="20"
          step="0.1"
          class="field-input"
        />
      </div>
      <button type="submit" class="btn-primary sm:col-span-2">
        Simulasikan
      </button>
    </form>
    <template v-if="akhir">
      <ResultNote :text="DISCLAIMER_INVESTASI" />
      <section class="card space-y-2" aria-live="polite">
        <p class="text-sm text-slate-600">
          Nilai setelah {{ akhir.tahun }} tahun
        </p>
        <p class="tabular text-3xl font-bold text-teal-800">
          {{ formatRupiah(akhir.nilai) }}
        </p>
        <p class="tabular text-sm">
          Total setoran {{ formatRupiah(akhir.modal) }}, hasil
          {{ formatRupiah(akhir.nilai - akhir.modal) }}. Nilai riil (uang hari
          ini):
          {{
            formatRupiah(
              nilaiRiil(akhir.nilai, Number(form.inflasi) / 100, akhir.tahun),
            )
          }}.
        </p>
        <GrowthChart :points="points" />
        <ShareButton
          :tool-id="SLUG"
          :state="form"
          title="Simulasi investasi rutin"
        />
      </section>
    </template>
    <NuxtLink to="/kalkulator-dana-pensiun" class="btn-link"
      >Hitung kebutuhan dana pensiun</NuxtLink
    >
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
