<script setup lang="ts">
import { WIDGET } from '~/data/distribusi';

/** Widget for other sites (Story 49): the calculator only, no ads, no tracking. */
definePageMeta({ layout: false });
const route = useRoute();
const slug = String(route.params['slug']);
if (!WIDGET.some((w) => w.slug === slug)) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Widget tidak tersedia',
    fatal: true,
  });
}
useEmbed().value = true;
const KOMPONEN = {
  'kalkulator-gaji-bersih': defineAsyncComponent(
    () => import('~/pages/kalkulator-gaji-bersih.vue'),
  ),
  'kalkulator-thr': defineAsyncComponent(
    () => import('~/pages/kalkulator-thr.vue'),
  ),
  'kalkulator-zakat': defineAsyncComponent(
    () => import('~/pages/kalkulator-zakat.vue'),
  ),
} as const;
const Komponen = KOMPONEN[slug as keyof typeof KOMPONEN];
</script>

<template>
  <div class="min-h-full bg-white text-slate-900">
    <component :is="Komponen" />
  </div>
</template>
