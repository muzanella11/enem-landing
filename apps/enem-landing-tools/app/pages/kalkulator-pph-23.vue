<script setup lang="ts">
import {
  CHECKED_AT,
  PPH_23,
  SUMBER_PAJAK_USAHA,
  type JenisPph23,
} from '~/data/tax/usaha';
import { formatRupiah } from '~/utils/format';
import { hitungPph23 } from '~/utils/pajak-usaha';

const SLUG = 'kalkulator-pph-23';
const events = useToolEvents(SLUG);
const form = reactive({ bruto: 0, jenis: 'jasa' as JenisPph23, npwp: true });
const hasil = computed(() =>
  form.bruto > 0 ? hitungPph23(form.bruto, form.jenis, form.npwp) : null,
);
let dicatat = false;
watch(hasil, (v) => {
  if (v && !dicatat) {
    dicatat = true;
    events.calculate(form.jenis);
  }
});
const faqs = [
  {
    q: 'Berapa tarif PPh 23?',
    a: '2% dari jumlah bruto untuk jasa dan sewa harta selain tanah/bangunan; 15% untuk dividen, bunga, royalti, dan hadiah. Bila penerima tidak punya NPWP, tarifnya 100% lebih tinggi.',
  },
  {
    q: 'Siapa yang memotong PPh 23?',
    a: 'Pihak pembayar yang merupakan badan atau orang pribadi tertentu yang ditunjuk, lalu menerbitkan bukti potong untuk penerima.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator PPh 23"
    seo-title="Kalkulator PPh 23: Jasa 2%, Royalti 15%, Tanpa NPWP"
    description="Hitung potongan PPh Pasal 23 atas jasa, sewa harta, royalti, bunga, dan hadiah, termasuk tarif lebih tinggi bila penerima tidak memiliki NPWP."
    :faqs="faqs"
    application-category="FinanceApplication"
    :sources="SUMBER_PAJAK_USAHA.slice(2, 3)"
    :checked-at="CHECKED_AT"
    :caveats="[
      'Bukan konsultasi pajak. Beberapa penghasilan dikecualikan atau dikenai PPh final lain.',
    ]"
  >
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent>
      <RupiahInput id="pph23-bruto" v-model="form.bruto" label="Jumlah bruto" />
      <div>
        <label for="pph23-jenis" class="field-label">Jenis penghasilan</label>
        <select id="pph23-jenis" v-model="form.jenis" class="field-input">
          <option v-for="j in PPH_23" :key="j.id" :value="j.id">
            {{ j.label }} ({{ j.tarif }}%)
          </option>
        </select>
      </div>
      <label class="flex items-center gap-2 text-sm"
        ><input v-model="form.npwp" type="checkbox" /> Penerima punya
        NPWP</label
      >
    </form>
    <section v-if="hasil" class="card space-y-2" aria-live="polite">
      <p class="text-sm text-slate-600">PPh 23 dipotong ({{ hasil.tarif }}%)</p>
      <p class="tabular text-3xl font-bold text-teal-800">
        {{ formatRupiah(hasil.pph) }}
      </p>
      <p class="tabular text-sm">
        Yang diterima {{ formatRupiah(hasil.diterima) }}
      </p>
    </section>
    <PajakLinks :current="SLUG" />
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
