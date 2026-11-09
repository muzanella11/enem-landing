<script setup lang="ts">
import { formatPercent, formatRupiah } from '~/utils/format';
import { bungaEfektifDariFlat, cicilanFlat } from '~/utils/loan';

const SLUG = 'simulasi-kredit-kendaraan';
const events = useToolEvents(SLUG);
const defaults = () => ({
  jenis: 'motor' as 'motor' | 'mobil',
  harga: 0,
  dpMode: 'persen' as 'persen' | 'nominal',
  dpPersen: 20,
  dpNominal: 0,
  bungaFlat: 7,
  admin: 1_000_000,
  asuransiPersen: 2.5,
  asuransiDiMuka: true,
  tenor: 36,
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

const dp = computed(() =>
  form.dpMode === 'persen'
    ? Math.round((form.harga * form.dpPersen) / 100)
    : form.dpNominal,
);
const asuransiPerTahun = computed(() =>
  Math.round((form.harga * form.asuransiPersen) / 100),
);
const asuransiTotal = computed(
  () => asuransiPerTahun.value * Math.ceil(form.tenor / 12),
);
const pokok = computed(
  () =>
    Math.max(0, form.harga - dp.value) +
    (form.asuransiDiMuka ? 0 : asuransiTotal.value),
);

const simulasi = (tenor: number) => {
  const cicilan = cicilanFlat(pokok.value, form.bungaFlat, tenor);
  const totalBayar = cicilan * tenor;
  return {
    tenor,
    cicilan,
    totalBayar,
    totalBunga: totalBayar - pokok.value,
    efektif: bungaEfektifDariFlat(form.bungaFlat, tenor),
  };
};
const utama = computed(() => simulasi(form.tenor));
const pembanding = computed(() =>
  [12, 24, 36, 48, 60]
    .filter((tenor) => form.jenis === 'mobil' || tenor <= 48)
    .map(simulasi),
);
const uangMuka = computed(
  () => dp.value + form.admin + (form.asuransiDiMuka ? asuransiTotal.value : 0),
);

const calculate = () => {
  submitted.value = true;
  events.calculate(form.jenis);
};

const faqs = [
  {
    q: 'Kenapa bunga flat terlihat lebih murah?',
    a: 'Bunga flat dihitung dari pokok awal sepanjang tenor, padahal pokok terus berkurang. Bunga efektif setara biasanya hampir dua kali bunga flat; kalkulator ini menampilkannya agar bisa dibandingkan dengan KTA atau KPR.',
  },
  {
    q: 'Berapa DP minimal kredit kendaraan?',
    a: 'DP minimal diatur OJK dan bisa berbeda tergantung jenis kendaraan dan tingkat kredit bermasalah perusahaan pembiayaan. Cek ketentuan leasing yang kamu pilih.',
  },
];
const howTo = [
  'Pilih motor atau mobil dan isi harga OTR.',
  'Isi DP, bunga flat dari leasing, biaya admin, dan asuransi.',
  'Pilih tenor lalu tekan "Hitung cicilan"; bandingkan beberapa tenor sekaligus.',
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Simulasi Kredit Motor dan Mobil"
    seo-title="Simulasi Kredit Motor dan Mobil (Bunga Flat vs Efektif)"
    description="Hitung cicilan kredit motor dan mobil dengan bunga flat, total biaya, uang muka yang perlu disiapkan, dan bunga efektif setaranya."
    :faqs="faqs"
    :how-to="howTo"
    checked-at="2026-11-06"
  >
    <form class="card space-y-4" @submit.prevent="calculate">
      <div class="seg" role="group" aria-label="Jenis kendaraan">
        <button
          type="button"
          :aria-pressed="form.jenis === 'motor'"
          @click="form.jenis = 'motor'"
        >
          Motor
        </button>
        <button
          type="button"
          :aria-pressed="form.jenis === 'mobil'"
          @click="form.jenis = 'mobil'"
        >
          Mobil
        </button>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <RupiahInput id="harga-otr" v-model="form.harga" label="Harga OTR" />
        <div>
          <span class="field-label">Uang muka</span>
          <div class="flex gap-2">
            <div class="seg shrink-0" role="group" aria-label="Satuan DP">
              <button
                type="button"
                :aria-pressed="form.dpMode === 'persen'"
                @click="form.dpMode = 'persen'"
              >
                %
              </button>
              <button
                type="button"
                :aria-pressed="form.dpMode === 'nominal'"
                @click="form.dpMode = 'nominal'"
              >
                Rp
              </button>
            </div>
            <input
              v-if="form.dpMode === 'persen'"
              v-model.number="form.dpPersen"
              type="number"
              min="0"
              max="100"
              class="field-input"
              aria-label="DP persen"
            />
            <RupiahInput
              v-else
              id="dp-kendaraan"
              v-model="form.dpNominal"
              label="DP nominal"
              hide-label
              class="flex-1"
            />
          </div>
        </div>
        <div>
          <label for="bunga-flat" class="field-label"
            >Bunga flat per tahun (%)</label
          >
          <input
            id="bunga-flat"
            v-model.number="form.bungaFlat"
            type="number"
            min="0"
            step="0.1"
            class="field-input"
          />
        </div>
        <div>
          <label for="tenor-kendaraan" class="field-label">Tenor (bulan)</label>
          <select
            id="tenor-kendaraan"
            v-model.number="form.tenor"
            class="field-input"
          >
            <option
              v-for="tenor in [12, 24, 36, 48, 60]"
              :key="tenor"
              :value="tenor"
            >
              {{ tenor }} bulan
            </option>
          </select>
        </div>
        <RupiahInput
          id="admin-kendaraan"
          v-model="form.admin"
          label="Biaya administrasi"
        />
        <div>
          <label for="asuransi-kendaraan" class="field-label"
            >Asuransi per tahun (% harga)</label
          >
          <input
            id="asuransi-kendaraan"
            v-model.number="form.asuransiPersen"
            type="number"
            min="0"
            step="0.1"
            class="field-input"
          />
          <label class="mt-2 flex items-center gap-2 text-sm"
            ><input
              v-model="form.asuransiDiMuka"
              type="checkbox"
              class="h-4 w-4 accent-primary"
            />
            Asuransi dibayar di muka</label
          >
        </div>
      </div>
      <button type="submit" class="btn-primary" :disabled="form.harga <= 0">
        Hitung cicilan
      </button>
    </form>

    <template v-if="submitted && form.harga > 0">
      <section class="card space-y-3" aria-live="polite">
        <p class="text-sm text-slate-500">
          Cicilan per bulan ({{ form.tenor }} bulan)
        </p>
        <p class="tabular text-3xl font-bold text-primary">
          {{ formatRupiah(utama.cicilan) }}
        </p>
        <div class="tabular">
          <p class="result-row">
            <span>Pokok pinjaman</span><span>{{ formatRupiah(pokok) }}</span>
          </p>
          <p class="result-row">
            <span>Total bunga</span
            ><span>{{ formatRupiah(utama.totalBunga) }}</span>
          </p>
          <p class="result-row">
            <span>Bunga flat / efektif setara per tahun</span
            ><span
              >{{ formatPercent(form.bungaFlat) }} /
              {{ formatPercent(utama.efektif) }}</span
            >
          </p>
          <p class="result-row font-semibold">
            <span
              >Uang yang disiapkan di awal (DP + admin{{
                form.asuransiDiMuka ? ' + asuransi' : ''
              }})</span
            ><span>{{ formatRupiah(uangMuka) }}</span>
          </p>
        </div>
        <h2 class="pt-2 font-semibold">Perbandingan tenor</h2>
        <table class="tabular w-full text-sm">
          <thead class="text-left text-slate-500">
            <tr>
              <th class="py-1 font-medium">Tenor</th>
              <th class="py-1 text-right font-medium">Cicilan</th>
              <th class="py-1 text-right font-medium">Total bunga</th>
              <th class="py-1 text-right font-medium">Efektif</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in pembanding"
              :key="row.tenor"
              class="border-t border-slate-100"
              :class="row.tenor === form.tenor ? 'font-semibold' : ''"
            >
              <td class="py-1">{{ row.tenor }} bulan</td>
              <td class="py-1 text-right">{{ formatRupiah(row.cicilan) }}</td>
              <td class="py-1 text-right">
                {{ formatRupiah(row.totalBunga) }}
              </td>
              <td class="py-1 text-right">{{ formatPercent(row.efektif) }}</td>
            </tr>
          </tbody>
        </table>
        <ShareButton
          :tool-id="SLUG"
          :state="form"
          title="Simulasi kredit kendaraan"
        />
      </section>
      <AdSlot placement="result" :slug="SLUG" />
    </template>
  </ToolShell>
</template>
