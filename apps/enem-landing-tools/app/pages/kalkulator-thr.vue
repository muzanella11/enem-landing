<script setup lang="ts">
import {
  PAYROLL_RULES_2026,
  PTKP_STATUSES,
  type PtkpStatus,
} from '~/data/tax/2026';
import { formatRupiah, MONTH_NAMES } from '~/utils/format';
import {
  batasBayarThr,
  hitungThr,
  masaKerjaBulan,
  pajakThr,
  rataRataUpah,
  type StatusPekerja,
} from '~/utils/payroll/thr';

const SLUG = 'kalkulator-thr';
const events = useToolEvents(SLUG);

const HARI_RAYA = [
  'Idul Fitri',
  'Natal',
  'Nyepi',
  'Waisak',
  'Imlek',
  'Hari raya keagamaan lain',
];

interface Form {
  status: StatusPekerja;
  mulaiKerja: string;
  hariRaya: string;
  jenisHariRaya: string;
  gajiPokok: number;
  tunjanganTetap: number;
  upahHarian: number[];
  ptkp: PtkpStatus;
  ikutBpjsKesehatan: boolean;
  ikutBpjsKetenagakerjaan: boolean;
}

const defaults = (): Form => ({
  status: 'tetap',
  mulaiKerja: '',
  hariRaya: '',
  jenisHariRaya: 'Idul Fitri',
  gajiPokok: 0,
  tunjanganTetap: 0,
  upahHarian: [0, 0, 0],
  ptkp: 'TK/0',
  ikutBpjsKesehatan: true,
  ikutBpjsKetenagakerjaan: true,
});

const form = reactive(defaults());
const submitted = ref(false);

onMounted(() => {
  const shared = useSharedState<Form>(SLUG);
  if (shared) {
    Object.assign(form, { ...defaults(), ...shared });
    submitted.value = true;
  }
});

const masaKerja = computed(() =>
  form.mulaiKerja && form.hariRaya
    ? masaKerjaBulan(form.mulaiKerja, form.hariRaya)
    : 0,
);
const upah = computed(() =>
  form.status === 'harian'
    ? rataRataUpah(form.upahHarian)
    : form.gajiPokok + form.tunjanganTetap,
);
const thr = computed(() => hitungThr(masaKerja.value, upah.value));
const bulan = computed(() =>
  form.hariRaya ? Number(form.hariRaya.slice(5, 7)) : 1,
);
const pajak = computed(() =>
  form.status === 'tetap' && thr.value.thr > 0
    ? pajakThr(
        {
          gajiPokok: form.gajiPokok,
          tunjanganTetap: form.tunjanganTetap,
          tunjanganTidakTetap: 0,
          ptkp: form.ptkp,
          jkkRiskIndex: 0,
          ikutBpjsKesehatan: form.ikutBpjsKesehatan,
          ikutBpjsKetenagakerjaan: form.ikutBpjsKetenagakerjaan,
        },
        thr.value.thr,
        bulan.value,
      )
    : null,
);
const batas = computed(() =>
  form.hariRaya ? batasBayarThr(form.hariRaya) : '',
);
const tanggal = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', {
    dateStyle: 'long',
  });

const canCalculate = computed(() =>
  Boolean(form.mulaiKerja && form.hariRaya && upah.value > 0),
);
const calculate = () => {
  submitted.value = true;
  events.calculate(form.status);
};

