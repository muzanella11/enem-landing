<script setup lang="ts">
import { KALENDER_LIBUR } from '~/data/libur';
import { hitungHariKerja, type PolaKerja } from '~/utils/kalender';

const SLUG = 'hitung-hari-kerja';
const events = useToolEvents(SLUG);
const form = reactive({
  mulai: '',
  selesai: '',
  pola: 5 as PolaKerja,
  hitungLibur: true,
});
const submitted = ref(false);

const semuaLibur = Object.values(KALENDER_LIBUR).flatMap((kalender) =>
  kalender.entries.filter((day) => day.jenis !== 'fakultatif-hindu'),
);
const tahunTanpaData = computed(() => {
  if (!form.mulai || !form.selesai) return [];
  const [a, b] = [form.mulai, form.selesai].sort();
  const years: number[] = [];
  for (let y = Number(a!.slice(0, 4)); y <= Number(b!.slice(0, 4)); y += 1) {
    if (KALENDER_LIBUR[y]?.status !== 'resmi') years.push(y);
  }
  return years;
});
const result = computed(() =>
  form.mulai && form.selesai
    ? hitungHariKerja(
        form.mulai,
        form.selesai,
        form.pola,
        form.hitungLibur ? semuaLibur : [],
      )
    : null,
);
const tanggal = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', {
    dateStyle: 'medium',
  });
const calculate = () => {
  submitted.value = true;
  events.calculate(`pola-${form.pola}`);
};

const faqs = [
  {
    q: 'Apakah tanggal mulai dan selesai ikut dihitung?',
    a: 'Ya, keduanya ikut dihitung (inklusif).',
  },
  {
    q: 'Libur apa saja yang diperhitungkan?',
    a: 'Libur nasional dan cuti bersama dari kalender Bank Indonesia. Untuk tahun yang kalendernya belum terbit, hanya akhir pekan yang diperhitungkan.',
  },
];
const howTo = [
  'Isi tanggal mulai dan tanggal selesai.',
  'Pilih pola kerja 5 atau 6 hari, dan apakah libur nasional ikut dihitung.',
  'Tekan "Hitung" untuk melihat jumlah hari kerja dan libur yang terlewati.',
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Hitung Hari Kerja"
    seo-title="Hitung Hari Kerja Antara Dua Tanggal (Termasuk Libur Nasional)"
    description="Hitung jumlah hari kerja di antara dua tanggal, dengan libur nasional dan cuti bersama dari kalender Bank Indonesia ikut diperhitungkan."
    application-category="LifestyleApplication"
    :faqs="faqs"
    :how-to="howTo"
    checked-at="2026-11-06"
  >
    <form class="card space-y-4" @submit.prevent="calculate">
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="mulai" class="field-label">Tanggal mulai</label>
          <input
            id="mulai"
            v-model="form.mulai"
            type="date"
            class="field-input"
          />
        </div>
        <div>
          <label for="selesai" class="field-label">Tanggal selesai</label>
          <input
            id="selesai"
            v-model="form.selesai"
            type="date"
            class="field-input"
          />
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-4">
        <div class="seg" role="group" aria-label="Pola kerja">
          <button
            type="button"
            :aria-pressed="form.pola === 5"
            @click="form.pola = 5"
          >
            5 hari kerja
          </button>
          <button
            type="button"
            :aria-pressed="form.pola === 6"
            @click="form.pola = 6"
          >
            6 hari kerja
          </button>
        </div>
        <label class="flex items-center gap-2 text-sm"
          ><input
            v-model="form.hitungLibur"
            type="checkbox"
            class="h-4 w-4 accent-teal-700"
          />
          Hitung libur nasional dan cuti bersama</label
        >
      </div>
      <button
        type="submit"
        class="btn-primary"
        :disabled="!form.mulai || !form.selesai"
      >
        Hitung
      </button>
    </form>

    <section
      v-if="submitted && result"
      class="card space-y-3"
      aria-live="polite"
    >
      <p class="text-sm text-slate-500">Hari kerja</p>
      <p class="tabular text-3xl font-bold text-teal-800">
        {{ result.hariKerja }} hari
      </p>
      <p class="text-sm text-slate-700">
        {{ result.hariKalender }} hari kalender, {{ result.akhirPekan }} hari
        akhir pekan, {{ result.liburTerlewati.length }} hari libur.
      </p>
      <p
        v-if="tahunTanpaData.length && form.hitungLibur"
        class="rounded-lg bg-amber-50 p-2 text-sm text-amber-900"
      >
        Kalender libur Bank Indonesia {{ tahunTanpaData.join(', ') }} belum
        terbit; libur tahun itu belum diperhitungkan.
      </p>
      <ul v-if="result.liburTerlewati.length" class="text-sm">
        <li v-for="day in result.liburTerlewati" :key="day.tanggal">
          {{ tanggal(day.tanggal) }}: {{ day.nama
          }}<span v-if="day.jenis === 'cuti-bersama'"> (cuti bersama)</span>
        </li>
      </ul>
      <NuxtLink to="/libur-nasional" class="btn-link"
        >Lihat daftar libur nasional</NuxtLink
      >
    </section>
    <AdSlot v-if="submitted" placement="result" :slug="SLUG" />
  </ToolShell>
</template>
