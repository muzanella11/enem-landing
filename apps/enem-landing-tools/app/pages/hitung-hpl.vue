<script setup lang="ts">
import { CHECKED_AT, SUMBER, TONGGAK_KEHAMILAN } from '~/data/kesehatan';
import { hitungHpl } from '~/utils/kesehatan';
import { formatTanggal } from '~/utils/surat/format';

const SLUG = 'hitung-hpl';
const events = useToolEvents(SLUG);
const form = reactive({ hpht: '', siklus: 28 });
const hariIni = ref('');
const hasil = ref<ReturnType<typeof hitungHpl> | null>(null);

onMounted(() => {
  hariIni.value = new Date().toLocaleDateString('sv-SE');
  const shared = useSharedState<typeof form>(SLUG);
  if (shared) {
    Object.assign(form, shared);
    hitung();
  }
});
const hitung = () => {
  if (!form.hpht) return;
  const siklus = Math.min(45, Math.max(21, Number(form.siklus) || 28));
  form.siklus = siklus;
  hasil.value = hitungHpl(form.hpht, siklus, hariIni.value || undefined);
  events.calculate(siklus === 28 ? '28' : 'koreksi');
};
const faqs = [
  {
    q: 'Bagaimana cara menghitung HPL?',
    a: 'Dengan aturan Naegele: hari pertama haid terakhir (HPHT) ditambah 280 hari (40 minggu). Bila siklus haid teratur tetapi tidak 28 hari, HPL digeser sebanyak selisihnya, mis. siklus 32 hari: tambah 4 hari.',
  },
  {
    q: 'Seberapa akurat HPL?',
    a: 'HPL hanyalah perkiraan; hanya sebagian kecil bayi lahir tepat di HPL. USG di trimester pertama memberi perkiraan usia kehamilan yang lebih akurat, dan dokter/bidan biasanya memakai hasil USG bila berbeda jauh.',
  },
  {
    q: 'Bagaimana pembagian trimester?',
    a: 'Trimester 1 sampai minggu 13 hari ke-6, trimester 2 minggu 14 sampai 27, trimester 3 mulai minggu 28 sampai persalinan.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Hitung HPL Kehamilan"
    seo-title="Hitung HPL (Hari Perkiraan Lahir) dan Usia Kehamilan"
    description="Hitung hari perkiraan lahir (HPL) dari HPHT dengan aturan Naegele, termasuk koreksi siklus haid, usia kehamilan dalam minggu, dan trimester."
    application-category="HealthApplication"
    :faqs="faqs"
    :how-to="[
      'Isi hari pertama haid terakhir (HPHT).',
      'Isi panjang siklus haid bila tidak 28 hari.',
      'Tekan Hitung HPL.',
    ]"
    :sources="SUMBER.hpl"
    :checked-at="CHECKED_AT"
    medical
  >
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent="hitung">
      <div>
        <label for="hpl-hpht" class="field-label"
          >Hari pertama haid terakhir (HPHT)</label
        >
        <input
          id="hpl-hpht"
          v-model="form.hpht"
          type="date"
          class="field-input"
        />
      </div>
      <div>
        <label for="hpl-siklus" class="field-label"
          >Panjang siklus haid (hari)</label
        >
        <input
          id="hpl-siklus"
          v-model.number="form.siklus"
          type="number"
          min="21"
          max="45"
          class="field-input"
        />
      </div>
      <button type="submit" class="btn-primary sm:col-span-2">
        Hitung HPL
      </button>
    </form>
    <template v-if="hasil">
      <HealthDisclaimer
        extra="Pastikan usia kehamilan dengan pemeriksaan USG oleh dokter atau bidan."
      />
      <section class="card space-y-3" aria-live="polite">
        <p class="text-sm text-slate-600">Hari perkiraan lahir</p>
        <p class="text-3xl font-bold text-teal-800">
          {{ formatTanggal(hasil.hpl, true) }}
        </p>
        <p v-if="hasil.usia">
          Usia kehamilan hari ini:
          <strong
            >{{ hasil.usia.minggu }} minggu {{ hasil.usia.hari }} hari</strong
          >
          (trimester {{ hasil.trimester }}),
          <template v-if="hasil.sisaHari > 0"
            >{{ hasil.sisaHari }} hari lagi menuju HPL.</template
          >
          <template v-else
            >HPL sudah lewat {{ -hasil.sisaHari }} hari.</template
          >
        </p>
        <p class="text-sm text-slate-600">
          Perkiraan pembuahan sekitar {{ formatTanggal(hasil.konsepsi) }}.
        </p>
        <ShareButton :tool-id="SLUG" :state="form" title="Hasil hitung HPL" />
      </section>
    </template>
    <section class="card">
      <h2 class="font-semibold">Tonggak umum kehamilan</h2>
      <ul class="mt-2 space-y-1 text-sm">
        <li v-for="item in TONGGAK_KEHAMILAN" :key="item.minggu">
          <strong>Minggu {{ item.minggu }}:</strong> {{ item.teks }}
        </li>
      </ul>
    </section>
    <HealthLinks :current="SLUG" />
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
