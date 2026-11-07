<script setup lang="ts">
import {
  formatDurasi,
  jamTiba,
  jarakWaktuKecepatan,
  JARAK_KE_KM,
  KECEPATAN_KE_KMH,
  ZONA,
  type SatuanJarak,
  type SatuanKecepatan,
  type Zona,
} from '~/utils/transportasi';

const SLUG = 'kalkulator-kecepatan';
const events = useToolEvents(SLUG);
const cari = ref<'waktu' | 'kecepatan' | 'jarak'>('waktu');
const form = reactive({
  jarak: 0,
  satuanJarak: 'km' as SatuanJarak,
  jam: 0,
  menit: 0,
  kecepatan: 60,
  satuanKecepatan: 'kmh' as SatuanKecepatan,
  berangkat: '',
  zonaBerangkat: 'WIB' as Zona,
  zonaTiba: 'WIB' as Zona,
});
const LABEL_KEC = {
  kmh: 'km/jam',
  ms: 'm/detik',
  mph: 'mil/jam',
  knot: 'knot',
};
const LABEL_JARAK = { km: 'km', mil: 'mil', nm: 'mil laut' };
const hasil = computed(() => {
  const jarakKm = form.jarak * JARAK_KE_KM[form.satuanJarak];
  const jam = form.jam + form.menit / 60;
  const kmh = form.kecepatan * KECEPATAN_KE_KMH[form.satuanKecepatan];
  if (cari.value === 'waktu')
    return jarakKm > 0 && kmh > 0
      ? jarakWaktuKecepatan({ jarakKm, kmh })
      : null;
  if (cari.value === 'kecepatan')
    return jarakKm > 0 && jam > 0
      ? jarakWaktuKecepatan({ jarakKm, jam })
      : null;
  return jam > 0 && kmh > 0 ? jarakWaktuKecepatan({ jam, kmh }) : null;
});
const tiba = computed(() =>
  hasil.value && form.berangkat
    ? jamTiba(
        form.berangkat,
        form.zonaBerangkat,
        hasil.value.jam,
        form.zonaTiba,
      )
    : null,
);
const angka = (n: number) =>
  n.toLocaleString('id-ID', { maximumFractionDigits: 2 });
