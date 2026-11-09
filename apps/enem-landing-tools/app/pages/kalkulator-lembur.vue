<script setup lang="ts">
import { formatRupiah } from '~/utils/format';
import { gajiLink } from '~/utils/gaji-link';
import {
  hitungLembur,
  MAKS_JAM_PER_MINGGU,
  type JenisHari,
  type LemburEntry,
  type PolaKerja,
} from '~/utils/payroll/lembur';

const SLUG = 'kalkulator-lembur';
const events = useToolEvents(SLUG);

const JENIS_HARI: { value: JenisHari; label: string }[] = [
  { value: 'kerja', label: 'Hari kerja biasa' },
  { value: 'libur', label: 'Hari istirahat mingguan / libur resmi' },
  {
    value: 'libur-terpendek',
    label: 'Libur resmi di hari kerja terpendek (pola 6 hari)',
  },
];

interface Form {
  upahPokok: number;
  tunjanganTetap: number;
  tunjanganTidakTetap: number;
  pola: PolaKerja;
  entries: LemburEntry[];
}

const defaults = (): Form => ({
  upahPokok: 0,
  tunjanganTetap: 0,
  tunjanganTidakTetap: 0,
  pola: 5,
  entries: [{ jenisHari: 'kerja', jamPerHari: 2, jumlahHari: 4 }],
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

const result = computed(() => hitungLembur(form));
const jenisLabel = (value: JenisHari) =>
  JENIS_HARI.find((jenis) => jenis.value === value)?.label ?? value;

const addEntry = () =>
  form.entries.push({ jenisHari: 'libur', jamPerHari: 4, jumlahHari: 1 });
const removeEntry = (index: number) => form.entries.splice(index, 1);
const calculate = () => {
  submitted.value = true;
  events.calculate(`pola-${form.pola}`);
};

const faqs = [
  {
    q: 'Bagaimana cara menghitung upah lembur per jam?',
    a: 'Upah lembur sejam adalah 1/173 dari upah sebulan (PP 35/2021). Di hari kerja, jam pertama dibayar 1,5 kali upah sejam dan jam berikutnya 2 kali.',
  },
  {
    q: 'Berapa upah lembur di hari libur?',
    a: 'Untuk pola 5 hari kerja: jam ke-1 sampai 8 dibayar 2 kali, jam ke-9 3 kali, jam ke-10 sampai 12 4 kali upah sejam. Untuk pola 6 hari kerja: jam ke-1 sampai 7 2 kali, jam ke-8 3 kali, jam ke-9 sampai 11 4 kali.',
  },
  {
    q: 'Upah apa yang dipakai sebagai dasar lembur?',
    a: 'Upah pokok ditambah tunjangan tetap. Bila ada tunjangan tidak tetap dan upah pokok + tunjangan tetap kurang dari 75% total upah, dasarnya 75% dari total upah.',
  },
  {
    q: 'Berapa batas jam lembur?',
    a: `Maksimal 4 jam per hari dan ${MAKS_JAM_PER_MINGGU} jam per minggu, di luar lembur pada hari istirahat mingguan atau libur resmi.`,
  },
];
const howTo = [
  'Isi upah pokok, tunjangan tetap, dan tunjangan tidak tetap (bila ada).',
  'Pilih pola kerja 5 atau 6 hari seminggu.',
  'Tambahkan baris lembur: jenis hari, jumlah jam per hari, dan berapa hari.',
  'Tekan "Hitung lembur" untuk melihat upah sejam, rincian per jam, dan total upah lembur.',
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator Lembur"
    seo-title="Kalkulator Upah Lembur Sesuai PP 35/2021"
    description="Hitung upah lembur per jam, di hari kerja maupun hari libur, sesuai PP 35/2021 untuk pola 5 dan 6 hari kerja."
    :faqs="faqs"
    :how-to="howTo"
    :sources="[
      {
        label:
          'PP 35/2021 Pasal 31 dan 32 (waktu kerja lembur dan upah lembur)',
        url: 'https://peraturan.bpk.go.id/',
      },
    ]"
    checked-at="2026-11-06"
  >
    <form class="card space-y-5" @submit.prevent="calculate">
      <div class="grid gap-4 sm:grid-cols-3">
        <RupiahInput
          id="upah-pokok"
          v-model="form.upahPokok"
          label="Upah pokok per bulan"
        />
        <RupiahInput
          id="tunjangan-tetap"
          v-model="form.tunjanganTetap"
          label="Tunjangan tetap"
        />
        <RupiahInput
          id="tunjangan-tidak-tetap"
          v-model="form.tunjanganTidakTetap"
          label="Tunjangan tidak tetap"
        />
      </div>
      <div>
        <span class="field-label">Pola kerja</span>
        <div class="seg" role="group" aria-label="Pola kerja">
          <button
            type="button"
            :aria-pressed="form.pola === 5"
            @click="form.pola = 5"
          >
            5 hari seminggu
          </button>
          <button
            type="button"
            :aria-pressed="form.pola === 6"
            @click="form.pola = 6"
          >
            6 hari seminggu
          </button>
        </div>
      </div>
      <fieldset class="space-y-3">
        <legend class="field-label">Lembur</legend>
        <div
          v-for="(entry, index) in form.entries"
          :key="index"
          class="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_120px_120px_auto]"
        >
          <select
            v-model="entry.jenisHari"
            class="field-input"
            :aria-label="`Jenis hari baris ${index + 1}`"
          >
            <option
              v-for="jenis in JENIS_HARI"
              :key="jenis.value"
              :value="jenis.value"
              :disabled="jenis.value === 'libur-terpendek' && form.pola === 5"
            >
              {{ jenis.label }}
            </option>
          </select>
          <div>
            <label :for="`jam-${index}`" class="field-hint">Jam per hari</label>
            <input
              :id="`jam-${index}`"
              v-model.number="entry.jamPerHari"
              type="number"
              min="0"
              max="24"
              step="0.5"
              class="field-input"
            />
          </div>
          <div>
            <label :for="`hari-${index}`" class="field-hint">Jumlah hari</label>
            <input
              :id="`hari-${index}`"
              v-model.number="entry.jumlahHari"
              type="number"
              min="1"
              class="field-input"
            />
          </div>
          <button
            type="button"
            class="self-end text-sm text-rose-700"
            :disabled="form.entries.length === 1"
            @click="removeEntry(index)"
          >
            Hapus
          </button>
        </div>
        <button type="button" class="btn-secondary" @click="addEntry">
          Tambah baris lembur
        </button>
      </fieldset>
      <button type="submit" class="btn-primary" :disabled="form.upahPokok <= 0">
        Hitung lembur
      </button>
    </form>

    <template v-if="submitted && form.upahPokok > 0">
      <section class="card space-y-4" aria-live="polite">
        <div>
          <p class="text-sm text-slate-500">Total upah lembur</p>
          <p class="tabular text-3xl font-bold text-primary">
            {{ formatRupiah(result.total) }}
          </p>
          <p class="mt-1 text-sm text-slate-600">
            Upah sejam {{ formatRupiah(result.upahSejam) }} (1/173 x
            {{ formatRupiah(result.dasarUpah)
            }}{{ result.dasar75Persen ? ', 75% dari total upah' : '' }}).
          </p>
          <p
            v-if="result.totalJamHariKerja > MAKS_JAM_PER_MINGGU"
            class="mt-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-900"
          >
            Total lembur hari kerja {{ result.totalJamHariKerja }} jam. Bila ini
            dalam seminggu, melebihi batas {{ MAKS_JAM_PER_MINGGU }} jam per
            minggu.
          </p>
        </div>
        <div
          v-for="(entry, index) in result.entries"
          :key="index"
          class="rounded-xl bg-slate-50 p-3 text-sm"
        >
          <p class="font-medium">
            {{ jenisLabel(entry.jenisHari) }}: {{ entry.jamPerHari }} jam x
            {{ entry.jumlahHari }} hari
          </p>
          <p
            v-for="warning in entry.warnings"
            :key="warning"
            class="text-amber-800"
          >
            {{ warning }}
          </p>
          <div class="tabular mt-1">
            <p v-for="jam in entry.perJam" :key="jam.jamKe" class="result-row">
              <span
                >Jam ke-{{ jam.jamKe }} ({{
                  jam.pengali.toLocaleString('id-ID')
                }}x)</span
              ><span>{{ formatRupiah(jam.nominal) }}</span>
            </p>
            <p class="result-row font-semibold">
              <span>Per hari / total</span
              ><span
                >{{ formatRupiah(entry.perHari) }} /
                {{ formatRupiah(entry.total) }}</span
              >
            </p>
          </div>
        </div>
        <div class="flex flex-wrap gap-3">
          <NuxtLink
            :to="
              gajiLink({
                gajiPokok: form.upahPokok,
                tunjanganTetap: form.tunjanganTetap,
                tunjanganTidakTetap: form.tunjanganTidakTetap + result.total,
              })
            "
            class="btn-primary"
          >
            Hitung gaji bersih termasuk lembur
          </NuxtLink>
          <ShareButton
            :tool-id="SLUG"
            :state="form"
            title="Hasil kalkulator lembur"
          />
        </div>
      </section>
      <DonationCta placement="after-result" :slug="SLUG" />
      <AdSlot placement="result" :slug="SLUG" />
    </template>
  </ToolShell>
</template>
