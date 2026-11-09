<script setup lang="ts">
import { CHECKED_AT } from '~/data/gadai';
import { formatRupiah } from '~/utils/format';
import { cicilEmas } from '~/utils/gadai';

const SLUG = 'simulasi-cicil-emas';
const events = useToolEvents(SLUG);
const { data: harga } = useHargaEmas();
const form = reactive({
  gram: 10,
  hargaPerGram: 0,
  dpPersen: 15,
  tenor: 12,
  margin: 0,
  admin: 0,
});
watch(
  () => harga.value?.pricePerGram,
  (p) => {
    if (p && !form.hargaPerGram) form.hargaPerGram = p;
  },
  { immediate: true },
);
const hasil = computed(() =>
  form.gram > 0 && form.hargaPerGram > 0 && form.tenor > 0
    ? cicilEmas({
        gram: form.gram,
        hargaPerGram: form.hargaPerGram,
        dpPersen: form.dpPersen,
        tenorBulan: form.tenor,
        marginPersenPerBulan: form.margin,
        admin: form.admin,
      })
    : null,
);
let dicatat = false;
watch(hasil, (v) => {
  if (v && !dicatat) {
    dicatat = true;
    events.calculate();
  }
});
const faqs = [
  {
    q: 'Bagaimana cicilan emas dihitung?',
    a: 'Harga emas dikurangi uang muka, lalu sisanya dicicil tiap bulan ditambah margin dari penyelenggara. Isi margin dan biaya admin sesuai penawaran Pegadaian atau bank syariah yang Anda pilih.',
  },
  {
    q: 'Lebih untung cicil atau beli tunai?',
    a: 'Beli tunai selalu lebih murah karena tanpa margin. Kalkulator menampilkan selisih total cicilan dibanding harga tunai supaya mudah dibandingkan.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Simulasi Cicil Emas"
    seo-title="Simulasi Cicil Emas: Uang Muka, Angsuran per Bulan, dan Total Bayar"
    description="Hitung cicilan emas batangan per bulan dari berat, harga per gram, uang muka, tenor, dan margin penyelenggara, serta selisihnya dibanding beli tunai."
    :faqs="faqs"
    application-category="FinanceApplication"
    :checked-at="CHECKED_AT"
    :caveats="[
      'Margin dan biaya admin berbeda per penyelenggara dan produk; isi dari penawaran resmi. Harga per gram terisi harga spot sebagai perkiraan.',
    ]"
  >
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent>
      <div>
        <label for="cicil-gram" class="field-label">Berat emas (gram)</label
        ><input
          id="cicil-gram"
          v-model.number="form.gram"
          type="number"
          min="0"
          step="any"
          class="field-input"
        />
      </div>
      <RupiahInput
        id="cicil-harga"
        v-model="form.hargaPerGram"
        label="Harga per gram"
      />
      <div>
        <label for="cicil-dp" class="field-label">Uang muka (%)</label
        ><input
          id="cicil-dp"
          v-model.number="form.dpPersen"
          type="number"
          min="0"
          max="100"
          class="field-input"
        />
      </div>
      <div>
        <label for="cicil-tenor" class="field-label">Tenor (bulan)</label
        ><select
          id="cicil-tenor"
          v-model.number="form.tenor"
          class="field-input"
        >
          <option v-for="t in [3, 6, 12, 18, 24, 36]" :key="t" :value="t">
            {{ t }} bulan
          </option>
        </select>
      </div>
      <div>
        <label for="cicil-margin" class="field-label"
          >Margin per bulan (%)</label
        ><input
          id="cicil-margin"
          v-model.number="form.margin"
          type="number"
          min="0"
          max="5"
          step="0.01"
          class="field-input"
        />
      </div>
      <RupiahInput
        id="cicil-admin"
        v-model="form.admin"
        label="Biaya administrasi"
      />
    </form>
    <section v-if="hasil" class="card space-y-2" aria-live="polite">
      <p class="text-sm text-slate-600">Cicilan per bulan</p>
      <p class="tabular text-3xl font-bold text-primary">
        {{ formatRupiah(hasil.angsuran) }}
      </p>
      <p class="tabular text-sm">
        Harga tunai {{ formatRupiah(hasil.harga) }} · uang muka
        {{ formatRupiah(hasil.dp) }} · total semua
        {{ formatRupiah(hasil.totalSemua) }} (lebih mahal
        {{ formatRupiah(hasil.selisihDariTunai) }} dari tunai)
      </p>
    </section>
    <nav class="flex flex-wrap gap-4">
      <NuxtLink to="/harga-emas" class="btn-link">Harga emas</NuxtLink
      ><NuxtLink to="/simulasi-gadai-emas" class="btn-link"
        >Simulasi gadai emas</NuxtLink
      >
    </nav>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
