<script lang="ts" setup>
definePageMeta({ layout: 'dashboard' });
useHead({ title: 'About' });

const { public: publicConfig } = useRuntimeConfig();
</script>

<template>
  <v-container>
    <v-card max-width="480">
      <v-card-title>enem-landing-cms</v-card-title>
      <v-card-text>
        <p class="mb-2">Admin dashboard untuk mengelola konten enem-landing.</p>
        <p class="text-caption text-medium-emphasis">
          Account service: {{ publicConfig.accountWebHost }}
        </p>
      </v-card-text>
    </v-card>
  </v-container>
</template>
