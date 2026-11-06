<script setup lang="ts">
import { formatPercent, formatRupiah } from '~/utils/format';
import {
  bungaEfektifDariFlat,
  calculateLoan,
  cicilanFlat,
  installmentRatio,
} from '~/utils/loan';

const SLUG = 'simulasi-kta';
const events = useToolEvents(SLUG);
const defaults = () => ({
  plafon: 0,
  tenor: 24,
  jenisBunga: 'flat' as 'flat' | 'efektif',
  satuanBunga: 'bulan' as 'bulan' | 'tahun',
  bunga: 0.99,
  provisiPersen: 2,
  admin: 0,
  penghasilan: 0,
});
const form = reactive(defaults());
const submitted = ref(false);
onMounted(() => {
  const shared = useSharedState<ReturnType<typeof defaults>>(SLUG);
  if (shared) {
    Object.assign(form, { ...defaults(), ...shared });
    submitted.value = true;
  }
});

const bungaTahunan = computed(() =>
  form.satuanBunga === 'bulan' ? form.bunga * 12 : form.bunga,
);
const cicilan = computed(() => {
  if (form.jenisBunga === 'flat')
    return cicilanFlat(form.plafon, bungaTahunan.value, form.tenor);
  const loan = calculateLoan({
    principal: form.plafon,
    tenorMonths: form.tenor,
    periods: [{ months: form.tenor, annualRate: bungaTahunan.value }],
    method: 'anuitas',
  });
  return loan.schedule[0]?.payment ?? 0;
});
const efektif = computed(() =>
  form.jenisBunga === 'flat'
    ? bungaEfektifDariFlat(bungaTahunan.value, form.tenor)
    : bungaTahunan.value,
);
const potongan = computed(
  () => Math.round((form.plafon * form.provisiPersen) / 100) + form.admin,
);
const diterima = computed(() => Math.max(0, form.plafon - potongan.value));
const totalBayar = computed(() => cicilan.value * form.tenor);
const rasio = computed(() => installmentRatio(cicilan.value, form.penghasilan));

const calculate = () => {
  submitted.value = true;
  events.calculate(form.jenisBunga);
};

const faqs = [
  {
    q: 'Bunga KTA 0,99% per bulan itu berapa per tahun?',
    a: 'Kalau flat, 0,99% x 12 = 11,88% per tahun flat, yang setara sekitar 21% per tahun efektif untuk tenor 24 bulan. Kalkulator ini menampilkan angka efektifnya.',
  },
  {
    q: 'Kenapa dana yang cair lebih kecil dari plafon?',
    a: 'Provisi dan biaya administrasi biasanya dipotong langsung dari dana yang dicairkan, sementara cicilan tetap dihitung dari plafon penuh.',
  },
];
const howTo = [
  'Isi plafon pinjaman dan tenor.',
  'Pilih jenis bunga (flat atau efektif) dan satuannya (per bulan atau per tahun).',
  'Isi provisi dan biaya admin, lalu penghasilan bila ingin melihat rasio cicilan.',
  'Tekan "Hitung" untuk melihat cicilan, dana yang cair, dan bunga efektif setara.',
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Simulasi KTA"
    seo-title="Simulasi KTA: Cicilan, Dana Cair, dan Bunga Efektif"
    description="Hitung cicilan kredit tanpa agunan (KTA), dana yang benar-benar cair setelah provisi dan admin, bunga efektif setara, dan rasio cicilan terhadap penghasilan."
    :faqs="faqs"
    :how-to="howTo"
    checked-at="2026-11-06"
  >
    <form class="card space-y-4" @submit.prevent="calculate">
      <div class="grid gap-4 sm:grid-cols-2">
        <RupiahInput
          id="plafon-kta"
          v-model="form.plafon"
          label="Plafon pinjaman"
        />
        <div>
          <label for="tenor-kta" class="field-label">Tenor (bulan)</label>
          <input
            id="tenor-kta"
            v-model.number="form.tenor"
            type="number"
            min="1"
            max="120"
            class="field-input"
          />
        </div>
        <div>
          <span class="field-label">Jenis bunga</span>
          <div class="seg" role="group" aria-label="Jenis bunga">
            <button
              type="button"
              :aria-pressed="form.jenisBunga === 'flat'"
              @click="form.jenisBunga = 'flat'"
            >
              Flat
            </button>
            <button
              type="button"
              :aria-pressed="form.jenisBunga === 'efektif'"
              @click="form.jenisBunga = 'efektif'"
            >
              Efektif
            </button>
          </div>
        </div>
        <div>
          <label for="bunga-kta" class="field-label">Bunga (%)</label>
          <div class="flex gap-2">
            <input
              id="bunga-kta"
              v-model.number="form.bunga"
              type="number"
              min="0"
              step="0.01"
              class="field-input"
            />
            <select
              v-model="form.satuanBunga"
              class="field-input w-32"
              aria-label="Satuan bunga"
            >
              <option value="bulan">per bulan</option>
              <option value="tahun">per tahun</option>
            </select>
          </div>
        </div>
        <div>
          <label for="provisi-kta" class="field-label"
            >Provisi (% plafon)</label
          >
          <input
            id="provisi-kta"
            v-model.number="form.provisiPersen"
            type="number"
            min="0"
            step="0.1"
            class="field-input"
          />
        </div>
        <RupiahInput id="admin-kta" v-model="form.admin" label="Biaya admin" />
        <RupiahInput
          id="penghasilan-kta"
          v-model="form.penghasilan"
          label="Penghasilan bulanan (opsional)"
        />
      </div>
      <button type="submit" class="btn-primary" :disabled="form.plafon <= 0">
        Hitung
      </button>
    </form>

    <template v-if="submitted && form.plafon > 0">
      <section class="card space-y-3" aria-live="polite">
        <p class="text-sm text-slate-500">Cicilan per bulan</p>
        <p class="tabular text-3xl font-bold text-teal-800">
          {{ formatRupiah(cicilan) }}
        </p>
        <div class="tabular">
          <p class="result-row">
            <span>Dana yang cair (setelah provisi dan admin)</span
            ><span>{{ formatRupiah(diterima) }}</span>
          </p>
          <p class="result-row">
            <span>Total dibayar</span
            ><span>{{ formatRupiah(totalBayar) }}</span>
          </p>
          <p class="result-row">
            <span>Total bunga dan biaya</span
            ><span>{{ formatRupiah(totalBayar - diterima) }}</span>
          </p>
          <p class="result-row font-semibold">
            <span>Bunga efektif setara per tahun</span
            ><span>{{ formatPercent(efektif) }}</span>
          </p>
          <p
            v-if="rasio !== null"
            class="result-row"
            :class="rasio > 30 ? 'text-amber-700' : ''"
          >
            <span>Cicilan terhadap penghasilan</span
            ><span>{{ formatPercent(rasio, 1) }}</span>
          </p>
        </div>
        <ShareButton :tool-id="SLUG" :state="form" title="Simulasi KTA" />
      </section>
      <AdSlot placement="result" :slug="SLUG" />
    </template>
  </ToolShell>
</template>
