<script setup lang="ts">
/** Cross-links between tax tools (Story 55). */
const props = defineProps<{ current: string }>();
const TOOLS = [
  { slug: 'kalkulator-ppn', label: 'PPN' },
  { slug: 'kalkulator-pph-23', label: 'PPh 23' },
  { slug: 'kalkulator-pph-sewa', label: 'Pajak sewa' },
  { slug: 'simulasi-spt-tahunan', label: 'SPT tahunan' },
  { slug: 'kalkulator-gaji-bersih', label: 'Gaji bersih' },
  { slug: 'kalkulator-pph-umkm', label: 'PPh UMKM' },
  { slug: 'buat-invoice', label: 'Buat invoice' },
];
</script>

<template>
  <nav class="flex flex-wrap gap-x-4 gap-y-1" aria-label="Tools pajak lain">
    <NuxtLink
      v-for="t in TOOLS.filter((x) => x.slug !== props.current)"
      :key="t.slug"
      :to="`/${t.slug}`"
      class="btn-link"
      >{{ t.label }}</NuxtLink
    >
  </nav>
</template>
