<script setup lang="ts">
import { DISCLAIMER } from '~/data/kesehatan';

/** Shown above every health result (Story 34), not only in the footer. */
defineProps<{ extra?: string }>();
</script>

<template>
  <p
    class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
    role="note"
  >
    {{ DISCLAIMER }}<template v-if="extra"> {{ extra }}</template>
  </p>
</template>
