<script setup lang="ts">
import { HARGA_BBM_SUMBER } from '~/data/bbm/harga';
import { formatRupiah } from '~/utils/format';
import {
  biayaPerjalanan,
  jarakTempuh,
  kmPerLiter,
  literDariRupiah,
  literPer100Km,
} from '~/utils/transportasi';

const SLUG = 'kalkulator-bbm';
const events = useToolEvents(SLUG);
const mode = ref<'biaya' | 'konsumsi' | 'jarak'>('biaya');
const form = reactive({
  harga: 0,
  jarak: 0,
  kmpl: 12,
  pulangPergi: false,
  penumpang: 1,
  liter: 0,
  tangki: 0,
  rupiah: 0,
  cadangan: 10,
  sumber: 'tangki' as 'tangki' | 'rupiah',
});
const angka = (n: number, d = 1) =>
  n.toLocaleString('id-ID', { maximumFractionDigits: d });
onMounted(() => {
  const shared = useSharedState<typeof form & { mode: typeof mode.value }>(
    SLUG,
  );
  if (shared) {
    Object.assign(form, shared);
    mode.value = shared.mode ?? 'biaya';
  }
});
const biaya = computed(() =>
  form.jarak > 0 && form.kmpl > 0
    ? biayaPerjalanan({
        jarakKm: form.jarak,
        kmpl: form.kmpl,
        hargaPerLiter: form.harga,
        pulangPergi: form.pulangPergi,
        penumpang: form.penumpang,
      })
    : null,
);
const konsumsi = computed(() =>
  form.jarak > 0 && form.liter > 0 ? kmPerLiter(form.jarak, form.liter) : null,
);
const jarak = computed(() => {
  const liter =
    form.sumber === 'tangki'
      ? form.tangki
      : literDariRupiah(form.rupiah, form.harga);
  return liter > 0 && form.kmpl > 0
    ? {
        liter,
        km: jarakTempuh(liter, form.kmpl, form.cadangan),
        biayaPenuh: form.tangki * form.harga,
      }
    : null;
});
let dicatat = false;
watch([biaya, konsumsi, jarak], () => {
  if (!dicatat && (biaya.value || konsumsi.value || jarak.value)) {
    dicatat = true;
    events.calculate(mode.value);
  }
});
const shareState = computed(() => ({ ...form, mode: mode.value }));
const faqs = [
  {
    q: 'Bagaimana cara menghitung konsumsi BBM yang akurat?',
    a: 'Pakai metode full to full: isi tangki sampai penuh, catat odometer, berkendara seperti biasa, lalu isi penuh lagi. Jarak sejak pengisian pertama dibagi liter pengisian kedua adalah km per liter.',
  },
  {
    q: 'Berapa biaya bensin untuk perjalanan jauh?',
    a: 'Liter yang dibutuhkan = jarak / konsumsi (km per liter), lalu dikali harga per liter. Contoh: 300 km dengan konsumsi 12 km/liter butuh 25 liter; dengan Pertalite Rp10.000 biayanya Rp250.000.',
  },
  {
    q: 'Apa beda km/liter dan liter/100 km?',
    a: 'Keduanya ukuran efisiensi. 12,5 km/liter sama dengan 8 liter per 100 km (100 dibagi 12,5).',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator BBM"
    seo-title="Kalkulator BBM: Konsumsi, Biaya Bensin Perjalanan, dan Jarak Tempuh"
    description="Hitung konsumsi BBM (km/liter), biaya bensin atau solar untuk perjalanan dengan harga Pertamina per provinsi, dan jarak yang bisa ditempuh dari isi tangki atau sejumlah rupiah."
    :faqs="faqs"
    application-category="UtilitiesApplication"
    :sources="[HARGA_BBM_SUMBER]"
    :checked-at="HARGA_BBM_SUMBER.checkedAt"
    :caveats="[
      'Konsumsi sebenarnya dipengaruhi kecepatan, beban, AC, dan kondisi jalan.',
    ]"
  >
    <section class="card space-y-4">
      <div class="flex flex-wrap gap-2" role="group" aria-label="Mode">
        <button
          type="button"
          class="btn-secondary"
          :aria-pressed="mode === 'biaya'"
          @click="mode = 'biaya'"
        >
          Biaya perjalanan
        </button>
        <button
          type="button"
          class="btn-secondary"
          :aria-pressed="mode === 'konsumsi'"
          @click="mode = 'konsumsi'"
        >
          Hitung konsumsi
        </button>
        <button
          type="button"
          class="btn-secondary"
          :aria-pressed="mode === 'jarak'"
          @click="mode = 'jarak'"
        >
          Jarak tempuh
        </button>
      </div>
      <HargaBbmPicker v-model="form.harga" />
      <div class="grid gap-3 sm:grid-cols-3">
        <div v-if="mode !== 'jarak'">
          <label for="bbm-jarak" class="field-label">Jarak (km)</label>
          <input
            id="bbm-jarak"
            v-model.number="form.jarak"
            type="number"
            min="0"
            step="any"
            class="field-input"
          />
        </div>
        <div v-if="mode === 'konsumsi'">
          <label for="bbm-liter" class="field-label">Liter yang diisi</label>
          <input
            id="bbm-liter"
            v-model.number="form.liter"
            type="number"
            min="0"
            step="any"
            class="field-input"
          />
        </div>
        <div v-if="mode !== 'konsumsi'">
          <label for="bbm-kmpl" class="field-label"
            >Konsumsi (km per liter)</label
          >
          <input
            id="bbm-kmpl"
            v-model.number="form.kmpl"
            type="number"
            min="0"
            step="any"
            class="field-input"
          />
        </div>
        <template v-if="mode === 'biaya'">
          <div>
            <label for="bbm-penumpang" class="field-label"
              >Jumlah orang (patungan)</label
            >
            <input
              id="bbm-penumpang"
              v-model.number="form.penumpang"
              type="number"
              min="1"
              class="field-input"
            />
          </div>
          <label class="flex items-center gap-2 text-sm"
            ><input v-model="form.pulangPergi" type="checkbox" /> Pulang
            pergi</label
          >
        </template>
        <template v-if="mode === 'jarak'">
          <fieldset class="text-sm">
            <legend class="field-label">Bahan bakar</legend>
            <label class="mr-3"
              ><input v-model="form.sumber" type="radio" value="tangki" /> Isi
              tangki (liter)</label
            >
            <label
              ><input v-model="form.sumber" type="radio" value="rupiah" /> Beli
              rupiah</label
            >
          </fieldset>
          <div v-if="form.sumber === 'tangki'">
            <label for="bbm-tangki" class="field-label"
              >Isi tangki (liter)</label
            >
            <input
              id="bbm-tangki"
              v-model.number="form.tangki"
              type="number"
              min="0"
              step="any"
              class="field-input"
            />
          </div>
          <RupiahInput
            v-else
            id="bbm-rupiah"
            v-model="form.rupiah"
            label="Beli BBM senilai"
          />
          <div>
            <label for="bbm-cadangan" class="field-label"
              >Sisakan cadangan (%)</label
            >
            <input
              id="bbm-cadangan"
              v-model.number="form.cadangan"
              type="number"
              min="0"
              max="50"
              class="field-input"
            />
          </div>
        </template>
      </div>
    </section>
    <section
      v-if="mode === 'biaya' && biaya"
      class="card space-y-2"
      aria-live="polite"
    >
      <p class="text-sm text-slate-600">
        Biaya BBM {{ form.pulangPergi ? 'pulang pergi' : 'sekali jalan' }}
      </p>
      <p class="tabular text-3xl font-bold text-teal-800">
        {{ formatRupiah(biaya.biaya) }}
      </p>
      <p class="tabular text-sm">
        {{ angka(biaya.liter) }} liter untuk {{ angka(biaya.jarakKm, 0) }} km ·
        {{ formatRupiah(biaya.biayaPerKm) }} per km<template
          v-if="form.penumpang > 1"
        >
          · {{ formatRupiah(biaya.biayaPerOrang) }} per orang</template
        >
      </p>
      <ShareButton
        :tool-id="SLUG"
        :state="shareState"
        title="Biaya BBM perjalanan"
      />
    </section>
    <section
      v-if="mode === 'konsumsi' && konsumsi"
      class="card space-y-2"
      aria-live="polite"
    >
      <p class="text-sm text-slate-600">Konsumsi BBM</p>
      <p class="tabular text-3xl font-bold text-teal-800">
        {{ angka(konsumsi) }} km/liter
      </p>
      <p class="tabular text-sm">
        {{ angka(literPer100Km(konsumsi), 2) }} liter per 100 km · biaya
        {{ formatRupiah(form.harga / konsumsi) }} per km · total
        {{ formatRupiah(form.liter * form.harga) }}
      </p>
    </section>
    <section
      v-if="mode === 'jarak' && jarak"
      class="card space-y-2"
      aria-live="polite"
    >
      <p class="text-sm text-slate-600">
        Jarak yang bisa ditempuh (cadangan {{ form.cadangan }}%)
      </p>
      <p class="tabular text-3xl font-bold text-teal-800">
        {{ angka(jarak.km, 0) }} km
      </p>
      <p class="tabular text-sm">
        {{ angka(jarak.liter) }} liter<template
          v-if="form.sumber === 'tangki' && form.tangki"
        >
          · biaya isi penuh {{ formatRupiah(jarak.biayaPenuh) }}</template
        >
      </p>
    </section>
    <nav class="flex flex-wrap gap-4">
      <NuxtLink to="/kalkulator-kecepatan" class="btn-link"
        >Jarak, waktu, kecepatan</NuxtLink
      >
      <NuxtLink to="/kalkulator-patungan" class="btn-link">Patungan</NuxtLink>
      <NuxtLink to="/libur-nasional" class="btn-link">Libur nasional</NuxtLink>
      <NuxtLink to="/kalkulator-pajak-kendaraan" class="btn-link"
        >Pajak kendaraan</NuxtLink
      >
    </nav>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
