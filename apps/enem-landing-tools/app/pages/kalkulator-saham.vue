<script setup lang="ts">
import {
  CHECKED_AT,
  DISCLAIMER_SAHAM,
  FEE_CONTOH,
  SUMBER_INVESTASI,
} from '~/data/investasi';
import { formatRupiah } from '~/utils/format';
import {
  hargaImpas,
  hargaTarget,
  hitungTransaksi,
  lotDariModal,
} from '~/utils/saham';

const SLUG = 'kalkulator-saham';
const events = useToolEvents(SLUG);
const form = reactive({
  hargaBeli: 0,
  lot: 1,
  hargaJual: 0,
  feeBeli: FEE_CONTOH.beli,
  feeJual: FEE_CONTOH.jual,
  target: 10,
  modal: 0,
});
const hasil = computed(() =>
  form.hargaBeli > 0 && form.lot > 0 && form.hargaJual > 0
    ? hitungTransaksi({
        hargaBeli: form.hargaBeli,
        lot: form.lot,
        hargaJual: form.hargaJual,
        feeBeliPersen: form.feeBeli,
        feeJualPersen: form.feeJual,
      })
    : null,
);
const impas = computed(() =>
  form.hargaBeli > 0
    ? hargaImpas(form.hargaBeli, form.feeBeli, form.feeJual)
    : null,
);
const target = computed(() =>
  form.hargaBeli > 0
    ? hargaTarget(form.hargaBeli, form.target, form.feeBeli, form.feeJual)
    : null,
);
const lotModal = computed(() =>
  form.modal > 0 && form.hargaBeli > 0
    ? lotDariModal(form.modal, form.hargaBeli, form.feeBeli)
    : null,
);
let dicatat = false;
watch(hasil, (v) => {
  if (v && !dicatat) {
    dicatat = true;
    events.calculate();
  }
});
const persen = (n: number) =>
  `${n.toLocaleString('id-ID', { maximumFractionDigits: 2 })}%`;
const faqs = [
  {
    q: '1 lot saham berapa lembar?',
    a: '1 lot = 100 lembar saham di Bursa Efek Indonesia. Harga saham Rp1.000 berarti satu lot bernilai Rp100.000 sebelum fee.',
  },
  {
    q: 'Berapa pajak jual saham?',
    a: 'PPh final 0,1% dari nilai penjualan bruto, dipotong otomatis saat transaksi jual. Membeli saham tidak kena PPh, tetapi ada fee broker.',
  },
  {
    q: 'Kenapa harga impas dibulatkan?',
    a: 'Harga saham hanya bisa bergerak sesuai fraksi harga BEI (Rp1 sampai Rp25 tergantung rentang harga), jadi harga impas dibulatkan ke harga valid berikutnya.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator Saham"
    seo-title="Kalkulator Saham: Lot, Fee Broker, Pajak Jual, Untung Rugi, Harga Impas"
    description="Hitung lembar dan modal per lot, fee beli dan jual, pajak 0,1%, untung atau rugi bersih, harga impas, dan harga jual untuk target persen sesuai fraksi harga BEI."
    :faqs="faqs"
    application-category="FinanceApplication"
    :sources="SUMBER_INVESTASI"
    :checked-at="CHECKED_AT"
    :caveats="['Fee broker berbeda tiap sekuritas; nilai bawaan hanya contoh.']"
  >
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent>
      <RupiahInput
        id="saham-beli"
        v-model="form.hargaBeli"
        label="Harga beli per lembar"
      />
      <div>
        <label for="saham-lot" class="field-label">Jumlah lot</label
        ><input
          id="saham-lot"
          v-model.number="form.lot"
          type="number"
          min="1"
          class="field-input"
        />
      </div>
      <RupiahInput
        id="saham-jual"
        v-model="form.hargaJual"
        label="Harga jual per lembar"
      />
      <div>
        <label for="saham-target" class="field-label"
          >Target untung bersih (%)</label
        ><input
          id="saham-target"
          v-model.number="form.target"
          type="number"
          step="0.1"
          class="field-input"
        />
      </div>
      <div>
        <label for="saham-fee-beli" class="field-label">Fee beli (%)</label
        ><input
          id="saham-fee-beli"
          v-model.number="form.feeBeli"
          type="number"
          min="0"
          step="0.01"
          class="field-input"
        />
      </div>
      <div>
        <label for="saham-fee-jual" class="field-label"
          >Fee jual tanpa pajak (%)</label
        ><input
          id="saham-fee-jual"
          v-model.number="form.feeJual"
          type="number"
          min="0"
          step="0.01"
          class="field-input"
        />
      </div>
      <RupiahInput
        id="saham-modal"
        v-model="form.modal"
        label="Modal tersedia (untuk hitung lot, opsional)"
      />
    </form>
    <ResultNote :text="DISCLAIMER_SAHAM" />
    <section v-if="hasil || impas" class="card space-y-2" aria-live="polite">
      <template v-if="hasil">
        <p class="text-sm text-slate-600">
          Untung/rugi bersih ({{ hasil.lembar.toLocaleString('id-ID') }} lembar)
        </p>
        <p
          class="tabular text-3xl font-bold"
          :class="hasil.laba >= 0 ? 'text-primary' : 'text-rose-800'"
        >
          {{ formatRupiah(hasil.laba) }}
        </p>
        <p class="tabular text-sm">
          {{ persen(hasil.persen) }} · modal
          {{ formatRupiah(hasil.modal) }} (fee
          {{ formatRupiah(hasil.feeBeli) }}) · diterima
          {{ formatRupiah(hasil.diterima) }} (fee
          {{ formatRupiah(hasil.feeJual) }}, PPh 0,1%
          {{ formatRupiah(hasil.pph) }})
        </p>
      </template>
      <p v-if="impas" class="tabular text-sm">
        Harga impas: <strong>{{ formatRupiah(impas) }}</strong> · harga jual
        untuk untung {{ form.target }}%:
        <strong>{{ formatRupiah(target ?? 0) }}</strong>
      </p>
      <p v-if="lotModal !== null" class="tabular text-sm">
        Modal {{ formatRupiah(form.modal) }} cukup untuk {{ lotModal }} lot.
      </p>
    </section>
    <SahamLinks :current="SLUG" />
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
