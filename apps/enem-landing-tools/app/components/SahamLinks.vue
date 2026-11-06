<script setup lang="ts">
/** Cross-links between investment tools (Story 54). */
const props = defineProps<{ current: string }>();
const TOOLS = [
  { slug: 'kalkulator-saham', label: 'Kalkulator saham' },
  { slug: 'kalkulator-average-saham', label: 'Average down' },
  { slug: 'kalkulator-dividen', label: 'Dividen' },
  { slug: 'simulasi-reksa-dana', label: 'Reksa dana' },
  { slug: 'kalkulator-investasi', label: 'Investasi rutin' },
];
</script>

<template>
  <nav class="flex flex-wrap gap-x-4 gap-y-1" aria-label="Tools investasi lain">
    <NuxtLink
      v-for="t in TOOLS.filter((x) => x.slug !== props.current)"
      :key="t.slug"
      :to="`/${t.slug}`"
      class="btn-link"
      >{{ t.label }}</NuxtLink
    >
  </nav>
</template>