let dicatat = false;
watch(hasil, (v) => {
  if (v && !dicatat) {
    dicatat = true;
    events.calculate(cari.value);
  }
});
const faqs = [
  {
    q: '300 km berapa jam?',
    a: 'Waktu = jarak / kecepatan. Pada kecepatan rata-rata 60 km/jam, 300 km butuh 5 jam; pada 80 km/jam sekitar 3 jam 45 menit, belum termasuk istirahat.',
  },
  {
    q: '1 knot berapa km/jam?',
    a: '1 knot = 1 mil laut per jam = 1,852 km/jam.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator Jarak, Waktu, dan Kecepatan"
    seo-title="Kalkulator Kecepatan, Jarak, dan Waktu Tempuh (km/jam, knot)"
    description="Hitung waktu tempuh, kecepatan rata-rata, atau jarak dari dua data lainnya, dalam km/jam, mil, knot, dan mil laut, plus perkiraan jam tiba lintas WIB, WITA, WIT."
    :faqs="faqs"
    application-category="UtilitiesApplication"
    checked-at="2026-11-06"
  >
    <section class="card space-y-4">
      <div class="flex flex-wrap gap-2" role="group" aria-label="Yang dicari">
        <button
          type="button"
          class="btn-secondary"
          :aria-pressed="cari === 'waktu'"
          @click="cari = 'waktu'"
        >
          Cari waktu
        </button>
        <button
          type="button"
          class="btn-secondary"
          :aria-pressed="cari === 'kecepatan'"
          @click="cari = 'kecepatan'"
        >
          Cari kecepatan
        </button>
        <button
          type="button"
          class="btn-secondary"
          :aria-pressed="cari === 'jarak'"
          @click="cari = 'jarak'"
        >
          Cari jarak
        </button>
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        <div v-if="cari !== 'jarak'" class="flex gap-2">
          <div class="flex-1">
            <label for="kec-jarak" class="field-label">Jarak</label
            ><input
              id="kec-jarak"
              v-model.number="form.jarak"
              type="number"
              min="0"
              step="any"
              class="field-input"
            />
          </div>
          <div>
            <label for="kec-sj" class="field-label">Satuan</label
            ><select id="kec-sj" v-model="form.satuanJarak" class="field-input">
              <option v-for="(l, k) in LABEL_JARAK" :key="k" :value="k">
                {{ l }}
              </option>
            </select>
          </div>
        </div>
        <div v-if="cari !== 'kecepatan'" class="flex gap-2">
          <div class="flex-1">
            <label for="kec-kecepatan" class="field-label"
              >Kecepatan rata-rata</label
            ><input
              id="kec-kecepatan"
              v-model.number="form.kecepatan"
              type="number"
              min="0"
              step="any"
              class="field-input"
            />
          </div>
          <div>
            <label for="kec-sk" class="field-label">Satuan</label
            ><select
              id="kec-sk"
              v-model="form.satuanKecepatan"
              class="field-input"
            >
              <option v-for="(l, k) in LABEL_KEC" :key="k" :value="k">
                {{ l }}
              </option>
            </select>
          </div>
        </div>
        <div v-if="cari !== 'waktu'" class="flex gap-2">
          <div>
            <label for="kec-jam" class="field-label">Jam</label
            ><input
              id="kec-jam"
              v-model.number="form.jam"
              type="number"
              min="0"
              class="field-input"
            />
          </div>
          <div>
            <label for="kec-menit" class="field-label">Menit</label
            ><input
              id="kec-menit"
              v-model.number="form.menit"
              type="number"
              min="0"
              max="59"
              class="field-input"
            />
          </div>
        </div>
      </div>
      <div class="grid gap-3 sm:grid-cols-3">
        <div>
          <label for="kec-berangkat" class="field-label"
            >Jam berangkat (opsional)</label
          ><input
            id="kec-berangkat"
            v-model="form.berangkat"
            type="time"
            class="field-input"
          />
        </div>
        <div>
          <label for="kec-zb" class="field-label">Zona berangkat</label
          ><select id="kec-zb" v-model="form.zonaBerangkat" class="field-input">
            <option v-for="(_, z) in ZONA" :key="z" :value="z">{{ z }}</option>
          </select>
        </div>
        <div>
          <label for="kec-zt" class="field-label">Zona tiba</label
          ><select id="kec-zt" v-model="form.zonaTiba" class="field-input">
            <option v-for="(_, z) in ZONA" :key="z" :value="z">{{ z }}</option>
          </select>
        </div>
      </div>
    </section>
    <section v-if="hasil" class="card space-y-2" aria-live="polite">
      <p
        v-if="cari === 'waktu'"
        class="tabular text-3xl font-bold text-teal-800"
      >
        {{ formatDurasi(hasil.jam) }}
      </p>
      <p
        v-else-if="cari === 'kecepatan'"
        class="tabular text-3xl font-bold text-teal-800"
      >
        {{ angka(hasil.kmh) }} km/jam
      </p>
      <p v-else class="tabular text-3xl font-bold text-teal-800">
        {{ angka(hasil.jarakKm) }} km
      </p>
      <p class="tabular text-sm">
        {{ angka(hasil.jarakKm) }} km · {{ angka(hasil.kmh) }} km/jam ({{
          angka(hasil.kmh / KECEPATAN_KE_KMH.knot)
        }}
        knot, {{ angka(hasil.kmh / 3.6) }} m/detik) ·
        {{ formatDurasi(hasil.jam) }}
      </p>
      <p v-if="tiba" class="text-sm">
        Perkiraan tiba pukul <strong>{{ tiba.jam }} {{ form.zonaTiba }}</strong
        ><template v-if="tiba.hariKemudian">
          ({{ tiba.hariKemudian }} hari kemudian)</template
        >
      </p>
    </section>
    <nav class="flex flex-wrap gap-4">
      <NuxtLink to="/kalkulator-bbm" class="btn-link">Kalkulator BBM</NuxtLink
      ><NuxtLink to="/konversi-satuan" class="btn-link"
        >Konversi satuan</NuxtLink
      >
    </nav>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
