<script lang="ts" setup>
import {
  TRACKING_SITE_OPTIONS,
  useTrackingSite,
} from '../composables/use-tracking-site';

const { site } = useTrackingSite();
</script>

<template>
  <v-btn-toggle
    v-model="site"
    mandatory
    density="comfortable"
    variant="outlined"
    color="primary"
    divided
    aria-label="Pilih situs"
  >
    <v-btn
      v-for="option in TRACKING_SITE_OPTIONS"
      :key="option.value"
      :value="option.value"
      size="small"
      >{{ option.title }}</v-btn
    >
  </v-btn-toggle>
</template>
