<script setup lang="ts">
import {
  CHECKED_AT,
  DISCLAIMER_SAHAM,
  PPH_DIVIDEN_PERSEN,
  SUMBER_INVESTASI,
} from '~/data/investasi';
import { formatRupiah } from '~/utils/format';
import { hitungDividen } from '~/utils/saham';

const SLUG = 'kalkulator-dividen';
const events = useToolEvents(SLUG);
const form = reactive({ dividen: 0, lot: 1, hargaBeli: 0, bebasPajak: false });
const hasil = computed(() =>
  form.dividen > 0 && form.lot > 0
    ? hitungDividen({
        dividenPerLembar: form.dividen,
        lot: form.lot,
        hargaBeli: form.hargaBeli,
        bebasPajak: form.bebasPajak,
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
    q: 'Berapa pajak dividen saham?',
    a: `Untuk investor orang pribadi dalam negeri, dividen dari perusahaan Indonesia dikenai PPh final ${PPH_DIVIDEN_PERSEN}%, kecuali diinvestasikan kembali di Indonesia dalam jangka waktu dan bentuk yang ditentukan (PMK 18/2021).`,
  },
  {
    q: 'Apa itu dividend yield?',
    a: 'Dividen per lembar dibagi harga beli saham. Dividen Rp50 dari saham yang dibeli Rp1.000 berarti yield 5%.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator Dividen Saham"
    seo-title="Kalkulator Dividen Saham: Dividen Bersih Setelah Pajak dan Yield"
    description="Hitung dividen yang diterima dari jumlah lot, pajak dividen 10% atau bebas pajak bila diinvestasikan kembali, dan dividend yield terhadap harga beli."
    :faqs="faqs"
    application-category="FinanceApplication"
    :sources="SUMBER_INVESTASI.slice(3)"
    :checked-at="CHECKED_AT"
  >
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent>
      <RupiahInput
        id="div-per"
        v-model="form.dividen"
        label="Dividen per lembar"
        allow-decimal
      />
      <div>
        <label for="div-lot" class="field-label">Jumlah lot</label
        ><input
          id="div-lot"
          v-model.number="form.lot"
          type="number"
          min="1"
          class="field-input"
        />
      </div>
      <RupiahInput
        id="div-harga"
        v-model="form.hargaBeli"
        label="Harga beli per lembar (untuk yield)"
      />
      <label class="flex items-center gap-2 text-sm"
        ><input v-model="form.bebasPajak" type="checkbox" /> Diinvestasikan
        kembali (bebas PPh dividen)</label
      >
    </form>
    <ResultNote :text="DISCLAIMER_SAHAM" />
    <section v-if="hasil" class="card space-y-2" aria-live="polite">
      <p class="text-sm text-slate-600">Dividen bersih</p>
      <p class="tabular text-3xl font-bold text-teal-800">
        {{ formatRupiah(hasil.bersih) }}
      </p>
      <p class="tabular text-sm">
        Bruto {{ formatRupiah(hasil.bruto) }} · pajak
        {{ formatRupiah(hasil.pajak)
        }}<template v-if="form.hargaBeli">
          · yield
          {{
            hasil.yieldPersen.toLocaleString('id-ID', {
              maximumFractionDigits: 2,
            })
          }}%</template
        >
      </p>
    </section>
    <SahamLinks :current="SLUG" />
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
