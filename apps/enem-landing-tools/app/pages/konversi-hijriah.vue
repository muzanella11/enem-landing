<script setup lang="ts">
import { BULAN_HIJRIAH, dariHijriah, keHijriah } from '~/utils/tanggal';
import { MONTH_NAMES } from '~/utils/format';

const SLUG = 'konversi-hijriah';
const events = useToolEvents(SLUG);
const masehi = ref('');
const hijri = reactive({ tahun: 1448, bulan: 9, hari: 1 });
onMounted(() => {
  masehi.value = new Date().toISOString().slice(0, 10);
  const today = keHijriah(masehi.value);
  Object.assign(hijri, {
    tahun: today.tahun,
    bulan: today.bulan,
    hari: today.hari,
  });
});
const keH = computed(() => (masehi.value ? keHijriah(masehi.value) : null));
const keM = computed(() => dariHijriah(hijri.tahun, hijri.bulan, hijri.hari));
const formatMasehi = (iso: string) =>
  `${Number(iso.slice(8))} ${MONTH_NAMES[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
let tracked = false;
watch([masehi, () => ({ ...hijri })], () => {
  if (!tracked && masehi.value) {
    tracked = true;
    events.calculate();
  }
});
const faqs = [
  {
    q: 'Kalender Hijriah apa yang dipakai?',
    a: 'Kalender Umm al-Qura (dipakai Arab Saudi). Di Indonesia, awal bulan seperti Ramadan, Syawal, dan Zulhijah ditetapkan Kemenag lewat sidang isbat, sehingga bisa berbeda satu hari.',
  },
];
const howTo = [
  'Pilih tanggal Masehi untuk melihat tanggal Hijriahnya.',
  'Atau isi tanggal Hijriah untuk melihat tanggal Masehinya.',
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Konversi Tanggal Hijriah"
    seo-title="Konversi Tanggal Masehi ke Hijriah dan Sebaliknya"
    description="Ubah tanggal Masehi ke Hijriah dan sebaliknya, dengan nama bulan Hijriah dalam Bahasa Indonesia."
    application-category="LifestyleApplication"
    :faqs="faqs"
    :how-to="howTo"
    checked-at="2026-11-06"
    :caveats="[
      'Memakai kalender Umm al-Qura; penetapan Kemenag bisa berbeda satu hari.',
    ]"
  >
    <div class="grid gap-6 md:grid-cols-2">
      <section class="card space-y-3">
        <h2 class="font-semibold">Masehi ke Hijriah</h2>
        <label for="masehi" class="field-label">Tanggal Masehi</label>
        <input id="masehi" v-model="masehi" type="date" class="field-input" />
        <p
          v-if="keH"
          class="text-2xl font-bold text-primary"
          aria-live="polite"
        >
          {{ keH.hari }} {{ keH.namaBulan }} {{ keH.tahun }} H
        </p>
      </section>
      <section class="card space-y-3">
        <h2 class="font-semibold">Hijriah ke Masehi</h2>
        <div class="grid grid-cols-3 gap-2">
          <div>
            <label for="h-hari" class="field-hint">Tanggal</label>
            <input
              id="h-hari"
              v-model.number="hijri.hari"
              type="number"
              min="1"
              max="30"
              class="field-input"
            />
          </div>
          <div>
            <label for="h-bulan" class="field-hint">Bulan</label>
            <select
              id="h-bulan"
              v-model.number="hijri.bulan"
              class="field-input"
            >
              <option
                v-for="(nama, index) in BULAN_HIJRIAH"
                :key="nama"
                :value="index + 1"
              >
                {{ nama }}
              </option>
            </select>
          </div>
          <div>
            <label for="h-tahun" class="field-hint">Tahun H</label>
            <input
              id="h-tahun"
              v-model.number="hijri.tahun"
              type="number"
              min="1300"
              max="1600"
              class="field-input"
            />
          </div>
        </div>
        <p class="text-2xl font-bold text-primary" aria-live="polite">
          {{ keM ? formatMasehi(keM) : 'Tanggal tidak ada di bulan itu' }}
        </p>
      </section>
    </div>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
