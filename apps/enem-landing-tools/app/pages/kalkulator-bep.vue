<script setup lang="ts">
import { formatRupiah } from '~/utils/format';
import { hitungBep } from '~/utils/umkm';

const SLUG = 'kalkulator-bep';
const events = useToolEvents(SLUG);
const form = reactive({ biayaTetap: 0, harga: 0, biayaVariabel: 0 });
const hasil = ref<ReturnType<typeof hitungBep> | undefined>(undefined);
const hitung = () => {
  if (!(form.harga > 0)) return;
  hasil.value = hitungBep(form.biayaTetap, form.harga, form.biayaVariabel);
  events.calculate();
};
const faqs = [
  {
    q: 'Bagaimana rumus BEP?',
    a: 'BEP unit = biaya tetap / (harga jual - biaya variabel per unit). BEP rupiah = BEP unit x harga jual.',
  },
  {
    q: 'Apa contoh biaya tetap?',
    a: 'Sewa tempat, gaji tetap karyawan, cicilan alat, internet. Biaya variabel ikut jumlah produksi, mis. bahan baku dan kemasan.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator BEP (Titik Impas)"
    seo-title="Kalkulator BEP: Titik Impas Unit dan Rupiah untuk Usaha"
    description="Hitung titik impas (break even point) usaha dalam jumlah unit dan rupiah dari biaya tetap, harga jual, dan biaya variabel per unit."
    :faqs="faqs"
    application-category="BusinessApplication"
    checked-at="2026-11-06"
  >
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent="hitung">
      <RupiahInput
        id="bep-tetap"
        v-model="form.biayaTetap"
        label="Biaya tetap per bulan"
      />
      <RupiahInput
        id="bep-harga"
        v-model="form.harga"
        label="Harga jual per unit"
      />
      <RupiahInput
        id="bep-variabel"
        v-model="form.biayaVariabel"
        label="Biaya variabel per unit"
      />
      <button type="submit" class="btn-primary sm:col-span-2">
        Hitung BEP
      </button>
    </form>
    <section
      v-if="hasil !== undefined"
      class="card space-y-2"
      aria-live="polite"
    >
      <template v-if="hasil">
        <p class="text-sm text-slate-600">Titik impas per bulan</p>
        <p class="tabular text-3xl font-bold text-primary">
          {{ hasil.unit.toLocaleString('id-ID') }} unit
        </p>
        <p class="tabular text-sm">
          Setara penjualan {{ formatRupiah(hasil.rupiah) }}; tiap unit
          menyumbang {{ formatRupiah(hasil.kontribusiPerUnit) }}.
        </p>
      </template>
      <p v-else class="text-3xl font-bold text-rose-800">
        Harga jual di bawah biaya variabel
      </p>
    </section>
    <UmkmLinks :current="SLUG" />
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
