<script setup lang="ts">
/** Cross-links between UMKM tools (Story 43). */
const props = defineProps<{ current: string }>();
const TOOLS = [
  { slug: 'kalkulator-hpp', label: 'HPP' },
  { slug: 'kalkulator-harga-jual', label: 'Harga jual' },
  { slug: 'kalkulator-bep', label: 'Titik impas (BEP)' },
  { slug: 'kalkulator-fee-marketplace', label: 'Fee marketplace' },
  { slug: 'kalkulator-pph-umkm', label: 'PPh UMKM 0,5%' },
  { slug: 'buat-invoice', label: 'Buat invoice' },
  { slug: 'buat-kwitansi', label: 'Buat kwitansi' },
];
</script>

<template>
  <nav class="flex flex-wrap gap-x-4 gap-y-1" aria-label="Tools UMKM lain">
    <NuxtLink
      v-for="tool in TOOLS.filter((t) => t.slug !== props.current)"
      :key="tool.slug"
      :to="`/${tool.slug}`"
      class="btn-link"
      >{{ tool.label }}</NuxtLink
    >
  </nav>
</template>
