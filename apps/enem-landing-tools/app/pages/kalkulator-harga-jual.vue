<script setup lang="ts">
import { formatRupiah } from '~/utils/format';
import {
  hargaDariMargin,
  hargaDariMarkup,
  marginDariMarkup,
  markupDariMargin,
} from '~/utils/umkm';

const SLUG = 'kalkulator-harga-jual';
const events = useToolEvents(SLUG);
const form = reactive({
  hpp: 0,
  mode: 'margin' as 'margin' | 'markup',
  persen: 30,
});
const hasil = ref<{
  harga: number;
  laba: number;
  margin: number;
  markup: number;
} | null>(null);
const hitung = () => {
  const p = Number(form.persen);
  if (!(form.hpp > 0) || (form.mode === 'margin' && p >= 100)) return;
  const harga =
    form.mode === 'margin'
      ? hargaDariMargin(form.hpp, p)
      : hargaDariMarkup(form.hpp, p);
  hasil.value = {
    harga,
    laba: harga - form.hpp,
    margin: form.mode === 'margin' ? p : marginDariMarkup(p),
    markup: form.mode === 'markup' ? p : markupDariMargin(p),
  };
  events.calculate(form.mode);
};
const persen = (n: number) =>
  `${n.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`;
const faqs = [
  {
    q: 'Apa beda margin dan markup?',
    a: 'Markup dihitung dari HPP (laba / HPP), margin dihitung dari harga jual (laba / harga jual). HPP Rp8.000 dijual Rp10.000: markup 25%, margin 20%.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator Harga Jual"
    seo-title="Kalkulator Harga Jual dari HPP: Margin dan Markup"
    description="Tentukan harga jual dari HPP dengan target margin atau markup, lengkap dengan laba per unit dan konversi margin ke markup."
    :faqs="faqs"
    application-category="BusinessApplication"
    checked-at="2026-11-06"
  >
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent="hitung">
      <RupiahInput id="hj-hpp" v-model="form.hpp" label="HPP per unit" />
      <div>
        <label for="hj-mode" class="field-label">Target berdasarkan</label>
        <select id="hj-mode" v-model="form.mode" class="field-input">
          <option value="margin">Margin (dari harga jual)</option>
          <option value="markup">Markup (dari HPP)</option>
        </select>
      </div>
      <div>
        <label for="hj-persen" class="field-label">Persentase (%)</label>
        <input
          id="hj-persen"
          v-model.number="form.persen"
          type="number"
          min="0"
          step="0.1"
          class="field-input"
        />
      </div>
      <button type="submit" class="btn-primary sm:col-span-2">
        Hitung harga jual
      </button>
    </form>
    <section v-if="hasil" class="card space-y-2" aria-live="polite">
      <p class="text-sm text-slate-600">Harga jual</p>
      <p class="tabular text-3xl font-bold text-primary">
        {{ formatRupiah(hasil.harga) }}
      </p>
      <p class="tabular text-sm">
        Laba {{ formatRupiah(hasil.laba) }} per unit · margin
        {{ persen(hasil.margin) }} · markup {{ persen(hasil.markup) }}
      </p>
    </section>
    <UmkmLinks :current="SLUG" />
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
