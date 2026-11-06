<script setup lang="ts">
import { cariKota, kotaTerdekat } from '~/utils/sholat/kota';

/**
 * City search + "use my location". The position never leaves the browser:
 * it is only used to pick the nearest city from the bundled list.
 */
const props = withDefaults(
  defineProps<{ basePath: string; label?: string }>(),
  {
    label: 'Cari kabupaten/kota',
  },
);

const query = ref('');
const results = computed(() => cariKota(query.value));
const locating = ref(false);
const error = ref('');

const pakaiLokasi = () => {
  if (!navigator.geolocation) {
    error.value = 'Browser ini tidak mendukung lokasi.';
    return;
  }
  locating.value = true;
  error.value = '';
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      locating.value = false;
      const kota = kotaTerdekat(
        position.coords.latitude,
        position.coords.longitude,
      );
      await navigateTo(`${props.basePath}/${kota.slug}`);
    },
    () => {
      locating.value = false;
      error.value = 'Lokasi tidak bisa dibaca. Cari kotamu secara manual.';
    },
    { timeout: 10_000, maximumAge: 600_000 },
  );
};
</script>

<template>
  <div class="card space-y-3">
    <label for="cari-kota" class="field-label">{{ label }}</label>
    <div class="flex flex-wrap gap-2">
      <input
        id="cari-kota"
        v-model="query"
        type="search"
        class="field-input grow"
        placeholder="Mis. Bandung, Sleman, Makassar"
        autocomplete="off"
      />
      <button
        type="button"
        class="btn-secondary"
        :disabled="locating"
        @click="pakaiLokasi"
      >
        {{ locating ? 'Mencari lokasi...' : 'Pakai lokasiku' }}
      </button>
    </div>
    <p class="field-hint">
      Lokasi hanya dipakai di perangkatmu untuk memilih kota terdekat, tidak
      dikirim ke server.
    </p>
    <p v-if="error" class="text-sm text-rose-700">{{ error }}</p>
    <ul
      v-if="results.length"
      class="divide-y divide-slate-100 rounded-xl border border-slate-200"
    >
      <li v-for="kota in results" :key="kota.slug">
        <NuxtLink
          :to="`${basePath}/${kota.slug}`"
          class="block px-3 py-2 hover:bg-slate-50"
        >
          <span class="font-medium">{{ kota.nama }}</span>
          <span class="text-sm text-slate-500"> · {{ kota.provinsi }}</span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
