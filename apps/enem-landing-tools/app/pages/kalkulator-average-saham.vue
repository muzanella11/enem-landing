<script setup lang="ts">
import {
  CHECKED_AT,
  DISCLAIMER_SAHAM,
  SUMBER_INVESTASI,
} from '~/data/investasi';
import { formatRupiah } from '~/utils/format';
import { bulatkanFraksi, hargaRataRata, lotUntukTarget } from '~/utils/saham';

const SLUG = 'kalkulator-average-saham';
const events = useToolEvents(SLUG);
const pembelian = ref([
  { harga: 0, lot: 0 },
  { harga: 0, lot: 0 },
]);
const target = reactive({ hargaBaru: 0, rataRata: 0 });
const valid = computed(() =>
  pembelian.value.filter((p) => p.harga > 0 && p.lot > 0),
);
const rata = computed(() => hargaRataRata(valid.value));
const totalLot = computed(() => valid.value.reduce((s, p) => s + p.lot, 0));
const butuh = computed(() =>
  rata.value && target.hargaBaru > 0 && target.rataRata > 0
    ? lotUntukTarget(
        rata.value,
        totalLot.value,
        target.hargaBaru,
        target.rataRata,
      )
    : undefined,
);
let dicatat = false;
watch(rata, (v) => {
  if (v && !dicatat) {
    dicatat = true;
    events.calculate();
  }
});
const faqs = [
  {
    q: 'Bagaimana menghitung harga rata-rata saham?',
    a: 'Jumlahkan (harga x lot) tiap pembelian lalu bagi dengan total lot. Fee broker tidak dimasukkan, sama seperti harga rata-rata yang ditampilkan kebanyakan aplikasi sekuritas.',
  },
  {
    q: 'Berapa lot untuk average down ke harga tertentu?',
    a: 'Lot tambahan = lot sekarang x (rata-rata lama - target) / (target - harga beli baru). Target harus berada di antara harga beli baru dan rata-rata lama.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator Average Down Saham"
    seo-title="Kalkulator Average Down dan Average Up Saham"
    description="Hitung harga rata-rata saham dari beberapa pembelian dan berapa lot yang perlu dibeli untuk menurunkan atau menaikkan harga rata-rata ke target tertentu."
    :faqs="faqs"
    application-category="FinanceApplication"
    :sources="SUMBER_INVESTASI.slice(0, 2)"
    :checked-at="CHECKED_AT"
  >
    <section class="card space-y-2">
      <div
        v-for="(p, i) in pembelian"
        :key="i"
        class="grid grid-cols-[1fr_6rem_2rem] gap-2"
      >
        <RupiahInput
          :id="`avg-harga-${i}`"
          v-model="p.harga"
          :label="`Harga beli ${i + 1}`"
        />
        <div>
          <label :for="`avg-lot-${i}`" class="field-label">Lot</label
          ><input
            :id="`avg-lot-${i}`"
            v-model.number="p.lot"
            type="number"
            min="0"
            class="field-input"
          />
        </div>
        <button
          type="button"
          class="mt-6 btn-remove"
          :aria-label="`Hapus pembelian ${i + 1}`"
          @click="pembelian.splice(i, 1)"
        >
          ✕
        </button>
      </div>
      <button
        type="button"
        class="btn-link"
        @click="pembelian.push({ harga: 0, lot: 0 })"
      >
        + Pembelian
      </button>
    </section>
    <ResultNote :text="DISCLAIMER_SAHAM" />
    <section v-if="rata" class="card space-y-3" aria-live="polite">
      <p class="text-sm text-slate-600">Harga rata-rata ({{ totalLot }} lot)</p>
      <p class="tabular text-3xl font-bold text-teal-800">
        {{ formatRupiah(rata) }}
      </p>
      <div class="grid gap-3 sm:grid-cols-2">
        <RupiahInput
          id="avg-harga-baru"
          v-model="target.hargaBaru"
          label="Harga beli berikutnya"
        />
        <RupiahInput
          id="avg-target"
          v-model="target.rataRata"
          label="Target harga rata-rata"
        />
      </div>
      <p v-if="butuh !== undefined" class="tabular text-sm">
        <template v-if="butuh === null"
          >Target tidak bisa dicapai dengan harga beli tersebut.</template
        >
        <template v-else
          >Beli <strong>{{ butuh }} lot</strong> di
          {{ formatRupiah(bulatkanFraksi(target.hargaBaru, false)) }} ({{
            formatRupiah(butuh * 100 * target.hargaBaru)
          }}).</template
        >
      </p>
    </section>
    <SahamLinks :current="SLUG" />
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
