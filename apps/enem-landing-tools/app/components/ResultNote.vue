<script setup lang="ts">
/** A disclaimer placed right by a result (Story 41 and later). */
defineProps<{ text: string }>();
</script>

<template>
  <p
    class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
    role="note"
  >
    {{ text }}
  </p>
</template>
