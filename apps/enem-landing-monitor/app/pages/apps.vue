<script lang="ts" setup>
import { ref } from 'vue';
import { useContainers } from '../composables/use-containers';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Apps' });

const tab = ref<'apps-prod' | 'apps-dev'>('apps-prod');
const { list: containers, error, refresh, loading } = useContainers();
</script>

<template>
  <div class="c-form-page">
    <CPageHeader
      title="Apps"
      subtitle="Container aktif stack enem-landing (prod) dan enem-landing-dev (dev), plus container sebelumnya."
    >
      <template #actions>
        <v-btn
          variant="tonal"
          prepend-icon="mdi-refresh"
          :loading="loading"
          @click="refresh"
          >Muat ulang</v-btn
        >
      </template>
    </CPageHeader>
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>
    <v-card rounded="lg" elevation="0" class="c-content-card">
      <v-tabs v-model="tab" color="primary">
        <v-tab value="apps-prod">Prod</v-tab>
        <v-tab value="apps-dev">Dev</v-tab>
      </v-tabs>
      <v-divider />
      <ContainerPanel
        :key="tab"
        :list="containers"
        :category="tab"
        empty-text="Tidak ada container di stack ini."
      />
    </v-card>
  </div>
</template>
