<script setup lang="ts">
import {
  AKTIVITAS,
  CHECKED_AT,
  KALORI_MINIMUM,
  SUMBER,
  type Aktivitas,
} from '~/data/kesehatan';
import { hitungKalori, type JenisKelamin } from '~/utils/kesehatan';

const SLUG = 'kalkulator-kalori';
const events = useToolEvents(SLUG);
const form = reactive({
  jenis: 'wanita' as JenisKelamin,
  usia: null as number | null,
  berat: null as number | null,
  tinggi: null as number | null,
  aktivitas: 'ringan' as Aktivitas,
});
const hasil = ref<ReturnType<typeof hitungKalori> | null>(null);

onMounted(() => {
  const shared = useSharedState<typeof form>(SLUG);
  if (shared) {
    Object.assign(form, shared);
    hitung();
  }
});
const hitung = () => {
  const [usia, berat, tinggi] = [
    Number(form.usia),
    Number(form.berat),
    Number(form.tinggi),
  ];
  if (!(usia >= 18 && berat > 0 && tinggi > 50)) return;
  hasil.value = hitungKalori(form.jenis, berat, tinggi, usia, form.aktivitas);
  events.calculate(form.aktivitas);
};
const kkal = (n: number) => `${n.toLocaleString('id-ID')} kkal`;
const faqs = [
  {
    q: 'Rumus apa yang dipakai?',
    a: 'Mifflin-St Jeor (1990) untuk kebutuhan energi istirahat (BMR), lalu dikali faktor aktivitas untuk total kebutuhan harian (TDEE).',
  },
  {
    q: 'Berapa penurunan berat yang aman?',
    a: 'Sekitar 0,25 sampai 0,5 kg per minggu, yaitu defisit sekitar 250 sampai 550 kkal per hari. Asupan di bawah 1.200 kkal (wanita) atau 1.500 kkal (pria) sebaiknya dengan pengawasan tenaga kesehatan.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator Kalori Harian"
    seo-title="Kalkulator Kebutuhan Kalori Harian (BMR dan TDEE)"
    description="Hitung kebutuhan kalori harian (BMR dan TDEE) dengan rumus Mifflin-St Jeor, plus target kalori untuk turun atau naik berat badan secara aman."
    application-category="HealthApplication"
    :faqs="faqs"
    :how-to="[
      'Isi jenis kelamin, usia, berat, tinggi, dan tingkat aktivitas.',
      'Tekan Hitung kalori.',
      'Lihat kebutuhan harian dan target sesuai tujuan.',
    ]"
    :sources="SUMBER.kalori"
    :checked-at="CHECKED_AT"
    :caveats="[
      'Untuk dewasa 18 tahun ke atas, tidak untuk ibu hamil/menyusui atau penderita penyakit tertentu.',
    ]"
    medical
  >
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent="hitung">
      <fieldset class="sm:col-span-2">
        <legend class="field-label">Jenis kelamin</legend>
        <label class="mr-4 text-sm"
          ><input v-model="form.jenis" type="radio" value="wanita" />
          Wanita</label
        >
        <label class="text-sm"
          ><input v-model="form.jenis" type="radio" value="pria" /> Pria</label
        >
      </fieldset>
      <div>
        <label for="kal-usia" class="field-label">Usia (tahun)</label>
        <input
          id="kal-usia"
          v-model.number="form.usia"
          type="number"
          min="18"
          max="100"
          class="field-input"
        />
      </div>
      <div>
        <label for="kal-berat" class="field-label">Berat badan (kg)</label>
        <input
          id="kal-berat"
          v-model.number="form.berat"
          type="number"
          min="1"
          step="0.1"
          class="field-input"
        />
      </div>
      <div>
        <label for="kal-tinggi" class="field-label">Tinggi badan (cm)</label>
        <input
          id="kal-tinggi"
          v-model.number="form.tinggi"
          type="number"
          min="50"
          step="0.1"
          class="field-input"
        />
      </div>
      <div>
        <label for="kal-aktivitas" class="field-label">Aktivitas</label>
        <select id="kal-aktivitas" v-model="form.aktivitas" class="field-input">
          <option v-for="a in AKTIVITAS" :key="a.id" :value="a.id">
            {{ a.label }}
          </option>
        </select>
      </div>
      <button type="submit" class="btn-primary sm:col-span-2">
        Hitung kalori
      </button>
    </form>
    <template v-if="hasil">
      <HealthDisclaimer />
      <section class="card space-y-3" aria-live="polite">
        <p class="tabular text-3xl font-bold text-teal-800">
          {{ kkal(hasil.tdee) }}/hari
        </p>
        <p class="text-sm text-slate-600">
          Kebutuhan untuk mempertahankan berat. Energi istirahat (BMR):
          {{ kkal(hasil.bmr) }}.
        </p>
        <table class="tabular w-full text-sm">
          <tbody>
            <tr
              v-for="t in hasil.target"
              :key="t.label"
              class="border-t border-slate-100"
            >
              <td class="py-2">{{ t.label }}</td>
              <td class="py-2 text-right font-semibold">
                {{ kkal(t.kkal) }}
                <span
                  v-if="t.dibawahMinimum"
                  class="block text-xs font-normal text-rose-700"
                >
                  di bawah {{ kkal(KALORI_MINIMUM[form.jenis]) }}, perlu
                  pengawasan tenaga kesehatan
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <ShareButton
          :tool-id="SLUG"
          :state="form"
          title="Hasil kalkulator kalori"
        />
      </section>
    </template>
    <HealthLinks :current="SLUG" />
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
