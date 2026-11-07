<script setup lang="ts">
import { CHECKED_AT, DISCLAIMER_SAHAM } from '~/data/investasi';
import { pertumbuhanInvestasi } from '~/utils/finance';
import { formatRupiah } from '~/utils/format';
import { nilaiJualReksaDana, unitReksaDana } from '~/utils/saham';

const SLUG = 'simulasi-reksa-dana';
const events = useToolEvents(SLUG);
const form = reactive({
  nominal: 0,
  nab: 0,
  biayaBeli: 0,
  nabJual: 0,
  biayaJual: 0,
  bulanan: 0,
  tahun: 5,
  imbal: 5,
});
const beli = computed(() =>
  form.nominal > 0 && form.nab > 0
    ? unitReksaDana(form.nominal, form.nab, form.biayaBeli)
    : null,
);
const jual = computed(() =>
  beli.value && form.nabJual > 0
    ? nilaiJualReksaDana(beli.value.unit, form.nabJual, form.biayaJual)
    : null,
);
const rutin = computed(() =>
  form.bulanan > 0 || form.nominal > 0
    ? pertumbuhanInvestasi(
        form.nominal,
        form.bulanan,
        form.imbal / 100,
        Math.max(1, form.tahun),
      )
    : [],
);
let dicatat = false;
watch(beli, (v) => {
  if (v && !dicatat) {
    dicatat = true;
    events.calculate();
  }
});
const angka = (n: number) =>
  n.toLocaleString('id-ID', { maximumFractionDigits: 4 });
const faqs = [
  {
    q: 'Apa itu NAB per unit?',
    a: 'Nilai Aktiva Bersih per unit adalah harga satu unit reksa dana pada hari itu. Uang yang Anda investasikan (setelah biaya pembelian) dibagi NAB menjadi jumlah unit.',
  },
  {
    q: 'Apakah keuntungan reksa dana kena pajak?',
    a: 'Keuntungan dari penjualan kembali unit reksa dana bukan objek pajak bagi investor; pajak sudah diurus di tingkat portofolio reksa dana.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Simulasi Reksa Dana"
    seo-title="Simulasi Reksa Dana: Unit, NAB, Biaya, dan Investasi Rutin"
    description="Hitung unit reksa dana yang didapat dari NAB dan biaya pembelian, nilai saat dijual, serta simulasi investasi rutin bulanan dengan imbal hasil yang Anda tentukan."
    :faqs="faqs"
    application-category="FinanceApplication"
    :checked-at="CHECKED_AT"
    :caveats="[
      'Imbal hasil adalah asumsi Anda; kinerja masa lalu tidak menjamin hasil masa depan.',
    ]"
  >
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent>
      <RupiahInput
        id="rd-nominal"
        v-model="form.nominal"
        label="Investasi awal"
      />
      <RupiahInput
        id="rd-nab"
        v-model="form.nab"
        label="NAB per unit saat beli"
        allow-decimal
      />
      <div>
        <label for="rd-biaya-beli" class="field-label"
          >Biaya pembelian (%)</label
        ><input
          id="rd-biaya-beli"
          v-model.number="form.biayaBeli"
          type="number"
          min="0"
          step="0.01"
          class="field-input"
        />
      </div>
      <RupiahInput
        id="rd-nab-jual"
        v-model="form.nabJual"
        label="NAB per unit saat jual (opsional)"
        allow-decimal
      />
      <div>
        <label for="rd-biaya-jual" class="field-label"
          >Biaya penjualan (%)</label
        ><input
          id="rd-biaya-jual"
          v-model.number="form.biayaJual"
          type="number"
          min="0"
          step="0.01"
          class="field-input"
        />
      </div>
      <RupiahInput
        id="rd-bulanan"
        v-model="form.bulanan"
        label="Investasi rutin per bulan (opsional)"
      />
      <div>
        <label for="rd-tahun" class="field-label">Lama (tahun)</label
        ><input
          id="rd-tahun"
          v-model.number="form.tahun"
          type="number"
          min="1"
          max="50"
          class="field-input"
        />
      </div>
      <div>
        <label for="rd-imbal" class="field-label"
          >Asumsi imbal hasil per tahun (%)</label
        ><input
          id="rd-imbal"
          v-model.number="form.imbal"
          type="number"
          step="0.1"
          class="field-input"
        />
      </div>
    </form>
    <ResultNote :text="DISCLAIMER_SAHAM" />
    <section
      v-if="beli || rutin.length"
      class="card space-y-2"
      aria-live="polite"
    >
      <template v-if="beli">
        <p class="text-sm text-slate-600">Unit yang didapat</p>
        <p class="tabular text-3xl font-bold text-teal-800">
          {{ angka(beli.unit) }} unit
        </p>
        <p class="tabular text-sm">
          Biaya pembelian {{ formatRupiah(beli.biaya)
          }}<template v-if="jual">
            · nilai jual bersih {{ formatRupiah(jual.bersih) }} (untung
            {{ formatRupiah(jual.bersih - form.nominal) }})</template
          >
        </p>
      </template>
      <template v-if="rutin.length > 1">
        <p class="tabular text-sm">
          Simulasi {{ form.tahun }} tahun: nilai
          {{ formatRupiah(rutin[rutin.length - 1]!.nilai) }} dari total setoran
          {{ formatRupiah(rutin[rutin.length - 1]!.modal) }}
        </p>
        <GrowthChart :points="rutin" />
      </template>
    </section>
    <SahamLinks :current="SLUG" />
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
