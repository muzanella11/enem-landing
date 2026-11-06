<script setup lang="ts">
import { formatRupiah } from '~/utils/format';
import { hppPerUnit } from '~/utils/umkm';

const SLUG = 'kalkulator-hpp';
const events = useToolEvents(SLUG);
const form = reactive({ bahan: 0, tenagaKerja: 0, overhead: 0, jumlah: 100 });
const hpp = ref<number | null>(null);
const hitung = () => {
  if (!(Number(form.jumlah) > 0)) return;
  hpp.value = hppPerUnit(form, Number(form.jumlah));
  events.calculate();
};
const faqs = [
  {
    q: 'Apa itu HPP?',
    a: 'Harga Pokok Produksi: total biaya untuk membuat satu produk, yaitu bahan baku, tenaga kerja langsung, dan overhead (listrik, gas, kemasan, penyusutan alat) dibagi jumlah produk yang dihasilkan.',
  },
  {
    q: 'Apakah biaya sewa tempat dimasukkan?',
    a: 'Bisa dimasukkan ke overhead secara proporsional per batch, atau dihitung terpisah sebagai biaya tetap di kalkulator BEP.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator HPP"
    seo-title="Kalkulator HPP (Harga Pokok Produksi) per Unit untuk UMKM"
    description="Hitung HPP per unit dari biaya bahan baku, tenaga kerja, dan overhead per batch produksi, lalu lanjutkan ke harga jual."
    :faqs="faqs"
    application-category="BusinessApplication"
    checked-at="2026-11-06"
  >
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent="hitung">
      <RupiahInput
        id="hpp-bahan"
        v-model="form.bahan"
        label="Bahan baku per batch"
      />
      <RupiahInput
        id="hpp-tk"
        v-model="form.tenagaKerja"
        label="Tenaga kerja per batch"
      />
      <RupiahInput
        id="hpp-overhead"
        v-model="form.overhead"
        label="Overhead per batch"
      />
      <div>
        <label for="hpp-jumlah" class="field-label"
          >Jumlah produk per batch</label
        >
        <input
          id="hpp-jumlah"
          v-model.number="form.jumlah"
          type="number"
          min="1"
          class="field-input"
        />
      </div>
      <button type="submit" class="btn-primary sm:col-span-2">
        Hitung HPP
      </button>
    </form>
    <section v-if="hpp !== null" class="card space-y-2" aria-live="polite">
      <p class="text-sm text-slate-600">HPP per unit</p>
      <p class="tabular text-3xl font-bold text-teal-800">
        {{ formatRupiah(hpp) }}
      </p>
      <NuxtLink to="/kalkulator-harga-jual" class="btn-link"
        >Tentukan harga jual dari HPP ini</NuxtLink
      >
    </section>
    <UmkmLinks :current="SLUG" />
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
