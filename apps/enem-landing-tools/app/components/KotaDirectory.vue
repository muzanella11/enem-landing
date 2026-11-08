<script setup lang="ts">
import { KOTA } from '~/data/sholat/kota';

/**
 * Every city grouped by province - also the internal links for SEO.
 * Rendered with `hydrate-never` by the schedule index pages: hydrating its
 * 500+ NuxtLinks was most of their Total Blocking Time on PageSpeed mobile.
 * The links work as normal page loads.
 */
defineProps<{ basePath: string; title: string }>();
const groups = computed(() => {
  const map = new Map<string, typeof KOTA>();
  for (const kota of KOTA)
    map.set(kota.provinsi, [...(map.get(kota.provinsi) ?? []), kota]);
  return [...map.entries()];
});
</script>

<template>
  <section class="mt-2">
    <h2 class="text-xl font-bold">{{ title }}</h2>
    <div class="mt-3 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
      <details
        v-for="[provinsi, list] in groups"
        :key="provinsi"
        class="rounded-xl border border-slate-200 bg-white p-3"
      >
        <summary class="cursor-pointer font-medium">
          {{ provinsi }}
          <span class="text-sm text-slate-500">({{ list.length }})</span>
        </summary>
        <ul class="mt-2 space-y-1 text-sm">
          <li v-for="kota in list" :key="kota.slug">
            <NuxtLink :to="`${basePath}/${kota.slug}`" class="btn-link">{{
              kota.nama
            }}</NuxtLink>
          </li>
        </ul>
      </details>
    </div>
  </section>
</template>
