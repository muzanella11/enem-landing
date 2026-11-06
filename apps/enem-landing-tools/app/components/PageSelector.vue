<script setup lang="ts">
/** "Semua halaman" or a range like 1-3, 5 (Story 32). */
defineProps<{ pageCount: number }>();
const semua = defineModel<boolean>('semua', { required: true });
const ranges = defineModel<string>('ranges', { required: true });
</script>

<template>
  <fieldset class="space-y-2">
    <legend class="field-label">Halaman ({{ pageCount }} halaman)</legend>
    <label class="flex items-center gap-2 text-sm">
      <input v-model="semua" type="radio" :value="true" name="halaman" />
      Semua halaman
    </label>
    <label class="flex items-center gap-2 text-sm">
      <input v-model="semua" type="radio" :value="false" name="halaman" />
      Halaman tertentu
    </label>
    <input
      v-if="!semua"
      v-model="ranges"
      aria-label="Halaman yang dipilih"
      placeholder="mis. 1-3, 5"
      class="field-input"
    />
  </fieldset>
</template>
