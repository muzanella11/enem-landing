<script setup lang="ts">
import { CHECKED_AT, IMT_KEMENKES, SUMBER } from '~/data/kesehatan';
import {
  beratNormal,
  hitungImt,
  kategoriKemenkes,
  kategoriWhoAsia,
} from '~/utils/kesehatan';

const SLUG = 'kalkulator-bmi';
const events = useToolEvents(SLUG);
const form = reactive({
  berat: null as number | null,
  tinggi: null as number | null,
});
const hasil = ref<{ imt: number; tinggi: number } | null>(null);

onMounted(() => {
  const shared = useSharedState<typeof form>(SLUG);
  if (shared) {
    Object.assign(form, shared);
    hitung();
  }
});

const hitung = () => {
  const berat = Number(form.berat);
  const tinggi = Number(form.tinggi);
  if (!(berat > 0 && tinggi > 50)) return;
  hasil.value = { imt: hitungImt(berat, tinggi), tinggi };
  events.calculate();
};
const kemenkes = computed(
  () => hasil.value && kategoriKemenkes(hasil.value.imt),
);
const who = computed(() => hasil.value && kategoriWhoAsia(hasil.value.imt));
const normal = computed(() => hasil.value && beratNormal(hasil.value.tinggi));
const TONE = {
  kurang: 'text-sky-800',
  normal: 'text-teal-800',
  lebih: 'text-amber-800',
  obesitas: 'text-rose-800',
};
const angka = (n: number) =>
  n.toLocaleString('id-ID', { maximumFractionDigits: 1 });

const faqs = [
  {
    q: 'Berapa BMI normal untuk orang Indonesia?',
    a: 'Menurut Pedoman Gizi Seimbang Kemenkes (Permenkes 41/2014), IMT normal dewasa adalah 18,5 sampai 25,0. WHO untuk populasi Asia-Pasifik memakai batas lebih ketat: 18,5 sampai 22,9.',
  },
  {
    q: 'Siapa yang tidak cocok memakai BMI?',
    a: 'BMI tidak berlaku untuk ibu hamil, anak dan remaja di bawah 18 tahun (memakai kurva pertumbuhan), serta atlet atau orang berotot besar karena otot lebih berat dari lemak.',
  },
  {
    q: 'Bagaimana rumus BMI?',
    a: 'BMI = berat badan (kg) dibagi kuadrat tinggi badan (m). Contoh: 70 kg dan 1,75 m: 70 / (1,75 x 1,75) = 22,9.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator BMI (IMT)"
    seo-title="Kalkulator BMI / IMT: Kategori Kemenkes dan WHO Asia"
    description="Hitung Indeks Massa Tubuh (BMI) dan lihat kategorinya menurut Kemenkes dan WHO Asia-Pasifik, plus rentang berat badan normal untuk tinggi Anda."
    application-category="HealthApplication"
    :faqs="faqs"
    :how-to="[
      'Isi berat badan (kg) dan tinggi badan (cm).',
      'Tekan Hitung BMI.',
      'Bandingkan kategori Kemenkes dan WHO Asia-Pasifik.',
    ]"
    :sources="SUMBER.imt"
    :checked-at="CHECKED_AT"
    :caveats="['Tidak untuk ibu hamil, anak di bawah 18 tahun, dan atlet.']"
    medical
  >
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent="hitung">
      <div>
        <label for="bmi-berat" class="field-label">Berat badan (kg)</label>
        <input
          id="bmi-berat"
          v-model.number="form.berat"
          type="number"
          min="1"
          step="0.1"
          inputmode="decimal"
          class="field-input"
        />
      </div>
      <div>
        <label for="bmi-tinggi" class="field-label">Tinggi badan (cm)</label>
        <input
          id="bmi-tinggi"
          v-model.number="form.tinggi"
          type="number"
          min="50"
          step="0.1"
          inputmode="decimal"
          class="field-input"
        />
      </div>
      <button type="submit" class="btn-primary sm:col-span-2">
        Hitung BMI
      </button>
    </form>
    <template v-if="hasil && kemenkes && who && normal">
      <HealthDisclaimer
        extra="BMI tidak berlaku untuk ibu hamil, anak, dan atlet."
      />
      <section class="card space-y-3" aria-live="polite">
        <p class="tabular text-3xl font-bold" :class="TONE[kemenkes.tone]">
          {{ angka(hasil.imt) }}
        </p>
        <p><strong>Kemenkes:</strong> {{ kemenkes.label }}</p>
        <p><strong>WHO Asia-Pasifik:</strong> {{ who.label }}</p>
        <p class="text-sm text-slate-600">
          Berat badan normal (IMT 18,5-25,0) untuk tinggi
          {{ angka(hasil.tinggi) }} cm: {{ angka(normal.min) }}-{{
            angka(normal.max)
          }}
          kg.
        </p>
        <ShareButton
          :tool-id="SLUG"
          :state="form"
          title="Hasil kalkulator BMI"
        />
      </section>
    </template>
    <section class="card">
      <h2 class="font-semibold">Kategori IMT Kemenkes (dewasa)</h2>
      <table class="tabular mt-2 w-full text-sm">
        <tbody>
          <tr
            v-for="(item, index) in IMT_KEMENKES"
            :key="item.label"
            class="border-t border-slate-100"
          >
            <td class="py-1">{{ item.label }}</td>
            <td class="py-1 text-right">
              {{
                index === 0
                  ? `< ${angka(IMT_KEMENKES[1]!.min)}`
                  : index === IMT_KEMENKES.length - 1
                    ? `> 27,0`
                    : `${angka(item.min)}-${angka(IMT_KEMENKES[index + 1]!.min - 0.1)}`
              }}
            </td>
          </tr>
        </tbody>
      </table>
    </section>
    <HealthLinks :current="SLUG" />
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