const faqs = [
  {
    q: 'Berapa THR untuk masa kerja kurang dari setahun?',
    a: 'Pekerja dengan masa kerja 1 bulan sampai kurang dari 12 bulan mendapat THR proporsional: masa kerja (bulan) dibagi 12 dikali satu bulan upah (Permenaker 6/2016).',
  },
  {
    q: 'Upah apa yang dipakai untuk THR?',
    a: 'Upah pokok ditambah tunjangan tetap. Untuk pekerja harian lepas, dipakai rata-rata upah per bulan selama 12 bulan terakhir (atau selama masa kerja bila kurang dari 12 bulan).',
  },
  {
    q: 'Kapan THR paling lambat dibayar?',
    a: 'Paling lambat 7 hari sebelum hari raya keagamaan.',
  },
  {
    q: 'Apakah THR kena pajak?',
    a: 'Ya. THR ditambahkan ke penghasilan bruto bulan dibayarkan dan dipotong PPh 21 dengan tarif TER bulan itu. Selisihnya dikoreksi di bulan Desember.',
  },
];
const howTo = [
  'Pilih status pekerja: karyawan tetap/kontrak atau harian lepas.',
  'Isi tanggal mulai kerja dan tanggal hari raya untuk menghitung masa kerja.',
  'Isi upah pokok dan tunjangan tetap (atau upah bulanan untuk pekerja harian).',
  'Tekan "Hitung THR" untuk melihat besar THR, estimasi pajaknya, dan batas tanggal pembayaran.',
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator THR"
    seo-title="Kalkulator THR 2027 dan Pajaknya"
    description="Hitung THR penuh atau proporsional sesuai Permenaker 6/2016, estimasi potongan PPh 21 di bulan THR, dan batas tanggal pembayarannya."
    :faqs="faqs"
    :how-to="howTo"
    :sources="[
      {
        label: 'Permenaker 6/2016 tentang THR keagamaan',
        url: 'https://jdih.kemnaker.go.id/',
      },
      ...PAYROLL_RULES_2026.sources.slice(0, 2),
    ]"
    checked-at="2026-11-06"
    :caveats="[
      'Tanggal hari raya 2027 diisi sendiri. Kalender libur dan cuti bersama Bank Indonesia untuk 2027 belum terbit.',
    ]"
  >
    <form class="card space-y-5" @submit.prevent="calculate">
      <div class="seg" role="group" aria-label="Status pekerja">
        <button
          type="button"
          :aria-pressed="form.status === 'tetap'"
          @click="form.status = 'tetap'"
        >
          Karyawan tetap/kontrak
        </button>
        <button
          type="button"
          :aria-pressed="form.status === 'harian'"
          @click="form.status = 'harian'"
        >
          Harian lepas
        </button>
      </div>
      <div class="grid gap-4 sm:grid-cols-3">
        <div>
          <label for="mulai" class="field-label">Mulai kerja</label>
          <input
            id="mulai"
            v-model="form.mulaiKerja"
            type="date"
            class="field-input"
          />
        </div>
        <div>
          <label for="jenis-hari-raya" class="field-label">Hari raya</label>
          <select
            id="jenis-hari-raya"
            v-model="form.jenisHariRaya"
            class="field-input"
          >
            <option v-for="item in HARI_RAYA" :key="item" :value="item">
              {{ item }}
            </option>
          </select>
        </div>
        <div>
          <label for="tanggal-hari-raya" class="field-label"
            >Tanggal hari raya</label
          >
          <input
            id="tanggal-hari-raya"
            v-model="form.hariRaya"
            type="date"
            class="field-input"
          />
        </div>
      </div>
      <div v-if="form.status === 'tetap'" class="grid gap-4 sm:grid-cols-2">
        <RupiahInput
          id="thr-gaji-pokok"
          v-model="form.gajiPokok"
          label="Gaji pokok per bulan"
        />
        <RupiahInput
          id="thr-tunjangan-tetap"
          v-model="form.tunjanganTetap"
          label="Tunjangan tetap"
        />
        <div>
          <label for="thr-ptkp" class="field-label"
            >Status PTKP (untuk estimasi pajak)</label
          >
          <select id="thr-ptkp" v-model="form.ptkp" class="field-input">
            <option
              v-for="status in PTKP_STATUSES"
              :key="status"
              :value="status"
            >
              {{ status }}
            </option>
          </select>
        </div>
        <div class="flex flex-col justify-end gap-1 text-sm">
          <label class="flex items-center gap-2"
            ><input
              v-model="form.ikutBpjsKesehatan"
              type="checkbox"
              class="h-4 w-4 accent-primary"
            />
            Ikut BPJS Kesehatan</label
          >
          <label class="flex items-center gap-2"
            ><input
              v-model="form.ikutBpjsKetenagakerjaan"
              type="checkbox"
              class="h-4 w-4 accent-primary"
            />
            Ikut BPJS Ketenagakerjaan</label
          >
        </div>
      </div>
      <fieldset v-else class="space-y-2">
        <legend class="field-label">
          Upah per bulan (12 bulan terakhir, atau selama masa kerja)
        </legend>
        <div class="grid gap-2 sm:grid-cols-3">
          <RupiahInput
            v-for="(_, index) in form.upahHarian"
            :id="`upah-${index}`"
            :key="index"
            v-model="form.upahHarian[index]"
            :label="`Bulan ${index + 1}`"
          />
        </div>
        <button
          type="button"
          class="btn-secondary"
          :disabled="form.upahHarian.length >= 12"
          @click="form.upahHarian.push(0)"
        >
          Tambah bulan
        </button>
      </fieldset>
      <button type="submit" class="btn-primary" :disabled="!canCalculate">
        Hitung THR
      </button>
    </form>

    <template v-if="submitted && canCalculate">
      <section class="card space-y-3" aria-live="polite">
        <p class="text-sm text-slate-500">THR {{ form.jenisHariRaya }}</p>
        <p class="tabular text-3xl font-bold text-primary">
          {{ formatRupiah(thr.thr) }}
        </p>
        <p class="text-sm text-slate-700">
          <template v-if="!thr.berhak"
            >Masa kerja kurang dari 1 bulan, belum berhak THR.</template
          >
          <template v-else-if="thr.proporsional"
            >Masa kerja {{ thr.masaKerja }} bulan: THR proporsional
            {{ thr.masaKerja }}/12 x {{ formatRupiah(upah) }}.</template
          >
          <template v-else
            >Masa kerja {{ thr.masaKerja }} bulan (12 bulan atau lebih): THR
            satu bulan upah.</template
          >
        </p>
        <div v-if="pajak" class="tabular rounded-xl bg-slate-50 p-3 text-sm">
          <p class="result-row">
            <span
              >PPh 21 bulan {{ MONTH_NAMES[pajak.bulan - 1] }} tanpa THR</span
            ><span>{{ formatRupiah(pajak.pph21TanpaThr) }}</span>
          </p>
          <p class="result-row">
            <span>PPh 21 bulan itu dengan THR</span
            ><span>{{ formatRupiah(pajak.pph21DenganThr) }}</span>
          </p>
          <p class="result-row">
            <span>Tambahan potongan karena THR</span
            ><span>-{{ formatRupiah(pajak.tambahanPph21) }}</span>
          </p>
          <p class="result-row font-semibold">
            <span>Perkiraan THR bersih diterima</span
            ><span>{{ formatRupiah(pajak.thrBersih) }}</span>
          </p>
          <p class="field-hint">
            Selisih pajak dikoreksi di bulan Desember (rekonsiliasi PPh 21).
          </p>
        </div>
        <p v-if="batas" class="text-sm text-slate-700">
          Paling lambat dibayar: <strong>{{ tanggal(batas) }}</strong> (7 hari
          sebelum hari raya).
        </p>
        <ShareButton
          :tool-id="SLUG"
          :state="form"
          title="Hasil kalkulator THR"
        />
      </section>
      <DonationCta placement="after-result" :slug="SLUG" />
      <AdSlot placement="result" :slug="SLUG" />
    </template>
  </ToolShell>
</template>
