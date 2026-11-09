<script setup lang="ts">
import { CHECKED_AT, DISCLAIMER_INVESTASI } from '~/data/keuangan';
import { bulananEfektif, fv, pmt } from '~/utils/finance';
import { formatRupiah } from '~/utils/format';

const SLUG = 'kalkulator-tabungan';
const events = useToolEvents(SLUG);
const form = reactive({ target: 0, awal: 0, tahun: 3, bunga: 3 });
const hasil = ref<{ setoran: number; bungaDidapat: number } | null>(null);
onMounted(() => {
  const shared = useSharedState<typeof form>(SLUG);
  if (shared) {
    Object.assign(form, shared);
    hitung();
  }
});
const hitung = () => {
  const n = Math.round(Number(form.tahun) * 12);
  if (!(form.target > 0 && n > 0)) return;
  const r = bulananEfektif(Number(form.bunga) / 100);
  const setoran = pmt(r, n, form.target, form.awal);
  hasil.value = {
    setoran,
    bungaDidapat: fv(r, n, setoran, form.awal) - form.awal - setoran * n,
  };
  events.calculate();
};
const faqs = [
  {
    q: 'Bagaimana setoran bulanan dihitung?',
    a: 'Dengan rumus anuitas (sama seperti fungsi PMT di spreadsheet): target dikurangi nilai masa depan setoran awal, lalu dibagi faktor pertumbuhan setoran bulanan pada bunga yang Anda isi.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator Target Tabungan"
    seo-title="Kalkulator Tabungan: Berapa Harus Menabung per Bulan?"
    description="Hitung setoran bulanan yang dibutuhkan untuk mencapai target tabungan (DP rumah, menikah, liburan) dalam waktu tertentu."
    :faqs="faqs"
    :how-to="[
      'Isi target dana dan setoran awal.',
      'Isi jangka waktu dan perkiraan bunga/imbal hasil per tahun.',
      'Tekan Hitung setoran.',
    ]"
    :checked-at="CHECKED_AT"
  >
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent="hitung">
      <RupiahInput id="tab-target" v-model="form.target" label="Target dana" />
      <RupiahInput id="tab-awal" v-model="form.awal" label="Sudah terkumpul" />
      <div>
        <label for="tab-tahun" class="field-label">Jangka waktu (tahun)</label>
        <input
          id="tab-tahun"
          v-model.number="form.tahun"
          type="number"
          min="0.5"
          max="50"
          step="0.5"
          class="field-input"
        />
      </div>
      <div>
        <label for="tab-bunga" class="field-label"
          >Bunga/imbal hasil per tahun (%)</label
        >
        <input
          id="tab-bunga"
          v-model.number="form.bunga"
          type="number"
          min="0"
          max="30"
          step="0.1"
          class="field-input"
        />
      </div>
      <button type="submit" class="btn-primary sm:col-span-2">
        Hitung setoran
      </button>
    </form>
    <template v-if="hasil">
      <ResultNote :text="DISCLAIMER_INVESTASI" />
      <section class="card space-y-2" aria-live="polite">
        <p class="text-sm text-slate-600">Setoran per bulan</p>
        <p class="tabular text-3xl font-bold text-primary">
          {{ formatRupiah(hasil.setoran) }}
        </p>
        <p class="text-sm">
          Termasuk perkiraan bunga {{ formatRupiah(hasil.bungaDidapat) }} selama
          {{ form.tahun }} tahun.
        </p>
        <ShareButton :tool-id="SLUG" :state="form" title="Target tabungan" />
      </section>
    </template>
    <NuxtLink to="/kalkulator-gaji-bersih" class="btn-link"
      >Cek gaji bersih bulanan</NuxtLink
    >
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
