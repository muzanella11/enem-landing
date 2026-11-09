<script setup lang="ts">
import { formatRupiah } from '~/utils/format';
import {
  formatDurasi,
  kecepatanDariJadwal,
  waktuKereta,
} from '~/utils/transportasi';

const SLUG = 'kalkulator-perjalanan-kereta';
const events = useToolEvents(SLUG);
const mode = ref<'waktu' | 'jadwal'>('waktu');
const form = reactive({
  jarak: 0,
  kmh: 70,
  berhenti: 0,
  menitBerhenti: 3,
  berangkat: '',
  tiba: '',
  hari: 0,
  literPerKm: 0,
  harga: 0,
  penumpang: 0,
});
const waktu = computed(() =>
  mode.value === 'waktu' && form.jarak > 0 && form.kmh > 0
    ? waktuKereta(form.jarak, form.kmh, form.berhenti, form.menitBerhenti)
    : null,
);
const jadwal = computed(() =>
  mode.value === 'jadwal' && form.jarak > 0 && form.berangkat && form.tiba
    ? kecepatanDariJadwal(form.jarak, form.berangkat, form.tiba, form.hari)
    : null,
);
const bbm = computed(() => {
  if (!(form.jarak > 0 && form.literPerKm > 0)) return null;
  const liter = form.jarak * form.literPerKm;
  const biaya = liter * form.harga;
  return {
    liter,
    biaya,
    perKm: biaya / form.jarak,
    perOrang: form.penumpang > 0 ? biaya / form.penumpang : null,
  };
});
const angka = (n: number, d = 1) =>
  n.toLocaleString('id-ID', { maximumFractionDigits: d });
let dicatat = false;
watch([waktu, jadwal], () => {
  if (!dicatat && (waktu.value || jadwal.value)) {
    dicatat = true;
    events.calculate(mode.value);
  }
});
const faqs = [
  {
    q: 'Bagaimana menghitung lama perjalanan kereta?',
    a: 'Waktu = jarak / kecepatan rata-rata, ditambah lama berhenti di stasiun. Kecepatan rata-rata kereta jauh lebih rendah dari kecepatan maksimal karena perlambatan, persilangan, dan berhenti.',
  },
  {
    q: 'Dari mana angka konsumsi BBM lokomotif?',
    a: 'Konsumsi lokomotif diesel sangat bergantung pada jenis lokomotif, jumlah kereta, dan lintasan. Isi angka liter per km dari data operator bila ada; kalkulator tidak memakai angka bawaan.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator Perjalanan Kereta"
    seo-title="Kalkulator Waktu Tempuh dan Kecepatan Rata-rata Kereta"
    description="Hitung lama perjalanan kereta dari jarak, kecepatan rata-rata, dan waktu berhenti di stasiun, atau kecepatan rata-rata dari jadwal, plus perkiraan konsumsi dan biaya BBM lokomotif."
    :faqs="faqs"
    application-category="UtilitiesApplication"
    checked-at="2026-11-06"
    :caveats="[
      'Bukan jadwal resmi. Cek jadwal dan harga tiket di kanal resmi operator kereta.',
    ]"
  >
    <section class="card space-y-4">
      <div class="flex flex-wrap gap-2" role="group" aria-label="Mode">
        <button
          type="button"
          class="btn-secondary"
          :aria-pressed="mode === 'waktu'"
          @click="mode = 'waktu'"
        >
          Hitung waktu tempuh
        </button>
        <button
          type="button"
          class="btn-secondary"
          :aria-pressed="mode === 'jadwal'"
          @click="mode = 'jadwal'"
        >
          Kecepatan dari jadwal
        </button>
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <label for="ka-jarak" class="field-label">Jarak (km)</label
          ><input
            id="ka-jarak"
            v-model.number="form.jarak"
            type="number"
            min="0"
            step="any"
            class="field-input"
          />
        </div>
        <template v-if="mode === 'waktu'">
          <div>
            <label for="ka-kmh" class="field-label"
              >Kecepatan rata-rata (km/jam)</label
            ><input
              id="ka-kmh"
              v-model.number="form.kmh"
              type="number"
              min="0"
              step="any"
              class="field-input"
            />
          </div>
          <div>
            <label for="ka-berhenti" class="field-label">Jumlah berhenti</label
            ><input
              id="ka-berhenti"
              v-model.number="form.berhenti"
              type="number"
              min="0"
              class="field-input"
            />
          </div>
          <div>
            <label for="ka-menit" class="field-label"
              >Lama tiap berhenti (menit)</label
            ><input
              id="ka-menit"
              v-model.number="form.menitBerhenti"
              type="number"
              min="0"
              class="field-input"
            />
          </div>
        </template>
        <template v-else>
          <div>
            <label for="ka-berangkat" class="field-label">Jam berangkat</label
            ><input
              id="ka-berangkat"
              v-model="form.berangkat"
              type="time"
              class="field-input"
            />
          </div>
          <div>
            <label for="ka-tiba" class="field-label">Jam tiba</label
            ><input
              id="ka-tiba"
              v-model="form.tiba"
              type="time"
              class="field-input"
            />
          </div>
          <div>
            <label for="ka-hari" class="field-label"
              >Tiba berapa hari kemudian</label
            ><input
              id="ka-hari"
              v-model.number="form.hari"
              type="number"
              min="0"
              class="field-input"
            />
          </div>
        </template>
      </div>
      <details class="text-sm">
        <summary class="cursor-pointer font-medium">
          BBM lokomotif (opsional)
        </summary>
        <div class="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <label for="ka-lpk" class="field-label"
              >Konsumsi (liter per km)</label
            ><input
              id="ka-lpk"
              v-model.number="form.literPerKm"
              type="number"
              min="0"
              step="any"
              class="field-input"
            />
          </div>
          <RupiahInput
            id="ka-harga"
            v-model="form.harga"
            label="Harga solar per liter"
          />
          <div>
            <label for="ka-penumpang" class="field-label"
              >Jumlah penumpang</label
            ><input
              id="ka-penumpang"
              v-model.number="form.penumpang"
              type="number"
              min="0"
              class="field-input"
            />
          </div>
        </div>
      </details>
    </section>
    <section v-if="waktu || jadwal" class="card space-y-2" aria-live="polite">
      <template v-if="waktu !== null">
        <p class="text-sm text-slate-600">Perkiraan waktu tempuh</p>
        <p class="tabular text-3xl font-bold text-primary">
          {{ formatDurasi(waktu) }}
        </p>
      </template>
      <template v-else-if="jadwal">
        <p class="text-sm text-slate-600">
          Kecepatan rata-rata ({{ formatDurasi(jadwal.jam) }})
        </p>
        <p class="tabular text-3xl font-bold text-primary">
          {{ angka(jadwal.kmh) }} km/jam
        </p>
      </template>
      <p v-if="bbm" class="tabular text-sm">
        BBM {{ angka(bbm.liter) }} liter · biaya {{ formatRupiah(bbm.biaya) }} ·
        {{ formatRupiah(bbm.perKm) }} per km<template
          v-if="bbm.perOrang !== null"
        >
          · {{ formatRupiah(bbm.perOrang) }} per penumpang</template
        >
      </p>
    </section>
    <nav class="flex flex-wrap gap-4">
      <NuxtLink to="/kalkulator-kecepatan" class="btn-link"
        >Jarak, waktu, kecepatan</NuxtLink
      ><NuxtLink to="/libur-nasional" class="btn-link">Libur nasional</NuxtLink>
    </nav>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
