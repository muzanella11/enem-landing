<script setup lang="ts">
import {
  ALASAN_PHK,
  PESANGON_CHECKED_AT,
  PESANGON_SOURCES,
} from '~/data/pesangon/pp-35-2021';
import { formatPercent, formatRupiah } from '~/utils/format';
import { masaKerjaBulan } from '~/utils/payroll/thr';
import { hitungPesangon } from '~/utils/payroll/pesangon';

const SLUG = 'kalkulator-pesangon';
const events = useToolEvents(SLUG);

const defaults = () => ({
  mulai: '',
  phk: '',
  gajiPokok: 0,
  tunjanganTetap: 0,
  alasanId: 'efisiensi-cegah-rugi',
  sisaCutiHari: 0,
  pola: 5 as 5 | 6,
  biayaPulang: 0,
  uangPisah: 0,
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

const bulan = computed(() =>
  form.mulai && form.phk ? masaKerjaBulan(form.mulai, form.phk) : 0,
);
const result = computed(() =>
  hitungPesangon({
    masaKerjaBulan: bulan.value,
    upah: form.gajiPokok + form.tunjanganTetap,
    alasanId: form.alasanId,
    sisaCutiHari: form.sisaCutiHari,
    hariKerjaSebulan: form.pola === 5 ? 21 : 25,
    biayaPulang: form.biayaPulang,
    uangPisah: form.uangPisah,
  }),
);
const canCalculate = computed(() =>
  Boolean(form.mulai && form.phk && form.gajiPokok > 0),
);
const calculate = () => {
  submitted.value = true;
  events.calculate(form.alasanId);
};

const faqs = [
  {
    q: 'Berapa uang pesangon menurut aturan terbaru?',
    a: 'Menurut PP 35/2021, uang pesangon (UP) 1 bulan upah per tahun masa kerja (maksimal 9 bulan), ditambah uang penghargaan masa kerja (UPMK) mulai masa kerja 3 tahun, lalu dikali pengali sesuai alasan PHK.',
  },
  {
    q: 'Apakah pesangon kena pajak?',
    a: 'Ya, PPh 21 final menurut PP 68/2009: 0% sampai Rp50 juta, 5% di atas Rp50 juta sampai Rp100 juta, 15% di atas Rp100 juta sampai Rp500 juta, dan 25% di atas Rp500 juta.',
  },
  {
    q: 'Kalau mengundurkan diri, dapat pesangon?',
    a: 'Tidak mendapat UP dan UPMK, tetapi berhak atas uang penggantian hak (mis. sisa cuti) dan uang pisah yang besarnya diatur perjanjian kerja atau peraturan perusahaan.',
  },
];
const howTo = [
  'Isi tanggal mulai kerja dan tanggal PHK.',
  'Isi upah pokok dan tunjangan tetap.',
  'Pilih alasan PHK, lalu isi sisa cuti dan uang pisah bila ada.',
  'Tekan "Hitung pesangon" untuk melihat rincian dan pajaknya.',
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator Pesangon"
    seo-title="Kalkulator Pesangon PHK (PP 35/2021) dan Pajaknya"
    description="Hitung uang pesangon, uang penghargaan masa kerja, uang penggantian hak, dan PPh 21 final pesangon sesuai alasan PHK (PP 35/2021)."
    :faqs="faqs"
    :how-to="howTo"
    :sources="PESANGON_SOURCES"
    :checked-at="PESANGON_CHECKED_AT"
    :caveats="[
      'Klaster ketenagakerjaan UU 6/2023 diuji MK (putusan 168/PUU-XXI/2024) dan akan diatur ulang lewat undang-undang baru; hitungan ini memakai PP 35/2021 yang masih dipakai saat dicek.',
      'Perjanjian kerja bersama bisa memberi hak lebih baik dari ketentuan minimum ini.',
    ]"
  >
    <form class="card space-y-4" @submit.prevent="calculate">
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="mulai-kerja" class="field-label">Mulai kerja</label>
          <input
            id="mulai-kerja"
            v-model="form.mulai"
            type="date"
            class="field-input"
          />
        </div>
        <div>
          <label for="tanggal-phk" class="field-label">Tanggal PHK</label>
          <input
            id="tanggal-phk"
            v-model="form.phk"
            type="date"
            class="field-input"
          />
        </div>
        <RupiahInput
          id="pesangon-gaji"
          v-model="form.gajiPokok"
          label="Upah pokok per bulan"
        />
        <RupiahInput
          id="pesangon-tunjangan"
          v-model="form.tunjanganTetap"
          label="Tunjangan tetap"
        />
        <div class="sm:col-span-2">
          <label for="alasan" class="field-label">Alasan PHK</label>
          <select id="alasan" v-model="form.alasanId" class="field-input">
            <option
              v-for="alasan in ALASAN_PHK"
              :key="alasan.id"
              :value="alasan.id"
            >
              {{ alasan.label }} ({{ alasan.pasal }})
            </option>
          </select>
        </div>
        <div>
          <label for="sisa-cuti" class="field-label"
            >Sisa cuti tahunan (hari)</label
          >
          <input
            id="sisa-cuti"
            v-model.number="form.sisaCutiHari"
            type="number"
            min="0"
            class="field-input"
          />
        </div>
        <div>
          <span class="field-label">Pola kerja (untuk upah harian)</span>
          <div class="seg" role="group" aria-label="Pola kerja">
            <button
              type="button"
              :aria-pressed="form.pola === 5"
              @click="form.pola = 5"
            >
              5 hari
            </button>
            <button
              type="button"
              :aria-pressed="form.pola === 6"
              @click="form.pola = 6"
            >
              6 hari
            </button>
          </div>
        </div>
        <RupiahInput
          id="biaya-pulang"
          v-model="form.biayaPulang"
          label="Biaya pulang ke tempat diterima kerja"
        />
        <RupiahInput
          v-if="result.alasan.uangPisah"
          id="uang-pisah"
          v-model="form.uangPisah"
          label="Uang pisah (sesuai perjanjian kerja)"
        />
      </div>
      <button type="submit" class="btn-primary" :disabled="!canCalculate">
        Hitung pesangon
      </button>
    </form>

    <template v-if="submitted && canCalculate">
      <section class="card space-y-3" aria-live="polite">
        <p class="text-sm text-slate-500">Diterima setelah pajak</p>
        <p class="tabular text-3xl font-bold text-teal-800">
          {{ formatRupiah(result.bersih) }}
        </p>
        <p class="text-sm text-slate-600">
          Masa kerja {{ result.masaKerjaTahun }} tahun ({{ bulan }} bulan) ·
          {{ result.alasan.label }} ({{ result.alasan.pasal }})
        </p>
        <div class="tabular">
          <p class="result-row">
            <span
              >Uang pesangon: {{ result.alasan.up.toLocaleString('id-ID') }} x
              {{ result.bulanUp }} bulan upah</span
            ><span>{{ formatRupiah(result.up) }}</span>
          </p>
          <p class="result-row">
            <span
              >Uang penghargaan masa kerja: {{ result.alasan.upmk }} x
              {{ result.bulanUpmk }} bulan upah</span
            ><span>{{ formatRupiah(result.upmk) }}</span>
          </p>
          <p class="result-row">
            <span>Uang penggantian hak (cuti, biaya pulang)</span
            ><span>{{ formatRupiah(result.uph) }}</span>
          </p>
          <p v-if="result.alasan.uangPisah" class="result-row">
            <span>Uang pisah</span
            ><span>{{ formatRupiah(result.uangPisah) }}</span>
          </p>
          <p class="result-row font-semibold">
            <span>Total bruto</span
            ><span>{{ formatRupiah(result.bruto) }}</span>
          </p>
          <p
            v-for="lapisan in result.lapisanPph"
            :key="lapisan.dari"
            class="result-row text-slate-600"
          >
            <span
              >PPh final {{ formatPercent(lapisan.tarif) }} atas
              {{ formatRupiah(lapisan.sampai - lapisan.dari) }}</span
            ><span>-{{ formatRupiah(lapisan.pajak) }}</span>
          </p>
          <p class="result-row font-semibold">
            <span>Diterima</span><span>{{ formatRupiah(result.bersih) }}</span>
          </p>
        </div>
        <ShareButton
          :tool-id="SLUG"
          :state="form"
          title="Hasil kalkulator pesangon"
        />
      </section>
      <AdSlot placement="result" :slug="SLUG" />
    </template>
  </ToolShell>
</template>
