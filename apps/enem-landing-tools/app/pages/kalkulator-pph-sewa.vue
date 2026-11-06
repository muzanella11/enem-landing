<script setup lang="ts">
import {
  CHECKED_AT,
  PPH_SEWA_TANAH_BANGUNAN,
  SUMBER_PAJAK_USAHA,
} from '~/data/tax/usaha';
import { formatRupiah } from '~/utils/format';
import { hitungPphSewa, sewaBrutoDariNeto } from '~/utils/pajak-usaha';

const SLUG = 'kalkulator-pph-sewa';
const events = useToolEvents(SLUG);
const form = reactive({ nilai: 0, mode: 'bruto' as 'bruto' | 'neto' });
const bruto = computed(() =>
  form.mode === 'bruto' ? form.nilai : sewaBrutoDariNeto(form.nilai),
);
const hasil = computed(() =>
  form.nilai > 0 ? hitungPphSewa(bruto.value) : null,
);
let dicatat = false;
watch(hasil, (v) => {
  if (v && !dicatat) {
    dicatat = true;
    events.calculate(form.mode);
  }
});
const faqs = [
  {
    q: 'Berapa pajak sewa rumah, ruko, atau kantor?',
    a: `PPh final Pasal 4 ayat (2) sebesar ${PPH_SEWA_TANAH_BANGUNAN}% dari jumlah bruto nilai sewa (PP 34/2017). Bila penyewa badan, penyewa yang memotong; bila tidak, pemilik menyetor sendiri.`,
  },
  {
    q: 'Kalau harga sewa yang disepakati sudah bersih?',
    a: `Pilih mode "nilai bersih". Nilai bruto = nilai bersih / (1 - ${PPH_SEWA_TANAH_BANGUNAN}%), lalu pajaknya ${PPH_SEWA_TANAH_BANGUNAN}% dari bruto.`,
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator Pajak Sewa"
    seo-title="Kalkulator Pajak Sewa Rumah, Ruko, Kantor (PPh Final 10%)"
    description="Hitung PPh final 10% atas sewa tanah dan/atau bangunan, dari nilai sewa bruto atau dari nilai bersih yang disepakati (gross-up)."
    :faqs="faqs"
    application-category="FinanceApplication"
    :sources="SUMBER_PAJAK_USAHA.slice(3)"
    :checked-at="CHECKED_AT"
  >
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent>
      <RupiahInput id="sewa-nilai" v-model="form.nilai" label="Nilai sewa" />
      <fieldset>
        <legend class="field-label">Nilai tersebut</legend>
        <label class="mr-4 text-sm"
          ><input v-model="form.mode" type="radio" value="bruto" /> Bruto
          (sebelum pajak)</label
        >
        <label class="text-sm"
          ><input v-model="form.mode" type="radio" value="neto" /> Bersih
          (setelah pajak)</label
        >
      </fieldset>
    </form>
    <section v-if="hasil" class="card space-y-2" aria-live="polite">
      <p class="text-sm text-slate-600">PPh final sewa ({{ hasil.tarif }}%)</p>
      <p class="tabular text-3xl font-bold text-teal-800">
        {{ formatRupiah(hasil.pph) }}
      </p>
      <p class="tabular text-sm">
        Nilai sewa bruto {{ formatRupiah(bruto) }} · diterima pemilik
        {{ formatRupiah(hasil.diterima) }}
      </p>
    </section>
    <PajakLinks :current="SLUG" />
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
