<script setup lang="ts">
import { nilaiAkhir, nilaiDibutuhkan, type Komponen } from '~/utils/teks';

const SLUG = 'kalkulator-nilai-rapor';
const events = useToolEvents(SLUG);
const komponen = ref<Komponen[]>([
  { nama: 'Tugas', bobot: 30, nilai: null },
  { nama: 'UTS', bobot: 30, nilai: null },
  { nama: 'UAS', bobot: 40, nilai: null },
]);
const target = ref(75);
const totalBobot = computed(() =>
  komponen.value.reduce((s, k) => s + (Number(k.bobot) || 0), 0),
);
const akhir = computed(() => nilaiAkhir(komponen.value));
const perlu = computed(() =>
  nilaiDibutuhkan(komponen.value, Number(target.value)),
);
const adaKosong = computed(() =>
  komponen.value.some((k) => k.nilai === null || (k.nilai as unknown) === ''),
);
let dicatat = false;
watch(
  komponen,
  () => {
    if (!dicatat && komponen.value.some((k) => k.nilai !== null)) {
      dicatat = true;
      events.calculate();
    }
  },
  { deep: true },
);
const angka = (n: number) =>
  n.toLocaleString('id-ID', { maximumFractionDigits: 2 });
const faqs = [
  {
    q: 'Bagaimana nilai akhir dihitung?',
    a: 'Rata-rata tertimbang: setiap nilai dikali bobotnya, dijumlahkan, lalu dibagi total bobot.',
  },
  {
    q: 'Bagaimana menghitung nilai UAS yang dibutuhkan?',
    a: 'Kosongkan nilai komponen yang belum ada, isi target. Kalkulator menghitung nilai minimal yang harus didapat di komponen itu.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator Nilai Rapor"
    seo-title="Kalkulator Nilai Akhir dan Nilai UAS yang Dibutuhkan"
    description="Hitung nilai akhir dari tugas, UTS, UAS, dan praktik dengan bobot bebas, serta nilai minimal yang dibutuhkan untuk mencapai target."
    :faqs="faqs"
    application-category="EducationalApplication"
    checked-at="2026-11-06"
  >
    <section class="card space-y-2">
      <div
        v-for="(k, i) in komponen"
        :key="i"
        class="grid grid-cols-[1fr_5rem_5rem_2rem] gap-2"
      >
        <input
          v-model="k.nama"
          :aria-label="`Nama komponen ${i + 1}`"
          class="field-input"
        />
        <input
          v-model.number="k.bobot"
          type="number"
          min="0"
          :aria-label="`Bobot ${k.nama} (%)`"
          placeholder="Bobot"
          class="field-input"
        />
        <input
          :value="k.nilai ?? ''"
          type="number"
          min="0"
          max="100"
          :aria-label="`Nilai ${k.nama}`"
          placeholder="Nilai"
          class="field-input"
          @input="
            k.nilai =
              ($event.target as HTMLInputElement).value === ''
                ? null
                : Number(($event.target as HTMLInputElement).value)
          "
        />
        <button
          type="button"
          class="btn-remove"
          :aria-label="`Hapus ${k.nama}`"
          @click="komponen.splice(i, 1)"
        >
          ✕
        </button>
      </div>
      <button
        type="button"
        class="btn-link"
        @click="
          komponen.push({
            nama: `Komponen ${komponen.length + 1}`,
            bobot: 0,
            nilai: null,
          })
        "
      >
        + Komponen
      </button>
      <p v-if="totalBobot !== 100" class="text-xs text-amber-800">
        Total bobot {{ totalBobot }}% (bobot dinormalkan otomatis).
      </p>
      <label for="rapor-target" class="field-label">Target nilai akhir</label>
      <input
        id="rapor-target"
        v-model.number="target"
        type="number"
        min="0"
        max="100"
        class="field-input max-w-[8rem]"
      />
    </section>
    <section class="card space-y-2" aria-live="polite">
      <p class="text-sm text-slate-600">
        Nilai akhir {{ adaKosong ? 'sementara (komponen terisi)' : '' }}
      </p>
      <p class="tabular text-3xl font-bold text-primary">{{ angka(akhir) }}</p>
      <p v-if="adaKosong && perlu !== null">
        <template v-if="perlu <= 0"
          >Target sudah tercapai berapa pun nilai komponen yang
          kosong.</template
        >
        <template v-else-if="perlu > 100"
          >Target {{ target }} tidak bisa dicapai (butuh
          {{ angka(perlu) }}).</template
        >
        <template v-else
          >Butuh nilai minimal <strong>{{ angka(perlu) }}</strong> di komponen
          yang belum terisi.</template
        >
      </p>
    </section>
    <NuxtLink to="/kalkulator-ipk" class="btn-link">Kalkulator IPK</NuxtLink>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
