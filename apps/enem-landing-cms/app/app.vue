<script setup lang="ts">
import { useGlobalSnackbar } from '@enem-landing/frontend';

// `state` is a ComputedRef - `<script setup>` + the template compiler
// auto-unwrap top-level refs, so `snackbarState.opened` below resolves to
// `snackbarState.value.opened`. Wrapping it in `reactive()` instead (as
// mau-apps' own app.vue does) breaks this: `reactive()` proxies the
// ComputedRef object itself, which has no `.opened` property, only `.value`.
const { state: snackbarState, reset: resetSnackbar } = useGlobalSnackbar();
</script>

<template>
  <NuxtLayout>
    <NuxtLoadingIndicator color="#1867c0" :height="3" />

    <NuxtPage />

    <v-snackbar
      :model-value="snackbarState.opened"
      :color="snackbarState.color"
      location="bottom end"
      @update:model-value="resetSnackbar(0)"
    >
      {{ snackbarState.text }}
    </v-snackbar>
  </NuxtLayout>
</template>
