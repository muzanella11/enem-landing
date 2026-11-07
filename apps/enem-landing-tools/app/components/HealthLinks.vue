<script setup lang="ts">
/** Cross-links between the health tools (Story 34). */
const props = defineProps<{ current: string }>();
const TOOLS = [
  { slug: 'hitung-hpl', label: 'Hitung HPL' },
  { slug: 'kalkulator-masa-subur', label: 'Kalkulator masa subur' },
  { slug: 'kalkulator-bmi', label: 'Kalkulator BMI' },
  { slug: 'kalkulator-kalori', label: 'Kalkulator kalori' },
];
const links = TOOLS.filter((tool) => tool.slug !== props.current);
</script>

<template>
  <nav class="flex flex-wrap gap-x-4 gap-y-1" aria-label="Tools kesehatan lain">
    <NuxtLink
      v-for="tool in links"
      :key="tool.slug"
      :to="`/${tool.slug}`"
      class="btn-link"
      >{{ tool.label }}</NuxtLink
    >
  </nav>
</template>
