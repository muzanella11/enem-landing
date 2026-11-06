<script setup lang="ts">
import { KEMENAG_PARAMS } from '~/data/sholat/kemenag';
import { arahKiblat } from '~/utils/sholat';
import { findKota, kotaTerdekat } from '~/utils/sholat/kota';
import { KOTA } from '~/data/sholat/kota';

const SLUG = 'arah-kiblat';
const events = useToolEvents(SLUG);
const route = useRoute();

const posisi = ref<{ lat: number; lon: number; label: string } | null>(null);
const pilihKota = (slug: string) => {
  const kota = findKota(slug);
  if (kota) posisi.value = { lat: kota.lat, lon: kota.lon, label: kota.nama };
};
pilihKota((route.query['kota'] as string) ?? 'kota-jakarta-pusat');

const derajat = computed(() =>
  posisi.value ? arahKiblat(posisi.value.lat, posisi.value.lon) : 0,
);
const heading = ref<number | null>(null);
const compassError = ref('');
const locating = ref(false);

const pakaiLokasi = () => {
  if (!navigator.geolocation) return;
  locating.value = true;
  navigator.geolocation.getCurrentPosition(
    (position) => {
      locating.value = false;
      const { latitude, longitude } = position.coords;
      posisi.value = {
        lat: latitude,
        lon: longitude,
        label: `dekat ${kotaTerdekat(latitude, longitude).nama}`,
      };
      events.calculate('lokasi');
    },
    () => {
      locating.value = false;
    },
    { timeout: 10_000 },
  );
};

type OrientationEvent = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
};
const onOrientation = (event: OrientationEvent) => {
  if (typeof event.webkitCompassHeading === 'number')
    heading.value = event.webkitCompassHeading;
  else if (event.absolute && event.alpha !== null)
    heading.value = (360 - event.alpha) % 360;
};
const aktifkanKompas = async () => {
  compassError.value = '';
  const ctor = DeviceOrientationEvent as unknown as {
    requestPermission?: () => Promise<string>;
  };
  try {
    if (
      typeof ctor.requestPermission === 'function' &&
      (await ctor.requestPermission()) !== 'granted'
    ) {
      compassError.value = 'Izin kompas ditolak.';
      return;
    }
    window.addEventListener(
      'deviceorientationabsolute',
      onOrientation as EventListener,
    );
    window.addEventListener(
      'deviceorientation',
      onOrientation as EventListener,
    );
    events.calculate('kompas');
  } catch {
    compassError.value = 'Perangkat ini tidak menyediakan kompas.';
  }
};
onBeforeUnmount(() => {
  window.removeEventListener(
    'deviceorientationabsolute',
    onOrientation as EventListener,
  );
  window.removeEventListener(
    'deviceorientation',
    onOrientation as EventListener,
  );
});

const panah = computed(() =>
  heading.value === null ? derajat.value : derajat.value - heading.value,
);

const faqs = [
  {
    q: 'Bagaimana arah kiblat dihitung?',
    a: "Dengan rumus lingkaran besar (great circle) dari posisimu ke Ka'bah di Makkah. Hasilnya derajat dari utara sejati, searah jarum jam.",
  },
  {
    q: 'Kenapa kompas di HP bisa meleset?',
    a: 'Kompas HP terpengaruh benda logam dan medan magnet di sekitar, dan menunjuk utara magnetis. Kalibrasi kompas dengan menggerakkan HP membentuk angka 8, dan cocokkan dengan arah kiblat masjid terdekat.',
  },
];
const howTo = [
  'Pilih kotamu atau pakai lokasi perangkat.',
  'Lihat sudut kiblat dari arah utara.',
  'Di HP, aktifkan kompas lalu putar badan sampai panah menunjuk ke atas.',
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Arah Kiblat"
    seo-title="Arah Kiblat dari Lokasimu (Kompas Online)"
    description="Cari arah kiblat dari kota atau lokasimu di Indonesia: sudut dari utara dan kompas di HP. Lokasi tidak dikirim ke server."
    application-category="LifestyleApplication"
    :faqs="faqs"
    :how-to="howTo"
    :sources="KEMENAG_PARAMS.sources"
    :checked-at="KEMENAG_PARAMS.checkedAt"
  >
    <section class="card space-y-4">
      <div class="flex flex-wrap items-end gap-2">
        <div class="grow">
          <label for="kota-kiblat" class="field-label">Kota</label>
          <select
            id="kota-kiblat"
            class="field-input"
            @change="pilihKota(($event.target as HTMLSelectElement).value)"
          >
            <option
              v-for="kota in KOTA"
              :key="kota.slug"
              :value="kota.slug"
              :selected="posisi?.label === kota.nama"
            >
              {{ kota.nama }} ({{ kota.provinsi }})
            </option>
          </select>
        </div>
        <button
          type="button"
          class="btn-secondary"
          :disabled="locating"
          @click="pakaiLokasi"
        >
          {{ locating ? 'Mencari...' : 'Pakai lokasiku' }}
        </button>
      </div>
      <div class="flex flex-col items-center gap-3 py-4" aria-live="polite">
        <div
          class="relative h-56 w-56 rounded-full border-4 border-slate-200 bg-white"
        >
          <span
            class="absolute left-1/2 top-1 -translate-x-1/2 text-xs font-bold text-slate-500"
            >U</span
          >
          <div
            class="absolute inset-0 flex items-center justify-center transition-transform"
            :style="{ transform: `rotate(${panah}deg)` }"
          >
            <div class="h-24 w-2 -translate-y-10 rounded-full bg-teal-700" />
          </div>
        </div>
        <p class="tabular text-3xl font-bold text-teal-800">
          {{ derajat.toFixed(1) }}°
        </p>
        <p class="text-sm text-slate-600">
          dari utara sejati, searah jarum jam · {{ posisi?.label }}
        </p>
        <button type="button" class="btn-primary" @click="aktifkanKompas">
          Aktifkan kompas (HP)
        </button>
        <p v-if="heading !== null" class="text-sm text-slate-600">
          Putar badan sampai panah menunjuk lurus ke atas.
        </p>
        <p v-if="compassError" class="text-sm text-rose-700">
          {{ compassError }}
        </p>
      </div>
    </section>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
