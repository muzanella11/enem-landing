<script setup lang="ts">
/** Shown while files are processed - the "waiting area" ad lives here (Story 23). */
defineProps<{ message: string; slug: string; progress?: string }>();
</script>

<template>
  <div class="card space-y-4" aria-live="polite">
    <div class="flex items-center gap-3">
      <span
        class="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"
        aria-hidden="true"
      />
      <p class="font-medium">
        {{ message
        }}<span v-if="progress" class="text-slate-500"> ({{ progress }})</span>
      </p>
    </div>
    <AdSlot placement="result" :slug="slug" />
  </div>
</template>
