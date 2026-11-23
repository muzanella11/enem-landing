<script setup lang="ts">
import { useGlobalSnackbar } from '@enem-landing/frontend';

const { state: snackbarState, reset: resetSnackbar } = useGlobalSnackbar();
</script>

<template>
  <NuxtLayout>
    <NuxtLoadingIndicator color="#1abc9c" :height="5" />

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
