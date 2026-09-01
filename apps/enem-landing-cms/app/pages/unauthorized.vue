<script lang="ts" setup>
definePageMeta({ layout: false });
</script>

<template>
  <v-app>
    <v-main
      class="d-flex align-center justify-center"
      style="min-height: 100vh"
    >
      <div class="text-center pa-6">
        <v-icon size="64" color="error">mdi-shield-off-outline</v-icon>
        <h1 class="text-h5 font-weight-bold mt-4">Akses Ditolak</h1>
        <p class="text-medium-emphasis mt-2" style="max-width: 360px">
          Kamu tidak memiliki akses ke halaman ini.
        </p>
      </div>
    </v-main>
  </v-app>
</template>
